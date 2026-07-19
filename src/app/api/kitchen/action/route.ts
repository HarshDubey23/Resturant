import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

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

		return NextResponse.json({ status: 200, message: `Product marked as ${action}` });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}
