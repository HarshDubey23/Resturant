import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { triggerN8nWorkflow } from "#lib/n8n/client";
import connectDB from "#utils/database/connect";
import { awardPointsAtomic } from "#utils/database/helper/loyalty";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";
import { verifyPaymentSignature } from "#utils/payment/razorpay";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const body = await req.json();
		const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

		if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
			throw { status: 400, message: "Missing required payment verification fields" };
		}

		const isValid = await verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
		if (!isValid) throw { status: 400, message: "Invalid payment signature" };

		await connectDB();

		const order = await Orders.findById(orderId);
		if (!order) throw { status: 404, message: "Order not found" };

		const sessionRestaurant = session.restaurant?.username || session.username;
		if (order.restaurantID !== sessionRestaurant) throw { status: 403, message: "Access denied. Order belongs to another restaurant." };

		// FIX (audit B2): transition pending_payment → active on verified payment
		// so the kitchen sees the order. Previously this route unconditionally
		// set state = "active", which was correct for the old place-flow but
		// is still correct now that non-cash orders are placed in pending_payment.
		order.state = "active";
		order.paymentStatus = "paid";
		order.paymentId = razorpayPaymentId;
		await order.save();

		// FIX (audit B4): award loyalty points exactly once. The atomic
		// findOneAndUpdate with `loyaltyAwarded: false` as a query condition
		// is the single source of truth — the Razorpay webhook, this verify
		// route, and the /api/loyalty fallback all race on this one mutation,
		// so points are minted exactly once even if the webhook and verify
		// fire for the same payment.
		const claimed = await Orders.findOneAndUpdate({ _id: orderId, loyaltyAwarded: false }, { $set: { loyaltyAwarded: true } }, { new: true });
		if (claimed && claimed.restaurantID && claimed.customer) {
			try {
				const award = await awardPointsAtomic(claimed.restaurantID, claimed.customer, claimed.orderTotal || 0);
				if (award?.tierUpgraded) {
					triggerN8nWorkflow("loyalty.tier_upgraded", {
						customerId: claimed.customer.toString(),
						restaurantID: claimed.restaurantID,
						newTier: award.newTier,
					}).catch(() => {});
				}
			} catch (e) {
				captureError(e, { context: "loyalty-award-after-verify-failed", orderId });
			}
		}

		return NextResponse.json({ status: 200, message: "Payment verified successfully" });
	} catch (err) {
		captureError(err, { route: "/api/payment/verify" });
		return CatchNextResponse(err);
	}
}
