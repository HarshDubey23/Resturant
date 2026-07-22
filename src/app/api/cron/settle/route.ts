import { NextResponse } from "next/server";
import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Orders } from "#utils/database/models/order";
import { captureError } from "#utils/helper/sentryWrapper";
import { createPayout } from "#utils/payment/razorpay";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
	const authHeader = req.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response("Unauthorized", { status: 401 });
	}

	await connectDB();
	const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
	const pendingSettlements = await Orders.find({
		state: "complete",
		paymentStatus: "paid",
		settledAt: { $exists: false },
		createdAt: { $lt: yesterday },
	}).lean();

	const results: Array<Record<string, unknown>> = [];
	for (const order of pendingSettlements) {
		try {
			const account = await Accounts.findOne({ username: order.restaurantID }).populate("profile");
			const profile = account?.profile as Record<string, unknown> | null;
			if (!profile?.razorpayFundAccountId) {
				results.push({ orderId: order._id, status: "skipped", reason: "no_fund_account" });
				continue;
			}

			const gross = (order.orderTotal || 0) + (order.taxTotal || 0) - (order.refundedAmount || 0);
			const platformFee = Math.round(gross * 0.005 * 100);
			const netAmountInPaise = Math.round(gross * 100) - platformFee;

			await createPayout({
				accountNumber: process.env.RAZORPAY_ACCOUNT_NUMBER ?? "",
				fundAccountId: profile.razorpayFundAccountId as string,
				amount: netAmountInPaise,
				currency: (profile?.currency as string) || "INR",
				mode: "UPI",
				purpose: "payout",
				referenceId: `settle_${order._id}`,
			});

			await Orders.updateOne({ _id: order._id }, { $set: { settledAt: new Date() } });
			results.push({ orderId: order._id, status: "settled" });
		} catch (err) {
			captureError(err, { route: "cron/settle", orderId: order._id.toString() });
			results.push({ orderId: order._id, status: "failed" });
		}
	}

	return NextResponse.json({ processed: results.length, results });
}
