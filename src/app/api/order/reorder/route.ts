import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const restaurantID = session.restaurant?.username;
		const customer = session.customer?._id;
		if (!restaurantID || !customer) throw { status: 403, message: "Customer access required" };

		const { orderId } = await req.json();
		if (!orderId) throw { status: 400, message: "orderId is required" };

		const pastOrder = await Orders.findOne({ _id: orderId, restaurantID, customer, state: "complete" }).populate("products.product", "name price").lean();
		if (!pastOrder) throw { status: 404, message: "Past order not found" };

		type RawOrderProduct = { product?: { _id?: string; price?: number }; quantity: number; price: number };

		const productsToAdd = ((pastOrder.products || []) as unknown as RawOrderProduct[]).map((p: RawOrderProduct) => ({
			product: p.product?._id,
			quantity: p.quantity,
			price: p.price,
			tax: 0,
			adminApproved: false,
			kitchenStatus: "pending",
			station: "main",
		}));

		const addedTotal = productsToAdd.reduce((s: number, p: { price: number; quantity: number }) => s + (p.price || 0) * (p.quantity || 1), 0);

		let activeOrder = await Orders.findOne({ restaurantID, customer, state: "active" });

		if (!activeOrder) {
			activeOrder = await Orders.create({
				restaurantID,
				table: pastOrder.table,
				customer,
				state: "active",
				paymentStatus: "pending",
				products: productsToAdd,
				orderTotal: addedTotal,
			});
		} else {
			activeOrder.products.push(...productsToAdd);
			activeOrder.orderTotal = (activeOrder.orderTotal || 0) + addedTotal;
			await activeOrder.save();
		}

		return NextResponse.json({
			orderId: activeOrder._id,
			itemsAdded: productsToAdd.length,
			message: `Re-added ${productsToAdd.length} item(s) from your previous order`,
		});
	} catch (err) {
		return CatchNextResponse(err);
	}
}
