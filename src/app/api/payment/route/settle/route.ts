import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";
import { createPayout, createRazorpayContact, createRazorpayFundAccount } from "#utils/payment/razorpay";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const session = (await getServerSession(authOptions)) as Session & { role?: string; username?: string };
		if (!session || session.role !== "admin") {
			throw { status: 401, message: "Admin access required" };
		}
		const { orderId, amount, ownerVpa } = await req.json();
		if (!orderId || !amount || !ownerVpa) {
			throw { status: 400, message: "orderId, amount, ownerVpa required" };
		}
		await connectDB();

		const order = await Orders.findById(orderId);
		if (!order) throw { status: 404, message: "Order not found" };
		if (order.restaurantID !== session.username) throw { status: 403, message: "Access denied" };
		if (order.paymentStatus !== "paid") throw { status: 400, message: "Order not paid yet" };

		const maxSettleAmount = (order.orderTotal || 0) + (order.taxTotal || 0) - (order.refundedAmount || 0);
		if (amount > maxSettleAmount) {
			throw { status: 400, message: `Settle amount exceeds maximum allowed (${maxSettleAmount})` };
		}

		const account = await Accounts.findOne({ username: session.username }).populate("profile");
		const profile = account?.profile as Record<string, unknown> | null;
		if (!profile) throw { status: 404, message: "Restaurant profile not found" };

		let contactId = profile.razorpayContactId as string | undefined;
		let fundAccountId = profile.razorpayFundAccountId as string | undefined;

		if (!contactId) {
			const contact = await createRazorpayContact({
				name: profile.name as string,
				email: account?.email,
				contact: (profile.phone as string) || "",
				type: "vendor",
			});
			contactId = contact.id;
			(profile as Record<string, unknown>).razorpayContactId = contactId;
		}
		if (!fundAccountId) {
			const fundAccount = await createRazorpayFundAccount(contactId, ownerVpa);
			fundAccountId = (fundAccount as { id: string }).id;
			(profile as Record<string, unknown>).razorpayFundAccountId = fundAccountId;
		}
		if (account?.profile && typeof account.profile === "object" && "save" in (account.profile as object)) {
			await (account.profile as { save: () => Promise<unknown> }).save();
		}

		const payout = await createPayout({
			accountNumber: process.env.RAZORPAY_ACCOUNT_NUMBER ?? "",
			fundAccountId,
			amount: Math.round(amount * 100),
			currency: "INR",
			mode: "UPI",
			purpose: "payout",
			referenceId: `settle_${orderId}`,
		});

		return NextResponse.json({ status: 200, payout });
	} catch (err) {
		captureError(err, { route: "/api/payment/route/settle" });
		return CatchNextResponse(err);
	}
}
