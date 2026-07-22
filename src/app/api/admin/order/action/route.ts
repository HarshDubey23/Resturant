import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Orders, type TOrder } from "#utils/database/models/order";
import { CatchNextResponse } from "#utils/helper/common";
import { withPermission } from "#utils/helper/rbac";

const actions = ["accept", "reject", "rejectOnActive", "complete"];

export const POST = withPermission("orders.write", async (req, session) => {
	try {
		const body = await req.json();

		if (!body?.orderID) throw { status: 400, message: "Order id is required to perform an action" };
		if (!actions.includes(body?.action)) throw { status: 400, message: "Invalid action provided" };

		await connectDB();

		const order = await Orders.findById<TOrder>(body?.orderID);
		if (!order) throw { status: 400, message: `Order with id: ${body?.orderID} not found` };
		if (order.restaurantID !== session.username) throw { status: 403, message: "Access denied. Order belongs to another restaurant." };

		if (body.action === "accept")
			order.products.forEach((product) => {
				product.adminApproved = true;
			});

		if (body.action === "reject") {
			if (!order.products.some(({ adminApproved }) => adminApproved)) order.state = "reject";
			else order.products = order.products.filter(({ adminApproved }) => adminApproved);
		}

		if (body.action === "rejectOnActive") order.state = "reject";

		if (body.action === "complete") order.state = "complete";

		await order.save();

		return NextResponse.json({ status: 200, message: "Order placed successfully" });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
