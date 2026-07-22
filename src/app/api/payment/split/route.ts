import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { SplitPayments } from "#utils/database/models/splitPayment";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { createPaymentLink } from "#utils/payment/razorpay";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const splitSchema = z.object({
	orderId: z.string().min(1),
	splits: z
		.array(
			z.object({
				name: z.string().min(1),
				phone: z.string().min(8),
				email: z.string().email().optional(),
				// Optional custom amount (in rupees). Omit for an equal split.
				amount: z.number().positive().optional(),
			}),
		)
		.min(2)
		.max(10),
});

interface PaymentLinkResult {
	id?: string;
	short_url?: string;
}

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const body = await req.json();
		const parsed = splitSchema.safeParse(body);
		if (!parsed.success) throw { status: 400, message: parsed.error.issues[0]?.message ?? "Invalid request" };

		const { orderId, splits } = parsed.data;

		await connectDB();

		const order = await Orders.findById(orderId);
		if (!order) throw { status: 404, message: "Order not found" };

		const sessionRestaurant = session.restaurant?.username || session.username;
		if (order.restaurantID !== sessionRestaurant) throw { status: 403, message: "Access denied. Order belongs to another restaurant." };
		if (order.paymentStatus === "paid") throw { status: 409, message: "Order is already paid" };

		const totalAmount = (order.orderTotal || 0) + (order.taxTotal || 0) - (order.discountAmount || 0);
		if (totalAmount <= 0) throw { status: 400, message: "Order has no payable amount" };

		// Resolve per-person amounts (rupees): custom amounts must sum to the
		// order total; otherwise split equally with the remainder on the last.
		let amounts: number[];
		const hasCustomAmounts = splits.some((s) => s.amount !== undefined);
		if (hasCustomAmounts) {
			if (!splits.every((s) => s.amount !== undefined)) throw { status: 400, message: "Provide an amount for every split, or none" };
			const sum = splits.reduce((s, sp) => s + (sp.amount ?? 0), 0);
			if (Math.abs(sum - totalAmount) > 0.01) throw { status: 400, message: `Split amounts (${sum}) must equal the order total (${totalAmount})` };
			amounts = splits.map((s) => s.amount as number);
		} else {
			const per = Math.floor((totalAmount / splits.length) * 100) / 100;
			amounts = splits.map((_, i) => (i === splits.length - 1 ? Number((totalAmount - per * (splits.length - 1)).toFixed(2)) : per));
		}

		const linkResults = await Promise.all(
			splits.map((split, index) =>
				createPaymentLink({
					amount: Math.round(amounts[index] * 100), // paise
					description: `Split payment for Table ${order.table} (${index + 1}/${splits.length})`,
					customer: {
						name: split.name,
						email: split.email || `${split.phone}@split.order`,
						contact: split.phone,
					},
					notes: {
						orderId: order._id?.toString() || "",
						splitIndex: String(index),
						totalSplits: String(splits.length),
						type: "split_payment",
					},
				})
					.then((link) => ({ index, link: link as PaymentLinkResult }))
					.catch(() => ({ index, link: null })),
			),
		);

		const successful = linkResults.filter((r) => r.link?.id);
		if (successful.length === 0) throw { status: 502, message: "Failed to create payment links" };

		// Persist the split payment so it survives reloads, appears in order
		// history, and can be reconciled by the payment webhook.
		const splitPayment = await SplitPayments.findOneAndUpdate(
			{ order: order._id, status: "open" },
			{
				$set: {
					restaurantID: order.restaurantID,
					order: order._id,
					totalAmount,
					splits: splits.map((split, index) => {
						const found = linkResults.find((r) => r.index === index);
						return {
							name: split.name,
							phone: split.phone,
							email: split.email,
							amount: amounts[index],
							paymentLinkId: found?.link?.id,
							paymentLinkUrl: found?.link?.short_url,
							status: found?.link?.id ? "pending" : "failed",
						};
					}),
				},
			},
			{ new: true, upsert: true },
		);

		return NextResponse.json({
			status: 200,
			message: `${successful.length} of ${splits.length} payment links created`,
			splitPaymentId: splitPayment._id,
			splits: splitPayment.splits,
		});
	} catch (err) {
		return CatchNextResponse(err);
	}
}

/** Returns the split payment state for an order (polling from the client). */
export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const { searchParams } = new URL(req.url);
		const orderId = searchParams.get("orderId");
		if (!orderId) throw { status: 400, message: "orderId is required" };

		await connectDB();
		const sessionRestaurant = session.restaurant?.username || session.username;
		const splitPayment = await SplitPayments.findOne({ order: orderId, restaurantID: sessionRestaurant }).sort({ createdAt: -1 }).lean();
		if (!splitPayment) throw { status: 404, message: "No split payment found for this order" };

		return NextResponse.json({ status: 200, splitPayment });
	} catch (err) {
		return CatchNextResponse(err);
	}
}
