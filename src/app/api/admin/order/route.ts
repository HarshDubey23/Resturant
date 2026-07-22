import { Types } from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import type { TCustomer } from "#utils/database/models/customer";
import type { TMenu } from "#utils/database/models/menu";
import { Orders, type TOrder, type TProduct } from "#utils/database/models/order";
import { CatchNextResponse } from "#utils/helper/common";
import { withPermission } from "#utils/helper/rbac";

const formatOrder = (order: TOrder) => {
	if (order?.products) {
		const products = order.products.map((p) => {
			const product = p as unknown as TProduct;
			const menu = product.product as unknown as TMenu;
			return { ...product, ...menu, product: menu?._id };
		});
		return { ...order, products: products as unknown as TProduct[] };
	}
	return order;
};

export const GET = withPermission("orders.read", async (req, session) => {
	try {
		await connectDB();
		const restaurantID = session?.username;
		const { searchParams } = new URL(req.url);
		const cursor = searchParams.get("cursor");
		const limitParam = parseInt(searchParams.get("limit") || "20", 10);
		const limit = Math.min(100, Math.max(1, limitParam));

		if (cursor) {
			const pageLimit = limit + 1;
			const orders =
				((await Orders.find({
					restaurantID,
					_id: { $gt: new Types.ObjectId(cursor) },
				})
					.sort({ _id: 1 })
					.limit(pageLimit)
					.populate<{ customer: TCustomer }>("customer")
					.populate<{ products: { product: TMenu }[] }>("products.product")
					.lean()) as unknown as TOrder[]) ?? [];

			const hasMore = orders.length > limit;
			const trimmed = hasMore ? orders.slice(0, limit) : orders;
			const nextCursor = hasMore ? trimmed[trimmed.length - 1]?._id.toString() : undefined;

			return NextResponse.json({
				orders: trimmed.map(formatOrder),
				nextCursor,
				hasMore,
			});
		}

		const orders =
			((await Orders.find({ restaurantID })
				.populate<{ customer: TCustomer }>("customer")
				.populate<{ products: { product: TMenu }[] }>("products.product")
				.lean()) as unknown as TOrder[]) ?? [];

		return NextResponse.json(orders.map(formatOrder));
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
