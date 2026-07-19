import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Customers } from "#utils/database/models/customer";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { sendWhatsAppOrderReceipt, sendWhatsAppOrderReady, sendWhatsAppText } from "#utils/whatsapp";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		const body = await req.json();
		const { action, orderId, customerPhone, message } = body;

		await connectDB();

		if (action === "order_receipt" && orderId) {
			const order = await Orders.findById(orderId).populate("customer");
			if (!order) throw { status: 404, message: "Order not found" };
			const phone = order.customer?.phone;
			if (!phone) throw { status: 400, message: "Customer phone not found" };

			await sendWhatsAppOrderReceipt(phone, {
				table: order.table,
				items: order.products.map((p: { quantity: number; price: number }) => `x${p.quantity} ₹${p.price}`).join(", "),
				total: order.orderTotal + order.taxTotal,
				points: Math.floor((order.orderTotal || 0) / 10),
			});
			return NextResponse.json({ status: 200, message: "Receipt sent" });
		}

		if (action === "order_ready" && orderId) {
			const order = await Orders.findById(orderId).populate("customer");
			if (!order) throw { status: 404, message: "Order not found" };
			const phone = order.customer?.phone;
			if (!phone) throw { status: 400, message: "Customer phone not found" };

			await sendWhatsAppOrderReady(phone, order.table);
			return NextResponse.json({ status: 200, message: "Ready notification sent" });
		}

		if (action === "custom" && customerPhone && message) {
			await sendWhatsAppText(customerPhone, message);
			return NextResponse.json({ status: 200, message: "Message sent" });
		}

		throw { status: 400, message: "Invalid action" };
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}
