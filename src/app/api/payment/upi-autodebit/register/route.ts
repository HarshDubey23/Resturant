import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Customers } from "#utils/database/models/customer";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";
import { createRazorpayOrder } from "#utils/payment/razorpay";

/**
 * UPI Autodebit registration endpoint.
 *
 * Razorpay's UPI Autodebit flow works in two steps:
 *   1. Customer creates a ₹1 "auth" payment against this registration
 *      order, approving the mandate.
 *   2. The merchant can then charge the customer's UPI on a recurring
 *      schedule via the `charge` API (not yet wired here — this is the
 *      registration step only).
 *
 * This endpoint creates the auth order and returns its ID + the amount
 * (always ₹1 = 100 paise). The customer's phone + restaurantID are
 * stashed as notes so the webhook can look them up when the auth
 * payment succeeds.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication required" };

		const restaurantID = session?.restaurant?.username;
		const customerPhone = session?.customer?.phone;
		if (!restaurantID || !customerPhone) {
			throw { status: 400, message: "Customer session missing restaurant or phone" };
		}

		await connectDB();
		const customer = await Customers.findOne({ phone: customerPhone, restaurantID });
		if (!customer) throw { status: 404, message: "Customer not found" };

		const order = await createRazorpayOrder({
			amount: 100, // ₹1.00 in paise — auth-only, refunded on mandate creation
			currency: "INR",
			receipt: `upi-auth-${customer._id.toString().slice(-8)}`,
			notes: {
				purpose: "upi_autodebit_auth",
				restaurant_id: restaurantID,
				customer_phone: customerPhone,
				customer_id: customer._id.toString(),
			},
		});

		return NextResponse.json({
			status: 200,
			orderId: order.id,
			amount: order.amount,
			currency: order.currency,
			key: process.env.RAZORPAY_KEY_ID,
		});
	} catch (err) {
		captureError(err, { route: "/api/payment/upi-autodebit/register" });
		return CatchNextResponse(err);
	}
}
