import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Orders, type TOrder } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { createRazorpayOrder } from "#utils/payment/razorpay";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const { orderId } = await req.json();
		if (!orderId) throw { status: 400, message: "Order ID is required" };

		await connectDB();

		const order = await Orders.findById<TOrder>(orderId);
		if (!order) throw { status: 404, message: "Order not found" };
		if (order.paymentStatus === "paid") throw { status: 400, message: "Order already paid" };

		const sessionRestaurant = session.restaurant?.username || session.username;
		if (order.restaurantID !== sessionRestaurant) throw { status: 403, message: "Access denied. Order belongs to another restaurant." };

		const amountInPaise = Math.round((order.orderTotal + order.taxTotal) * 100);
		const receipt = `order_${order._id?.toString()?.slice(-12)}`;

		const razorpayOrder = await createRazorpayOrder({
			amount: amountInPaise,
			currency: "INR",
			receipt,
			notes: {
				restaurantID: order.restaurantID,
				table: order.table,
				orderId: order._id?.toString() || "",
			},
		});

		return NextResponse.json({
			orderId: razorpayOrder.id,
			amount: razorpayOrder.amount,
			currency: razorpayOrder.currency,
			key: process.env.RAZORPAY_KEY_ID,
		});
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}
