import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Invoices } from "#utils/database/models/invoice";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const { searchParams } = new URL(req.url);
		const orderId = searchParams.get("orderId");

		if (!orderId) throw { status: 400, message: "orderId query parameter is required" };

		await connectDB();

		if (session.role === "admin") {
			const restaurantID = session.restaurant?.username || session.username;

			const invoices = await Invoices.find({ restaurantID, order: orderId }).populate("order").sort({ generatedAt: -1 }).lean();

			if (!invoices || invoices.length === 0) throw { status: 404, message: "No invoices found for this order" };

			return NextResponse.json(invoices);
		}

		if (session.role === "customer") {
			const restaurantID = session.restaurant?.username || session.username;
			const customerId = session.customer?._id;

			const order = await Orders.findOne({ _id: orderId, restaurantID, customer: customerId }).lean();
			if (!order) throw { status: 403, message: "Access denied" };

			const invoices = await Invoices.find({ order: orderId }).populate("order").lean();

			if (!invoices || invoices.length === 0) throw { status: 404, message: "No invoices found for this order" };

			return NextResponse.json(invoices);
		}

		throw { status: 403, message: "Access denied" };
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}
