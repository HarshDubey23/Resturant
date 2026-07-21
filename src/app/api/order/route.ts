import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function GET(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const restaurantID = session?.restaurant?.username;
		const customer = session?.customer?._id;
		if (!restaurantID || !customer) throw { status: 403, message: "Customer access required" };

		const { searchParams } = new URL(req.url);
		const isPast = searchParams.get("past") === "true";

		if (isPast) {
			const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
			const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
			const skip = (page - 1) * limit;

			const [orders, total] = await Promise.all([
				Orders.find({ restaurantID, customer, state: { $in: ["complete", "cancel", "reject"] } })
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(limit)
					.populate("customer")
					.populate("products.product")
					.lean(),
				Orders.countDocuments({ restaurantID, customer, state: { $in: ["complete", "cancel", "reject"] } }),
			]);

			const formattedOrders = (orders as unknown as Array<Record<string, unknown>>).map((order) => {
				const rawProducts = (order.products as Array<Record<string, unknown>>) || [];
				const products = rawProducts.map((p) => {
					const menu = p.product as Record<string, unknown> | undefined;
					return { ...p, ...menu, product: menu?._id };
				});
				return { ...order, products };
			});

			return NextResponse.json({ orders: formattedOrders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
		}

		const order = await Orders.findOne({ restaurantID, customer, state: "active" }).populate("customer").populate("products.product").lean();

		if (!order) return NextResponse.json(null);

		const raw = order as unknown as Record<string, unknown>;
		const rawProducts = (raw.products as Array<Record<string, unknown>>) || [];
		const products = rawProducts.map((p) => {
			const menu = p.product as Record<string, unknown> | undefined;
			return { ...p, ...menu, product: menu?._id };
		});

		return NextResponse.json({ ...raw, products });
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
