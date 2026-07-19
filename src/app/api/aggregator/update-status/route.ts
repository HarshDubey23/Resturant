import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { AggregatorOrders } from "#utils/database/models/aggregatorOrder";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		const { orderId, status } = await req.json();
		if (!orderId || !status) throw { status: 400, message: "orderId and status required" };

		const validStatuses = ["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];
		if (!validStatuses.includes(status)) throw { status: 400, message: `Invalid status. Valid: ${validStatuses.join(", ")}` };

		await connectDB();

		const order = await AggregatorOrders.findOneAndUpdate({ _id: orderId, restaurantID: session.username }, { status }, { new: true });

		if (!order) throw { status: 404, message: "Order not found" };

		return NextResponse.json({ status: 200, message: `Order marked as ${status}`, order });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}
