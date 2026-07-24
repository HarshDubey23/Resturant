import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";
import { sendOrderReadyNotification, sendProductReadyNotification } from "#utils/whatsapp/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Roles permitted to call this route (take any kitchen action).
const STAFF_ROLES = ["admin", "owner", "manager", "cashier", "kitchen", "chef"];

// Roles permitted to mark an order `complete`. Kitchen/chef can only advance
// items to `ready` — final completion requires a front-of-house role so an
// unpaid order can never be silently closed out.
const COMPLETION_ROLES = ["admin", "owner", "manager", "cashier"];

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		// Broken access control fix: only staff-level roles may transition
		// kitchen order states. Customers must receive 403, not silent success.
		const role = session.role as string;
		if (!STAFF_ROLES.includes(role)) {
			captureError(new Error(`Forbidden kitchen action attempt by role '${role}'`), {
				route: "/api/kitchen/action",
				role,
			});
			throw { status: 403, message: "Forbidden: staff access required" };
		}

		const body = await req.json();
		const { orderId, productId, action } = body;

		if (!orderId || !productId || !action) {
			throw { status: 400, message: "orderId, productId, and action are required" };
		}

		const validActions = ["preparing", "ready", "served"];
		if (!validActions.includes(action)) {
			throw { status: 400, message: "Invalid action. Must be one of: preparing, ready, served" };
		}

		await connectDB();

		const order = await Orders.findById(orderId);
		if (!order) throw { status: 404, message: "Order not found" };

		const sessionRestaurant = session.restaurant?.username || session.username;
		if (order.restaurantID !== sessionRestaurant) throw { status: 403, message: "Access denied. Order belongs to another restaurant." };

		// FIX (audit B5): the kitchen must never auto-complete an unpaid order.
		// Previously, once every item was `fulfilled`, the route set
		// `order.state = "complete"` regardless of payment status — letting
		// customers walk out without paying. Now completion requires BOTH
		// payment in `paid` state AND a front-of-house role (admin/owner/
		// manager/cashier). Kitchen-only staff advancing the last item to
		// `ready` leave the order in an "Awaiting Payment" state.
		if (order.state === "pending_payment") {
			throw { status: 409, message: "Order is awaiting payment confirmation and cannot be processed by the kitchen yet." };
		}

		const product = order.products.find((p: { _id?: { toString(): string } }) => p._id?.toString() === productId);
		if (!product) throw { status: 404, message: "Product not found in order" };

		product.kitchenStatus = action;

		if (action === "ready") {
			product.fulfilled = true;
		}

		const allFulfilled = order.products.every((p: { fulfilled: boolean }) => p.fulfilled);

		let awaitingPayment = false;
		let completionBlocked = false;

		if (allFulfilled) {
			if (order.paymentStatus === "paid" && COMPLETION_ROLES.includes(role)) {
				order.state = "complete";
			} else if (order.paymentStatus !== "paid") {
				// Unpaid but all items ready — hold in the current state so the
				// cashier can collect payment before the order closes.
				awaitingPayment = true;
			} else {
				// Paid but the acting role is kitchen-only — they cannot close
				// the order; a manager/cashier must do it.
				completionBlocked = true;
			}
		}

		await order.save();

		if (action === "ready" && order.restaurantID) {
			const productName = (product as unknown as { name?: string }).name || "Item";
			sendProductReadyNotification(orderId, order.restaurantID, productName).catch((e: unknown) => captureError(e, { context: "sendProductReadyNotification" }));
		}

		if (allFulfilled && order.restaurantID && !awaitingPayment && !completionBlocked) {
			sendOrderReadyNotification(orderId, order.restaurantID).catch((e: unknown) => captureError(e, { context: "sendOrderReadyNotification" }));
		}

		let message = `Product marked as ${action}`;
		if (awaitingPayment) {
			message = `Product marked as ${action}. Order is awaiting payment — a cashier must collect payment before the order can be completed.`;
		} else if (completionBlocked) {
			message = `Product marked as ${action}. Order completion requires an admin, owner, manager, or cashier.`;
		}

		return NextResponse.json({ status: 200, message, awaitingPayment, completionBlocked });
	} catch (err) {
		return CatchNextResponse(err);
	}
}
