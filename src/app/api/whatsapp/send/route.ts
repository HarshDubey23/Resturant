import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { formatCurrency } from "#utils/helper/currency";
import { sendWhatsAppOrderReady, sendWhatsAppOrderReceipt, sendWhatsAppText } from "#utils/whatsapp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

			const orderCurrency = (order as unknown as { currency?: string }).currency || "INR";
			const result = await sendWhatsAppOrderReceipt(phone, {
				table: order.table,
				items: order.products.map((p: { quantity: number; price: number }) => `x${p.quantity} ${formatCurrency(p.price, orderCurrency)}`).join(", "),
				total: order.orderTotal + order.taxTotal,
				currency: orderCurrency,
				points: Math.floor((order.orderTotal || 0) / 10),
			});
			const skipped = (result as { skipped?: boolean })?.skipped;
			return NextResponse.json({ status: 200, message: skipped ? "WhatsApp not configured — receipt logged" : "Receipt sent", skipped });
		}

		if (action === "order_ready" && orderId) {
			const order = await Orders.findById(orderId).populate("customer");
			if (!order) throw { status: 404, message: "Order not found" };
			const phone = order.customer?.phone;
			if (!phone) throw { status: 400, message: "Customer phone not found" };

			const result = await sendWhatsAppOrderReady(phone, order.table);
			const skipped = (result as { skipped?: boolean })?.skipped;
			return NextResponse.json({ status: 200, message: skipped ? "WhatsApp not configured — notification logged" : "Ready notification sent", skipped });
		}

		if (action === "custom" && customerPhone && message) {
			const result = await sendWhatsAppText(customerPhone, message);
			const skipped = (result as { skipped?: boolean })?.skipped;
			return NextResponse.json({ status: 200, message: skipped ? "WhatsApp not configured — message logged" : "Message sent", skipped });
		}

		throw { status: 400, message: "Invalid action" };
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}
