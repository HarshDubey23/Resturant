import { NextResponse } from "next/server";
import { triggerN8nWorkflow } from "#lib/n8n/client";
import connectDB from "#utils/database/connect";
import { Invoices } from "#utils/database/models/invoice";
import { Orders } from "#utils/database/models/order";
import { generateInvoiceNumber } from "#utils/helper/invoiceHelper";
import { captureError } from "#utils/helper/sentryWrapper";
import { verifyStripeWebhookSignature } from "#utils/payment/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	const rawBody = await req.text();
	const signature = req.headers.get("stripe-signature") || "";
	const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

	let event;
	try {
		event = verifyStripeWebhookSignature(rawBody, signature, endpointSecret);
	} catch (err) {
		captureError(err, { route: "stripe/webhook/verify" });
		return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
	}

	await connectDB();

	switch (event.type) {
		case "checkout.session.completed": {
			const session = event.data.object as { id: string; payment_status: string; metadata?: { orderId?: string } };
			const orderId = session.metadata?.orderId;
			if (!orderId) break;

			const order = await Orders.findById(orderId);
			if (!order) break;

			if (session.payment_status === "paid") {
				order.paymentStatus = "paid";
				order.paymentId = session.id;
				await order.save();

				const invoice = await Invoices.create({
					restaurantID: order.restaurantID,
					order: order._id,
					invoiceNumber: await generateInvoiceNumber(order.restaurantID),
					items: order.cartSnapshot?.items || [],
					subtotal: order.cartSnapshot?.subtotal || 0,
					cgst: (order.taxTotal || 0) / 2,
					sgst: (order.taxTotal || 0) / 2,
					igst: 0,
					grandTotal: (order.orderTotal || 0) + (order.taxTotal || 0),
					paymentMethod: "stripe",
				});

				triggerN8nWorkflow("payment.succeeded", {
					orderId: order._id.toString(),
					invoiceId: invoice._id.toString(),
					invoiceNumber: invoice.invoiceNumber,
					restaurantID: order.restaurantID,
				}).catch((e: unknown) => captureError(e, { context: "n8n trigger failed" }));
			}
			break;
		}
		case "charge.refunded": {
			const charge = event.data.object as { metadata?: { orderId?: string }; amount_refunded: number };
			const orderId = charge.metadata?.orderId;
			if (!orderId) break;
			const order = await Orders.findById(orderId);
			if (!order) break;
			order.refundedAmount = (order.refundedAmount || 0) + charge.amount_refunded / 100;
			order.paymentStatus = order.refundedAmount >= (order.orderTotal || 0) + (order.taxTotal || 0) ? "refunded" : "partially_refunded";
			await order.save();
			break;
		}
	}

	return NextResponse.json({ received: true });
}
