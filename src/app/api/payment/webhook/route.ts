import { triggerN8nWorkflow } from "#lib/n8n/client";
import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { captureError } from "#utils/helper/sentryWrapper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const event = body.event;
		const payload = body.payload;

		if (!event || !payload) {
			return new Response("Missing event or payload", { status: 400 });
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
