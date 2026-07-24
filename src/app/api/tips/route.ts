/** @file GET/POST /api/tips — Phase 3 waiter tip journal.
 *    GET: list tip entries for a restaurant, with optional `?waiterId=`,
 *    `?from=`, `?to=` filters. Returns an aggregated list of individual tip
 *    events (flattened from the per-waiter tipLedger docs) plus a per-waiter
 *    totals roll-up. Supports dual auth: NextAuth session (staff UI — scoped
 *    to the session's restaurant) OR `X-N8N-Secret` raw constant-time compare
 *    (n8n weekly report — `restaurantID` query param required).
 *    POST: record a tip `{ orderId, amount, waiterId, waiterName }` — usually
 *    called from the payment success webhook, but also allows manual entry.
 *    Updates `order.tip` and upserts the waiter's `tipLedger` (atomic
 *    `$inc: totalTips` + `$push: tips[]`). Requires NextAuth session — the
 *    n8n-secret auth path is GET-only (writes from n8n are not permitted).
 * @phase 3
 * @audit-finding n/a
 */
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { TipLedgers } from "#utils/database/models/tipLedger";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SessionWithRestaurant {
	user?: { username?: string; role?: string; restaurant?: { username?: string } };
	username?: string;
	role?: string;
	restaurant?: { username?: string };
}

interface TipLedgerDoc {
	restaurantID: string;
	waiterId: { toString(): string };
	waiterName: string;
	totalTips: number;
	tips: Array<{
		amount: number;
		orderId?: { toString(): string };
		date: Date;
		paidOut: boolean;
	}>;
}

interface PostBody {
	orderId?: string;
	amount?: number;
	waiterId?: string;
	waiterName?: string;
}

interface AuthResult {
	ok: boolean;
	status?: number;
	message?: string;
	restaurantID?: string;
	role?: string;
}

function safeSecretEqual(headerValue: string, secret: string): boolean {
	if (!headerValue || !secret) return false;
	const a = Buffer.from(headerValue);
	const b = Buffer.from(secret);
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

/** Resolves the caller's identity. Priority: (1) `X-N8N-Secret` raw
 *  constant-time compare → n8n caller, restaurantID from query param.
 *  (2) NextAuth session → staff caller, restaurantID from session. */
async function authenticate(req: Request, url: URL): Promise<AuthResult> {
	const secret = process.env.N8N_WEBHOOK_SECRET ?? "";
	const headerSecret = req.headers.get("x-n8n-secret") ?? "";
	if (headerSecret && secret && safeSecretEqual(headerSecret, secret)) {
		const restaurantID = url.searchParams.get("restaurantID") ?? "";
		if (!restaurantID) {
			return { ok: false, status: 400, message: "restaurantID required for n8n auth" };
		}
		return { ok: true, restaurantID, role: "n8n" };
	}

	const session = (await getServerSession(authOptions)) as SessionWithRestaurant | null;
	if (!session) return { ok: false, status: 401, message: "Authentication required" };

	const restaurantID = session.user?.username ?? session.user?.restaurant?.username ?? session.username ?? session.restaurant?.username ?? "";
	if (!restaurantID) return { ok: false, status: 400, message: "Restaurant username missing from session" };
	return { ok: true, restaurantID, role: session.user?.role ?? session.role ?? "" };
}

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const auth = await authenticate(req, url);
		if (!auth.ok) {
			throw { status: auth.status ?? 401, message: auth.message ?? "Authentication required" };
		}
		const restaurantID = auth.restaurantID as string;

		const waiterId = url.searchParams.get("waiterId") ?? undefined;
		const fromStr = url.searchParams.get("from") ?? undefined;
		const toStr = url.searchParams.get("to") ?? undefined;

		const from = fromStr ? new Date(fromStr) : undefined;
		const to = toStr ? new Date(toStr) : undefined;
		if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
			throw { status: 400, message: "Invalid from/to date" };
		}

		await connectDB();

		const filter: Record<string, unknown> = { restaurantID };
		if (waiterId) filter.waiterId = waiterId;

		const ledgers = (await TipLedgers.find(filter).lean()) as unknown as TipLedgerDoc[];

		const tips: Array<{
			amount: number;
			orderId: string | null;
			waiterId: string;
			waiterName: string;
			date: string;
			paidOut: boolean;
		}> = [];
		const perWaiter = new Map<string, { waiterId: string; waiterName: string; totalTips: number; count: number }>();

		for (const ledger of ledgers) {
			const wId = ledger.waiterId.toString();
			const wName = ledger.waiterName;
			for (const tip of ledger.tips ?? []) {
				if (from && new Date(tip.date) < from) continue;
				if (to && new Date(tip.date) > to) continue;
				tips.push({
					amount: tip.amount,
					orderId: tip.orderId ? tip.orderId.toString() : null,
					waiterId: wId,
					waiterName: wName,
					date: new Date(tip.date).toISOString(),
					paidOut: tip.paidOut,
				});
				const agg = perWaiter.get(wId) ?? { waiterId: wId, waiterName: wName, totalTips: 0, count: 0 };
				agg.totalTips += tip.amount;
				agg.count += 1;
				perWaiter.set(wId, agg);
			}
		}

		// Newest first — UI shows the most recent tip at the top.
		tips.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

		return NextResponse.json({
			count: tips.length,
			tips,
			perWaiter: Array.from(perWaiter.values()).sort((a, b) => b.totalTips - a.totalTips),
		});
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export async function POST(req: Request) {
	try {
		// POST is write-only — n8n-secret auth is intentionally NOT accepted
		// here (writes from external systems must go through the payment webhook
		// or a staff UI session). Reject the X-N8N-Secret header explicitly so
		// the rejection is visible to operators.
		if (req.headers.get("x-n8n-secret")) {
			throw { status: 403, message: "n8n-secret auth is read-only; tips must be recorded via an authenticated session" };
		}

		const session = (await getServerSession(authOptions)) as SessionWithRestaurant | null;
		if (!session) throw { status: 401, message: "Authentication required" };
		const restaurantID = session.user?.username ?? session.user?.restaurant?.username ?? session.username ?? session.restaurant?.username ?? "";
		if (!restaurantID) throw { status: 400, message: "Restaurant username missing from session" };

		const body = (await req.json().catch(() => null)) as PostBody | null;
		if (!body) throw { status: 400, message: "Invalid JSON body" };

		const { orderId, amount, waiterId, waiterName } = body;
		if (!orderId) throw { status: 400, message: "orderId is required" };
		if (!waiterId) throw { status: 400, message: "waiterId is required" };
		if (!waiterName) throw { status: 400, message: "waiterName is required" };
		const tipAmount = Number(amount);
		if (!Number.isFinite(tipAmount) || tipAmount < 0) {
			throw { status: 400, message: "amount must be a non-negative number" };
		}

		await connectDB();

		const order = await Orders.findById(orderId);
		if (!order) throw { status: 404, message: "Order not found" };
		if (order.restaurantID !== restaurantID) {
			throw { status: 403, message: "Order belongs to a different restaurant" };
		}

		// Persist on the order doc — `order.tip` is the canonical record for
		// the receipt/reprint, the tipLedger is the per-waiter journal.
		// Mongoose auto-casts `waiterId` (string) to ObjectId on save.
		order.tip = {
			amount: tipAmount,
			waiterId: waiterId as unknown as import("mongoose").Types.ObjectId,
			waiterName,
			tippedAt: new Date(),
		};
		await order.save();

		// Upsert the per-waiter ledger atomically. The `$setOnInsert` block
		// only fires on the create path; subsequent tips hit `$inc` + `$push`.
		await TipLedgers.findOneAndUpdate(
			{ restaurantID, waiterId },
			{
				$inc: { totalTips: tipAmount },
				$push: {
					tips: {
						amount: tipAmount,
						orderId: order._id,
						date: new Date(),
						paidOut: false,
					},
				},
				$setOnInsert: {
					restaurantID,
					waiterId,
					waiterName,
					totalTips: 0,
				},
			},
			{ upsert: true, new: true },
		);

		return NextResponse.json({
			ok: true,
			orderId: String(order._id),
			amount: tipAmount,
			waiterId,
			waiterName,
		});
	} catch (err) {
		if (err && typeof err === "object" && "status" in err) {
			return CatchNextResponse(err);
		}
		captureError(err, { route: "/api/tips POST" });
		return CatchNextResponse({ message: "Failed to record tip", status: 500 });
	}
}
