import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import type { TCustomer } from "#utils/database/models/customer";
import type { TMenu } from "#utils/database/models/menu";
import { Orders, type TOrder, type TProduct } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function GET() {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const restaurantID = session?.username || session?.restaurant?.username;
		if (!restaurantID) throw { status: 400, message: "Restaurant ID required" };

		const orders = await Orders.find({
			restaurantID,
			state: { $in: ["active", "preparing"] },
		})
			.populate<{ customer: TCustomer }>("customer")
			.populate<{ products: { product: TMenu }[] }>("products.product")
			.sort({ createdAt: -1 })
			.lean();

		const formattedOrders = (orders as unknown as TOrder[]).map((order) => {
			if (order?.products) {
				const products = order.products.map((p) => {
					const product = p as unknown as TProduct;
					const menu = product.product as unknown as TMenu;
					return { ...product, ...menu, product: menu?._id };
				});
				return { ...order, products };
			}
			return order;
		});

		return NextResponse.json(formattedOrders);
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
