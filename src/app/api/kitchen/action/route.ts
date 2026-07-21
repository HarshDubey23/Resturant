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

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

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

		const product = order.products.find((p: { _id?: { toString(): string } }) => p._id?.toString() === productId);
		if (!product) throw { status: 404, message: "Product not found in order" };

		product.kitchenStatus = action;

		if (action === "ready") {
			product.fulfilled = true;
		}

		const allFulfilled = order.products.every((p: { fulfilled: boolean }) => p.fulfilled);
		if (allFulfilled) {
			order.state = "complete";
		}

		await order.save();

		if (action === "ready" && order.restaurantID) {
			const productName = (product as unknown as { name?: string }).name || "Item";
			sendProductReadyNotification(orderId, order.restaurantID, productName).catch((e: unknown) => captureError(e, { context: "sendProductReadyNotification" }));
		}

		if (allFulfilled && order.restaurantID) {
			sendOrderReadyNotification(orderId, order.restaurantID).catch((e: unknown) => captureError(e, { context: "sendOrderReadyNotification" }));
		}

		return NextResponse.json({ status: 200, message: `Product marked as ${action}` });
	} catch (err) {
		return CatchNextResponse(err);
	}
}
