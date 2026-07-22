import crypto from "node:crypto";

import { triggerN8nWorkflow } from "#lib/n8n/client";
import connectDB from "#utils/database/connect";
import { Invoices } from "#utils/database/models/invoice";
import { Orders } from "#utils/database/models/order";
import { SplitPayments } from "#utils/database/models/splitPayment";
import { timingSafeStringEqual } from "#utils/helper/crypto";
import { generateInvoiceNumber } from "#utils/helper/invoiceHelper";
import { captureError } from "#utils/helper/sentryWrapper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const rawBody = await req.text();
		const body = JSON.parse(rawBody);
		const event = body.event;
		const payload = body.payload;

		if (!event || !payload) {
			return new Response("Missing event or payload", { status: 400 });
		}

		const signature = req.headers.get("x-razorpay-signature");
		const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
		if (!signature || !webhookSecret) {
			return new Response("Missing webhook signature or secret", { status: 400 });
		}
		const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
		// Length-normalizing constant-time compare: a raw timingSafeEqual throws
		// when the attacker supplies a signature of a different length.
		if (!timingSafeStringEqual(signature, expectedSignature)) {
			return new Response("Invalid webhook signature", { status: 401 });
		}

		await connectDB();

		switch (event) {
			case "payment.captured": {
				const payment = payload.payment?.entity;
				const orderId = payment?.notes?.orderId;

				// Split payment capture: mark the individual split paid and settle
				// the order once every split has been collected.
				if (payment?.notes?.type === "split_payment" && orderId) {
					const splitIndex = Number(payment.notes.splitIndex ?? "-1");
					const splitPayment = await SplitPayments.findOne({ order: orderId, status: "open" });
					if (splitPayment && splitIndex >= 0 && splitPayment.splits[splitIndex]) {
						splitPayment.splits[splitIndex].status = "paid";
						splitPayment.splits[splitIndex].paymentId = payment.id;
						splitPayment.splits[splitIndex].paidAt = new Date();

						const allPaid = splitPayment.splits.every((s: { status: string }) => s.status === "paid");
						if (allPaid) {
							splitPayment.status = "settled";
							await Orders.findByIdAndUpdate(orderId, { paymentStatus: "paid", paymentId: payment.id });
						}
						await splitPayment.save();
					}
					break;
				}

				if (orderId) {
					await Orders.findByIdAndUpdate(orderId, {
						paymentStatus: "paid",
						paymentId: payment.id,
					});

					const order = await Orders.findById(orderId).populate("customer").lean();
					if (order) {
						const items = ((order.cartSnapshot?.items || []) as Array<{ name: string; quantity: number; price: number; tax: number }>).map((item) => ({
							name: item.name,
							quantity: item.quantity,
							price: item.price,
							taxPercent: item.tax && item.price ? Math.round((item.tax / item.price) * 100) : 0,
							taxAmount: item.tax || 0,
							total: (item.price || 0) * (item.quantity || 1),
						}));

						const taxTotal = order.taxTotal || 0;
						const invoice = await Invoices.create({
							restaurantID: order.restaurantID,
							order: order._id,
							invoiceNumber: await generateInvoiceNumber(order.restaurantID),
							customerName: order.customer
								? `${(order.customer as { fname?: string; lname?: string }).fname || ""} ${(order.customer as { fname?: string; lname?: string }).lname || ""}`.trim()
								: undefined,
							customerPhone: (order.customer as { phone?: string } | null)?.phone,
							items,
							subtotal: order.orderTotal || 0,
							cgst: taxTotal / 2,
							sgst: taxTotal / 2,
							igst: 0,
							grandTotal: (order.orderTotal || 0) + taxTotal,
							paymentMethod: "razorpay",
						});

						await Orders.findByIdAndUpdate(orderId, { invoiceNumber: invoice.invoiceNumber });

						triggerN8nWorkflow("payment.succeeded", {
							orderId: order._id.toString(),
							invoiceId: invoice._id.toString(),
							invoiceNumber: invoice.invoiceNumber,
							restaurantID: order.restaurantID,
						}).catch((e: unknown) => captureError(e, { context: "n8n trigger failed" }));
					}
				}
				break;
			}
			case "payment.failed": {
				const failedPayment = payload.payment?.entity;
				const failedOrderId = failedPayment?.notes?.orderId;
				if (failedOrderId) {
					await Orders.findByIdAndUpdate(failedOrderId, {
						paymentStatus: "failed",
					});
				}
				break;
			}
			case "refund.created": {
				const refund = payload.refund?.entity;
				const refundOrderId = refund?.notes?.orderId;
				if (!refundOrderId) break;
				const order = await Orders.findById(refundOrderId);
				if (!order) break;

				const refundAmountInRupees = (refund.amount ?? 0) / 100;
				const orderTotalInRupees = (order.orderTotal ?? 0) + (order.taxTotal ?? 0);

				order.refundedAmount = (order.refundedAmount ?? 0) + refundAmountInRupees;

				if (order.refundedAmount >= orderTotalInRupees) {
					order.paymentStatus = "refunded";
				} else if (order.refundedAmount > 0) {
					order.paymentStatus = "partially_refunded";
				}
				await order.save();
				break;
			}
		}

		return new Response("OK", { status: 200 });
	} catch (error) {
		captureError(error, { route: "/api/payment/webhook" });
		return new Response("Webhook error", { status: 500 });
	}
}
