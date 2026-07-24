import type mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { triggerN8nWorkflow } from "#lib/n8n/client";
import connectDB from "#utils/database/connect";
import { restoreInventoryForOrder } from "#utils/database/helper/deductInventory";
import { clawbackPointsAtomic } from "#utils/database/helper/loyalty";
import { computePoints, Loyalties } from "#utils/database/models/loyalty";
import { Orders, type TOrder } from "#utils/database/models/order";
import { recordAudit } from "#utils/helper/audit";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) throw { status: 401, message: "Authentication Required" };

		await connectDB();

		const restaurantID = session?.restaurant?.username;
		const customer = session?.customer?._id;
		// FIX (audit B1/cancel): only allow cancellation of orders that have
		// not yet been completed/rejected/cancelled. Previously any state was
		// silently flipped to "cancel", allowing a customer to "cancel" an
		// already-completed order and walk away without paying.
		const order = await Orders.findOne<TOrder>({ restaurantID, customer, state: { $in: ["active", "pending_payment"] } });

		if (!order) throw { status: 400, message: "No cancellable order found (orders can only be cancelled before completion)" };

		const wasPaid = order.paymentStatus === "paid";
		const previousState = order.state;
		const orderIdStr = order._id.toString();

		// Restore inventory so cancelled items are immediately available for
		// the next customer. Each product in the order had its recipe
		// ingredients deducted at place time — reverse them now.
		const inventoryProducts = order.products
			.map((p) => {
				const raw = p.product as unknown;
				// p.product is either a mongoose.Types.ObjectId (unpopulated)
				// or a populated TMenu object. The deduction helper expects
				// an ObjectId; extract it from either shape.
				const productRef =
					typeof raw === "object" && raw !== null && "_id" in raw ? (raw as { _id: mongoose.Types.ObjectId })._id : (raw as mongoose.Types.ObjectId);
				if (!productRef) return null;
				return { product: productRef, quantity: p.quantity };
			})
			.filter((p): p is { product: mongoose.Types.ObjectId; quantity: number } => p !== null);

		if (restaurantID && inventoryProducts.length) {
			await restoreInventoryForOrder(restaurantID, inventoryProducts).catch((e: unknown) =>
				captureError(e, { context: "inventory-restore-on-cancel", orderId: orderIdStr }),
			);
		}

		// Claw back loyalty points if they were already awarded for this order.
		// Points are awarded on payment success (see /api/payment/webhook); a
		// post-payment cancel must reclaim them so a customer cannot cancel-and-
		// keep-points. Floor at 0 — see clawbackPointsAtomic.
		if (order.loyaltyAwarded && restaurantID && customer) {
			const loyalty = await Loyalties.findOne({ restaurantID, customer }).lean();
			const tierBefore = loyalty?.tier ?? "silver";
			const pointsToClawback = computePoints(order.orderTotal || 0, tierBefore);
			if (pointsToClawback > 0) {
				await clawbackPointsAtomic(restaurantID, customer, pointsToClawback).catch((e: unknown) =>
					captureError(e, { context: "loyalty-clawback-failed", orderId: orderIdStr }),
				);
			}
		}

		// Trigger refund for paid orders. The actual refund is processed by the
		// payment gateway via the n8n `order.refund_initiated` event; the
		// payment webhook marks paymentStatus "refunded" once the gateway
		// confirms. Cash orders are marked refunded immediately (no gateway).
		if (wasPaid) {
			if (order.paymentGateway === "cash") {
				order.paymentStatus = "refunded";
			} else if (restaurantID) {
				// Fire-and-forget is OK here because the n8n workflow is
				// idempotent (keyed on orderId) and the order state transition
				// does not depend on its success — the webhook will still mark
				// the refund when the gateway confirms.
				triggerN8nWorkflow("order.refund_initiated", {
					orderId: orderIdStr,
					restaurantID,
					paymentId: order.paymentId,
					amount: (order.orderTotal || 0) + (order.taxTotal || 0) - (order.discountAmount || 0),
					customer: customer?.toString(),
				}).catch((e: unknown) => captureError(e, { context: "n8n order.refund_initiated failed", orderId: orderIdStr }));
				order.paymentStatus = "refunded";
			}
		}

		order.state = "cancel";
		await order.save();

		// Audit log: who cancelled which order, with the financial state at
		// cancellation time. recordAudit is best-effort (never throws to the
		// caller) so it cannot block the cancel.
		await recordAudit({
			restaurantID: restaurantID ?? "unknown",
			session: { username: restaurantID ?? customer?.toString() ?? "unknown", role: session.role ?? "customer" },
			action: "customer_order_cancel",
			targetType: "order",
			targetId: orderIdStr,
			metadata: {
				previousState,
				paymentStatus: order.paymentStatus,
				wasPaid,
				orderTotal: order.orderTotal,
				taxTotal: order.taxTotal,
				discountAmount: order.discountAmount,
				customer: customer?.toString(),
			},
			ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
			userAgent: req.headers.get("user-agent") ?? undefined,
		}).catch((e: unknown) => captureError(e, { context: "audit-log-cancel-failed", orderId: orderIdStr }));

		// Notify downstream systems. Idempotent (keyed on orderId).
		if (restaurantID) {
			triggerN8nWorkflow("order.cancelled", {
				orderId: orderIdStr,
				restaurantID,
				customer: customer?.toString(),
				wasPaid,
			}).catch((e: unknown) => captureError(e, { context: "n8n order.cancelled failed", orderId: orderIdStr }));
		}

		return NextResponse.json({ status: 200, message: "Order canceled." });
	} catch (err) {
		// FIX (audit console.log sweep): replace console.log with captureError
		// so cancellation failures are reported to Sentry, not swallowed.
		captureError(err, { route: "/api/order/cancel" });
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
