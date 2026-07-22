import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { refundPayment } from "#utils/payment/razorpay";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		const { orderId } = await req.json();
		if (!orderId) throw { status: 400, message: "Order ID is required" };

		await connectDB();

		const order = await Orders.findById(orderId);
		if (!order) throw { status: 404, message: "Order not found" };
		if (order.restaurantID !== session.username) throw { status: 403, message: "Access denied. Order belongs to another restaurant." };
		if (!order.paymentId) throw { status: 400, message: "No payment to refund" };
		if (order.paymentStatus === "refunded") throw { status: 400, message: "Already refunded" };

		const refund = await refundPayment(order.paymentId);
		order.paymentStatus = "refunded";
		await order.save();

		return NextResponse.json({ status: 200, message: "Refund initiated", refund });
	} catch (err) {
		return CatchNextResponse(err);
	}
}
