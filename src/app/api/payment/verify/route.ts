import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { verifyPaymentSignature } from "#utils/payment/razorpay";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const body = await req.json();
		const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

		if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
			throw { status: 400, message: "Missing required payment verification fields" };
		}

		const isValid = await verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
		if (!isValid) throw { status: 400, message: "Invalid payment signature" };

		await connectDB();

		const order = await Orders.findById(orderId);
		if (!order) throw { status: 404, message: "Order not found" };

		order.paymentStatus = "paid";
		order.paymentId = razorpayPaymentId;
		await order.save();

		return NextResponse.json({ status: 200, message: "Payment verified successfully" });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}
