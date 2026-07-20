import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { AggregatorOrders } from "#utils/database/models/aggregatorOrder";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		const body = await req.json();
		const { source, externalOrderId, customerName, customerPhone, deliveryAddress, items, totalAmount, notes } = body;

		if (!source || !items || !Array.isArray(items) || items.length === 0) {
			throw { status: 400, message: "source and items array required" };
		}

		if (!["zomato", "swiggy", "manual"].includes(source)) {
			throw { status: 400, message: "source must be zomato, swiggy, or manual" };
		}

		await connectDB();
		const restaurantID = session.username;

		if (externalOrderId && source !== "manual") {
			const existing = await AggregatorOrders.findOne({ restaurantID, externalOrderId });
			if (existing) throw { status: 409, message: "Order already imported" };
		}

		const order = await AggregatorOrders.create({
			restaurantID,
			source,
			externalOrderId,
			customerName,
			customerPhone,
			deliveryAddress,
			items: items.map((i: { name: string; quantity?: number; price?: number }) => ({
				name: i.name,
				quantity: i.quantity || 1,
				price: i.price || 0,
			})),
			totalAmount: totalAmount || items.reduce((sum: number, i: { price?: number; quantity?: number }) => sum + (i.price || 0) * (i.quantity || 1), 0),
			notes,
		});

		return NextResponse.json({ status: 200, message: "Order imported", order });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}
