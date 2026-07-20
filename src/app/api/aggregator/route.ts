import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { AggregatorOrders } from "#utils/database/models/aggregatorOrder";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		await connectDB();
		const restaurantID = session.username || session.restaurant?.username;
		if (!restaurantID) throw { status: 400, message: "Restaurant ID required" };

		const orders = await AggregatorOrders.find({ restaurantID }).sort({ createdAt: -1 }).limit(50).lean();

		return NextResponse.json(orders);
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}
