/**
 * @file POST /api/cashier/shift/close — close the current cashier shift.
 * @phase 2
 * @audit-finding n/a
 *
 * Finds the cashier's open shift, computes expectedCash =
 *   openingCash + cashSales − cashRefunds − payouts + cashTips
 * from orders on this shift, compares to countedCash, and dispatches a
 * `cash.shift_short` n8n event if the shortfall exceeds tolerance. Appends a
 * `shift_close` entry to billAuditChain and returns the closed shift + Z-report
 * payload.
 *
 * Tolerance is read from `profile.settings` if present (2-C may add a
 * `cashTolerance` field); otherwise it defaults to 0.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { triggerN8nWorkflow } from "#lib/n8n/client";
import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Orders } from "#utils/database/models/order";
import { Profiles } from "#utils/database/models/profile";
import { Shifts, type TShift } from "#utils/database/models/shift";
import { appendAuditChain } from "#utils/helper/auditChain";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ShiftMetrics {
	cashSales: number;
	upiSales: number;
	cardSales: number;
	cashRefunds: number;
	payouts: number;
	cashTips: number;
	tips: number;
	voidsCount: number;
	voidsAmount: number;
	discountsCount: number;
	discountsAmount: number;
	refundsCount: number;
	refundsAmount: number;
	kotCount: number;
}

async function aggregateShiftMetrics(restaurantID: string, openedAt: Date): Promise<ShiftMetrics> {
	const orders = await Orders.find({
		restaurantID,
		createdAt: { $gte: openedAt },
	}).lean();

	return orders.reduce(
		(a, o) => {
			const order = o as unknown as {
				paymentGateway?: string;
				state?: string;
				orderTotal?: number;
				taxTotal?: number;
				discountAmount?: number;
				refundedAmount?: number;
				products?: Array<{ adminApproved?: boolean }>;
			};
			const total = Number(order.orderTotal ?? 0) + Number(order.taxTotal ?? 0) - Number(order.discountAmount ?? 0);
			if (order.state === "cancel") {
				a.voidsCount += 1;
				a.voidsAmount += total;
				return a;
			}
			if (order.paymentGateway === "cash") a.cashSales += total;
			else if (order.paymentGateway === "razorpay") a.upiSales += total;
			else if (order.paymentGateway === "stripe") a.cardSales += total;

			if (order.discountAmount && order.discountAmount > 0) {
				a.discountsCount += 1;
				a.discountsAmount += Number(order.discountAmount);
			}
			if (order.refundedAmount && order.refundedAmount > 0) {
				a.refundsCount += 1;
				a.refundsAmount += Number(order.refundedAmount);
				if (order.paymentGateway === "cash") a.cashRefunds += Number(order.refundedAmount);
			}
			if (order.products?.some((p) => p.adminApproved)) a.kotCount += 1;
			return a;
		},
		{
			cashSales: 0,
			upiSales: 0,
			cardSales: 0,
			cashRefunds: 0,
			payouts: 0,
			cashTips: 0,
			tips: 0,
			voidsCount: 0,
			voidsAmount: 0,
			discountsCount: 0,
			discountsAmount: 0,
			refundsCount: 0,
			refundsAmount: 0,
			kotCount: 0,
		},
	);
}

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication required" };

		const body = await req.json();
		const countedCash = Number(body?.countedCash);
		if (!Number.isFinite(countedCash) || countedCash < 0) throw { status: 400, message: "countedCash must be a non-negative number" };

		const restaurantID = (session.username as string) ?? "";
		const role = (session.role ?? "admin") as string;
		if (!restaurantID) throw { status: 400, message: "Restaurant username missing from session" };

		await connectDB();

		const account = await Accounts.findOne({ username: restaurantID }).select("_id").lean();
		if (!account) throw { status: 404, message: "Cashier account not found" };
		const cashierId = account._id;
		const _cashierName = (session.email as string) ?? restaurantID;

		const shift = await Shifts.findOne<TShift>({ restaurantID, cashierId, status: "open" });
		if (!shift) throw { status: 404, message: "No open shift found for this cashier" };

		const metrics = await aggregateShiftMetrics(restaurantID, shift.openedAt);
		const profile = (await Profiles.findOne({ restaurantID }).lean()) as { settings?: { cashTolerance?: number } } | null;
		const tolerance = Number(profile?.settings?.cashTolerance ?? body?.tolerance ?? 0);

		const expectedCash = Number(shift.openingCash) + metrics.cashSales - metrics.cashRefunds - metrics.payouts + metrics.cashTips;
		const variance = countedCash - expectedCash;
		const flagged = countedCash < expectedCash - tolerance;

		shift.expectedCash = expectedCash;
		shift.countedCash = countedCash;
		shift.variance = variance;
		shift.status = flagged ? "flagged" : "closed";
		shift.closedAt = new Date();
		shift.kotCount = metrics.kotCount;
		if (flagged) {
			shift.flaggedReason = `Cash short by ${Math.max(0, expectedCash - countedCash).toFixed(2)}`;
		}

		let hashChainSeq: number | undefined;
		try {
			const entry = await appendAuditChain({
				restaurantID,
				actorRole: role,
				actorId: String(cashierId),
				action: "shift_close",
				payload: {
					shiftId: String(shift._id),
					cashierId: String(cashierId),
					openingCash: shift.openingCash,
					expectedCash,
					countedCash,
					variance,
					status: shift.status,
					closedAt: shift.closedAt?.toISOString?.() ?? "",
					tolerance,
				},
			});
			hashChainSeq = entry.sequenceNo;
			shift.hashChainSeq = hashChainSeq;
		} catch (auditErr) {
			captureError(auditErr, { route: "/api/cashier/shift/close", context: "audit chain append failed" });
		}

		await shift.save();

		if (flagged) {
			try {
				await triggerN8nWorkflow("cash.shift_short", {
					restaurantID,
					cashierId: String(cashierId),
					expected: expectedCash,
					counted: countedCash,
					shortfall: Math.max(0, expectedCash - countedCash),
					shiftId: String(shift._id),
				});
			} catch (n8nErr) {
				captureError(n8nErr, { route: "/api/cashier/shift/close", context: "n8n dispatch failed" });
			}
		}

		const zReport = {
			shift,
			metrics: {
				cashSales: metrics.cashSales,
				upiSales: metrics.upiSales,
				cardSales: metrics.cardSales,
				totalSales: metrics.cashSales + metrics.upiSales + metrics.cardSales,
				voids: { count: metrics.voidsCount, amount: metrics.voidsAmount },
				discounts: { count: metrics.discountsCount, amount: metrics.discountsAmount },
				refunds: { count: metrics.refundsCount, amount: metrics.refundsAmount },
				kotCount: metrics.kotCount,
				tips: metrics.tips,
				expectedCash,
				countedCash,
				variance,
				tolerance,
				flagged,
				hashChainSeq,
			},
		};

		return NextResponse.json({ status: 200, ...zReport });
	} catch (err) {
		captureError(err, { route: "/api/cashier/shift/close" });
		return CatchNextResponse(err);
	}
}
