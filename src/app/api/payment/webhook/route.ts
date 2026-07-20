import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";

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
				if (refundOrderId) {
					const order = await Orders.findById(refundOrderId);
					if (order) {
						const _totalRefunded = order.paymentStatus === "partially_refunded";
						order.paymentStatus = order.amount === refund.amount ? "refunded" : "partially_refunded";
						await order.save();
					}
				}
				break;
			}
		}

		return new Response("OK", { status: 200 });
	} catch (error) {
		console.error("Webhook error:", error);
		return new Response("Webhook error", { status: 500 });
	}
}
