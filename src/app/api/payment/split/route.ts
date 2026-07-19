import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { createPaymentLink } from "#utils/payment/razorpay";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const { orderId, splits } = await req.json();
		if (!orderId || !splits || !Array.isArray(splits) || splits.length < 2) {
			throw { status: 400, message: "orderId and splits array (min 2) required" };
		}

		await connectDB();

		const order = await Orders.findById(orderId).populate("customer");
		if (!order) throw { status: 404, message: "Order not found" };

		const totalAmount = (order.orderTotal || 0) + (order.taxTotal || 0);
		const splitAmount = Math.round((totalAmount / splits.length) * 100);

		const links = await Promise.all(
			splits.map((split: { name: string; phone: string; email?: string }, index: number) =>
				createPaymentLink({
					amount: splitAmount,
					description: `Split payment for Table ${order.table} (${index + 1}/${splits.length})`,
					customer: {
						name: split.name,
						email: split.email || `${split.phone}@split.order`,
						contact: split.phone,
					},
					notes: {
						orderId: order._id?.toString() || "",
						splitIndex: String(index),
						totalSplits: String(splits.length),
						type: "split_payment",
					},
				}).catch(() => null),
			),
		);

		const successfulLinks = links.filter(Boolean);
		if (successfulLinks.length === 0) throw { status: 502, message: "Failed to create payment links" };

		return NextResponse.json({
			status: 200,
			message: `${successfulLinks.length} of ${splits.length} payment links created`,
			links: successfulLinks,
			splitAmount: splitAmount / 100,
		});
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}
