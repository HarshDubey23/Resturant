import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const restaurantID = session.restaurant?.username;
		const customer = session.customer?._id;
		if (!restaurantID || !customer) throw { status: 403, message: "Customer access required" };

		const order = await Orders.findOne({ restaurantID, customer, state: "active" }).populate("customer").populate("products.product", "name price veg image").lean();

		if (!order) return NextResponse.json({ order: null, status: "no_active_order" });

		const raw = order as unknown as Record<string, unknown>;
		const rawProducts = (raw.products as Array<Record<string, unknown>>) || [];

		const products = rawProducts.map((p) => ({
			name: ((p.product as Record<string, unknown> | undefined)?.name as string) || "Item",
			quantity: (p.quantity as number) || 1,
			price: (p.price as number) || 0,
			kitchenStatus: (p.kitchenStatus as string) || "pending",
			veg: ((p.product as Record<string, unknown> | undefined)?.veg as string) || "unknown",
			image: ((p.product as Record<string, unknown> | undefined)?.image as string) || null,
		}));

		return NextResponse.json({
			order: {
				_id: raw._id,
				table: raw.table,
				state: raw.state,
				paymentStatus: raw.paymentStatus,
				orderTotal: raw.orderTotal,
				taxTotal: raw.taxTotal,
				createdAt: raw.createdAt,
				products,
			},
			status: "active",
		});
	} catch (err) {
		return CatchNextResponse(err);
	}
}
