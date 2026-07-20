import type mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { triggerN8nWorkflow } from "#lib/n8n/client";
import connectDB from "#utils/database/connect";
import { deductInventoryForOrder } from "#utils/database/helper/deductInventory";
import { Accounts } from "#utils/database/models/account";
import { computePoints, computeTier, Loyalties } from "#utils/database/models/loyalty";
import { Menus, type TMenu } from "#utils/database/models/menu";
import { Orders, type TOrder, type TProduct } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { rateLimitMiddleware } from "#utils/helper/rateLimit";
import { captureError } from "#utils/helper/sentryWrapper";
import { orderPlaceSchema } from "#utils/helper/validation";

export async function POST(req: Request) {
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

		const restaurantID = session?.restaurant?.username;
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
				};
			}),
		);

		const order = await Orders.findOne<TOrder>({ restaurantID, customer, state: "active" });

		if (order) {
			order.products = [...order.products, ...products];
			await order.save();

			return NextResponse.json({ status: 200, message: "Additional items ordered successfully" });
		}

		const newOrder = new Orders({
			restaurantID,
			table,
			customer,
			paymentGateway: paymentMethod,
			state: paymentMethod === "cash" ? "active" : undefined,
			products,
			cartSnapshot: {
				items: products.map((p) => ({
					name: p.name || "Menu Item",
					price: p.price,
					tax: p.tax,
					quantity: p.quantity,
					veg: p.veg || "veg",
				})),
				subtotal: products.reduce((s, p) => s + p.price * p.quantity, 0),
				taxTotal: products.reduce((s, p) => s + p.tax * p.quantity, 0),
				grandTotal: 0,
			},
		});
		newOrder.cartSnapshot.grandTotal = newOrder.cartSnapshot.subtotal + newOrder.cartSnapshot.taxTotal;
		await newOrder.save();

		if (customer) {
			try {
				let loyalty = await Loyalties.findOne({ restaurantID, customer });
				if (!loyalty) loyalty = await Loyalties.create({ restaurantID, customer });
				const earnedPoints = computePoints(newOrder.orderTotal || 0, loyalty.tier);
				loyalty.points += earnedPoints;
				loyalty.lifetimePoints += earnedPoints;
				loyalty.lastVisit = new Date();
				loyalty.visitCount += 1;
				const newTier = computeTier(loyalty.lifetimePoints);
				if (newTier !== loyalty.tier) {
					loyalty.tier = newTier;
					triggerN8nWorkflow("loyalty.tier_upgraded", {
						customerId: customer,
						restaurantID,
						newTier,
					}).catch(() => {});
				}
				await loyalty.save();
			} catch {
				captureError(new Error("Failed to award loyalty points"), { route: "order/place/loyalty" });
			}
		}

		triggerN8nWorkflow("order.created", {
			orderId: newOrder._id.toString(),
			restaurantID,
			table,
			items: products.map((p) => ({ name: p.name || "Item", quantity: p.quantity, price: p.price })),
			total: (newOrder.orderTotal || 0) + (newOrder.taxTotal || 0),
		}).catch(() => {});

		if (restaurantID) {
			const inventoryProducts = products.map((p) => ({
				product: typeof p.product === "object" ? (p.product as { _id: mongoose.Types.ObjectId })._id : p.product,
				quantity: p.quantity,
			})) as Array<{ product: mongoose.Types.ObjectId; quantity: number }>;
			deductInventoryForOrder(restaurantID, inventoryProducts).catch((e: unknown) =>
				captureError(e, { context: "inventory deduction failed", orderId: newOrder._id.toString() }),
			);
		}

		return NextResponse.json({ status: 200, message: "Order placed successfully", orderId: newOrder._id });
	} catch (err) {
		captureError(err, { route: "/api/order/place" });
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
