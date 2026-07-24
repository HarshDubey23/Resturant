import type mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { triggerN8nWorkflow } from "#lib/n8n/client";
import connectDB from "#utils/database/connect";
import { rollbackCouponUsage, validateAndRedeemCoupon } from "#utils/database/helper/coupon";
import { deductInventoryForOrder, restoreInventoryForOrder } from "#utils/database/helper/deductInventory";
import { Accounts } from "#utils/database/models/account";
import { Menus, type TMenu } from "#utils/database/models/menu";
import { Orders, type TOrder, type TProduct } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { rateLimitMiddleware } from "#utils/helper/rateLimit";
import { captureError } from "#utils/helper/sentryWrapper";
import { orderPlaceSchema } from "#utils/helper/validation";
import { sendOrderConfirmation } from "#utils/whatsapp/notifications";

export async function POST(req: Request) {
	// Track coupon + inventory side-effects so we can unwind them on any failure
	// in the place flow (audit fix B1 + B3). Without this, a coupon's usedCount
	// could be bumped or inventory deducted even though the order never saved.
	let redeemedCouponCode: string | undefined;
	let redeemedRestaurantID: string | undefined;
	let deductedInventory: Array<{ product: mongoose.Types.ObjectId; quantity: number }> | null = null;
	// Declared at function scope so the outer catch can use it for inventory
	// restore even when no coupon was redeemed (e.g. body had no couponCode).
	let restaurantID: string | undefined;

	try {
		const session = await getServerSession(authOptions);
		const body = await req.json();

		if (!session) throw { status: 401, message: "Authentication Required" };

		const paymentMethod = body.paymentMethod || "razorpay";

		const parsed = orderPlaceSchema.safeParse(body);
		if (!parsed.success) throw { status: 400, message: parsed.error.flatten().fieldErrors?.products?.[0] ?? "Invalid request" };

		const ip = req.headers.get("x-forwarded-for") ?? "unknown";
		const rateLimitResponse = await rateLimitMiddleware(`order:${ip}`, 5, 60000);
		if (rateLimitResponse) return rateLimitResponse;

		await connectDB();

		restaurantID = session?.restaurant?.username;
		const table = session?.restaurant?.table;
		const customer = session?.customer?._id;

		const account = await Accounts.findOne({ username: restaurantID }).populate("profile");
		const gstInclusive = (account?.profile as { gstInclusive?: boolean } | null)?.gstInclusive ?? false;

		const products: TProduct[] = await Promise.all(
			body?.products?.map(async (product: TProduct & { _id: string }) => {
				const menuItem = await Menus.findById<TMenu>(product?._id).lean();

				if (!menuItem) throw { status: 404, message: "Ordered product(s) not found." };
				const rawTax = (menuItem?.price * menuItem?.taxPercent) / 100;
				const tax = gstInclusive ? Number((menuItem.price - menuItem.price / (1 + menuItem.taxPercent / 100)).toFixed(2)) : Number(rawTax.toFixed(2));
				return {
					product: product?._id,
					quantity: product?.quantity,
					price: menuItem?.price,
					tax,
					station: (menuItem as { station?: string })?.station ?? "main",
				};
			}),
		);

		const subtotal = products.reduce((s, p) => s + p.price * p.quantity, 0);
		const taxTotal = products.reduce((s, p) => s + p.tax * p.quantity, 0);

		const order = await Orders.findOne<TOrder>({ restaurantID, customer, state: "active" });

		// FIX (audit B1): compute the final (possibly merged) cart total BEFORE
		// redeeming the coupon. Previously the coupon was redeemed before the
		// merge check, so a merged order bumped `usedCount` but never received
		// the discount — a direct money-loss bug for the customer.
		const baseSubtotal = (order?.orderTotal ?? 0) + subtotal;
		const baseTaxTotal = (order?.taxTotal ?? 0) + taxTotal;
		const baseTotal = baseSubtotal + baseTaxTotal;

		let couponCode: string | undefined;
		let discountAmount = 0;
		if (body.couponCode && restaurantID) {
			const coupon = await validateAndRedeemCoupon(body.couponCode, restaurantID, baseTotal);
			if (coupon) {
				couponCode = coupon.code;
				discountAmount = coupon.discountAmount;
				redeemedCouponCode = coupon.code;
				redeemedRestaurantID = restaurantID;
			}
		}

		// Helper to undo the coupon redemption if the order fails to save.
		const undoCoupon = async (context: string) => {
			if (!redeemedCouponCode || !redeemedRestaurantID) return;
			await rollbackCouponUsage(redeemedCouponCode, redeemedRestaurantID).catch((e) => captureError(e, { context, code: redeemedCouponCode }));
			redeemedCouponCode = undefined;
			redeemedRestaurantID = undefined;
		};

		// FIX (audit B3): await the inventory deduction. Previously it was
		// fire-and-forget (.catch), which meant an out-of-stock item was
		// silently ignored — the order was placed anyway and the customer
		// was charged for items the kitchen could never fulfil.
		const inventoryProducts = products.map((p) => ({
			product: typeof p.product === "object" ? (p.product as { _id: mongoose.Types.ObjectId })._id : p.product,
			quantity: p.quantity,
		})) as Array<{ product: mongoose.Types.ObjectId; quantity: number }>;

		if (restaurantID && inventoryProducts.length) {
			try {
				await deductInventoryForOrder(restaurantID, inventoryProducts);
				deductedInventory = inventoryProducts;
			} catch (invErr) {
				// Inventory helper already rolled back its own partial deductions.
				// We still need to roll back the coupon so the customer's quota
				// is not consumed by a failed order.
				await undoCoupon("coupon-rollback-after-inventory-failed");
				throw invErr; // surfaces as 409 with the out-of-stock item message
			}
		}

		if (order) {
			// Merge path: apply the discount to the merged order. Previously the
			// discount was discarded here, but the coupon's usedCount had already
			// been bumped — the customer paid full price for the merged total
			// but lost their coupon.
			order.products = [...order.products, ...products];
			if (couponCode) {
				order.couponCode = couponCode;
				order.discountAmount = (order.discountAmount ?? 0) + discountAmount;
			}
			// Tip (Phase 3, Feature 4): a tip forwarded from CartPage's TipSelector
			// is accumulated on the merged order's tip.amount. Negative tips are
			// rejected; a zero tip is a no-op.
			const mergeTipAmount = Number(body?.tip?.amount);
			if (Number.isFinite(mergeTipAmount) && mergeTipAmount > 0) {
				order.tip = {
					amount: (order.tip?.amount ?? 0) + mergeTipAmount,
					waiterId: body?.tip?.waiterId ?? order.tip?.waiterId,
					waiterName: body?.tip?.waiterName ?? order.tip?.waiterName,
					tippedAt: new Date(),
				};
			}

			try {
				await order.save();
			} catch (saveErr) {
				// Order save failed AFTER inventory was deducted — restore stock
				// and roll back the coupon so neither side-effect lingers.
				if (restaurantID && deductedInventory) {
					await restoreInventoryForOrder(restaurantID, deductedInventory).catch((e) =>
						captureError(e, { context: "inventory-restore-after-merge-save-failed", orderId: order._id.toString() }),
					);
				}
				await undoCoupon("coupon-rollback-after-merge-save-failed");
				throw saveErr;
			}

			triggerN8nWorkflow("order.merge", {
				orderId: order._id.toString(),
				restaurantID,
				table,
				addedItems: products.map((p) => ({ name: p.name || "Item", quantity: p.quantity, price: p.price })),
			}).catch((e: unknown) => captureError(e, { context: "n8n order.merge failed" }));

			return NextResponse.json({ status: 200, message: "Additional items ordered successfully" });
		}

		// FIX (audit B2): non-cash orders must NOT default to "active".
		// Mongoose's schema default ("active") was previously reached because
		// the route passed `state: undefined` — meaning unpaid Razorpay/Stripe
		// orders went straight to the kitchen. Mark them "pending_payment"
		// instead; the payment-verified webhook/verify routes flip them to
		// "active" only after capture.
		// Tip (Phase 3, Feature 4): persist the optional staff tip forwarded by
		// CartPage's TipSelector. Negative tips are rejected upstream by zod; a
		// missing/zero tip leaves the schema default (amount: 0).
		const tipAmount = Number(body?.tip?.amount);
		const tip =
			Number.isFinite(tipAmount) && tipAmount > 0
				? { amount: tipAmount, waiterId: body?.tip?.waiterId, waiterName: body?.tip?.waiterName, tippedAt: new Date() }
				: undefined;

		const newOrder = new Orders({
			restaurantID,
			table,
			customer,
			paymentGateway: paymentMethod,
			state: paymentMethod === "cash" ? "active" : "pending_payment",
			products,
			couponCode,
			discountAmount,
			tip,
			cartSnapshot: {
				items: products.map((p) => ({
					name: p.name || "Menu Item",
					price: p.price,
					tax: p.tax,
					quantity: p.quantity,
					veg: p.veg || "veg",
				})),
				subtotal,
				taxTotal,
				grandTotal: 0,
			},
		});
		newOrder.cartSnapshot.grandTotal = baseTotal - discountAmount;

		try {
			await newOrder.save();
		} catch (saveErr) {
			// Order save failed AFTER inventory was deducted — restore stock
			// and roll back the coupon.
			if (restaurantID && deductedInventory) {
				await restoreInventoryForOrder(restaurantID, deductedInventory).catch((e) => captureError(e, { context: "inventory-restore-after-save-failed" }));
			}
			await undoCoupon("coupon-rollback-after-save-failed");
			throw saveErr;
		}

		// FIX (audit B4): loyalty points are NO LONGER awarded on order place.
		// They are awarded ONLY on payment success (see /api/payment/webhook and
		// /api/payment/verify) so a cancelled/refunded order can never have
		// already minted points. The loyaltyAwarded field gates double-award.

		triggerN8nWorkflow("order.created", {
			orderId: newOrder._id.toString(),
			restaurantID,
			table,
			items: products.map((p) => ({ name: p.name || "Item", quantity: p.quantity, price: p.price })),
			total: baseTotal - discountAmount,
		}).catch(() => {});

		if (restaurantID && customer) {
			sendOrderConfirmation(newOrder._id.toString(), restaurantID).catch((e: unknown) => captureError(e, { context: "WhatsApp order confirmation failed" }));
		}

		return NextResponse.json({ status: 200, message: "Order placed successfully", orderId: newOrder._id });
	} catch (err) {
		captureError(err, { route: "/api/order/place" });
		// Last-resort unwind if an unexpected error escaped the inner try
		// blocks (e.g. menu lookup threw after coupon redemption but before
		// inventory deduction, or Orders constructor threw after deduction
		// but before save). Each side-effect is unwound independently so a
		// partial failure can never leave a coupon consumed or stock
		// deducted for an order that was never persisted.
		if (redeemedCouponCode && redeemedRestaurantID) {
			await rollbackCouponUsage(redeemedCouponCode, redeemedRestaurantID).catch((e) => captureError(e, { context: "coupon-rollback-outer-catch" }));
		}
		if (deductedInventory && restaurantID) {
			await restoreInventoryForOrder(restaurantID, deductedInventory).catch((e) => captureError(e, { context: "inventory-restore-outer-catch" }));
		}
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
