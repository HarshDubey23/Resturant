import crypto from "node:crypto";
import { triggerN8nWorkflow } from "#lib/n8n/client";
import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
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
		if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
			return new Response("Invalid webhook signature", { status: 401 });
		}

		await connectDB();

		switch (event) {
			case "payment.captured": {
				const payment = payload.payment?.entity;
				const orderId = payment?.notes?.orderId;
				if (orderId) {
					await Orders.findByIdAndUpdate(orderId, {
						paymentStatus: "paid",
						paymentId: payment.id,
					});
					triggerN8nWorkflow("payment.succeeded", { orderId, gateway: "razorpay" }).catch((e: unknown) => captureError(e, { context: "n8n trigger failed" }));
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
