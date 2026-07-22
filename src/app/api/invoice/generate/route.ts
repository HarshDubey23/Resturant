import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Invoices } from "#utils/database/models/invoice";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { generateInvoiceNumber } from "#utils/helper/invoiceHelper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		const { orderId } = await req.json();
		if (!orderId) throw { status: 400, message: "orderId is required" };

		await connectDB();

		const restaurantID = (session.restaurant?.username || session.username) as string;

		const order = await Orders.findOne({ _id: orderId, restaurantID }).populate("customer").populate("products.product").lean();
		if (!order) throw { status: 404, message: "Order not found" };

		const existingInvoice = await Invoices.findOne({ order: orderId });
		if (existingInvoice) {
			return NextResponse.json(existingInvoice);
		}

		const items = ((order.cartSnapshot?.items || []) as Array<{ name: string; quantity: number; price: number; tax: number }>).map((item) => ({
			name: item.name,
			quantity: item.quantity,
			price: item.price,
			taxPercent: item.tax && item.price ? Math.round((item.tax / item.price) * 100) : 0,
			taxAmount: item.tax || 0,
			total: (item.price || 0) * (item.quantity || 1),
		}));

		const subtotal = order.orderTotal || 0;
		const taxTotal = order.taxTotal || 0;
		const cgst = taxTotal / 2;
		const sgst = taxTotal / 2;

		const gw = order.paymentGateway;
		const paymentMethod = gw === "razorpay" ? "razorpay" : gw === "stripe" ? "stripe" : "cash";

		const invoice = await Invoices.create({
			restaurantID,
			order: order._id,
			invoiceNumber: await generateInvoiceNumber(restaurantID),
			customerName: order.customer
				? `${(order.customer as { fname?: string; lname?: string }).fname || ""} ${(order.customer as { fname?: string; lname?: string }).lname || ""}`.trim()
				: undefined,
			customerPhone: (order.customer as { phone?: string } | null)?.phone,
			items,
			subtotal,
			cgst,
			sgst,
			igst: 0,
			grandTotal: subtotal + taxTotal,
			paymentMethod,
		});

		await Orders.findByIdAndUpdate(orderId, { invoiceNumber: invoice.invoiceNumber });

		return NextResponse.json(invoice);
	} catch (err) {
		return CatchNextResponse(err);
	}
}
