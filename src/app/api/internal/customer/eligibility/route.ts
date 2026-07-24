/** @file POST /api/internal/customer/eligibility — Phase 3 Commission Saver.
 *    Called by the n8n `commission_saver` workflow 3 days after a customer is
 *    acquired. Verifies the `X-N8N-Secret` header in constant time against
 *    N8N_WEBHOOK_SECRET. Returns `{ eligible, offerCode?, directOrderUrl?,
 *    customerPhone }`. Eligible = (a) customer exists, (b) source !== "direct"
 *    (aggregator/qr/unknown customers are worth winning back), and (c) the
 *    customer has placed AT MOST one order in the last 3 days (so we don't
 *    spam repeat customers). On eligible, a single-use offer code is generated
 *    and a direct-order URL is returned for the WhatsApp template payload.
 * @phase 3
 * @audit-finding n/a
 */
import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Customers } from "#utils/database/models/customer";
import { Orders } from "#utils/database/models/order";
import { captureError } from "#utils/helper/sentryWrapper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Constant-time comparison of two secret strings. Returns false if either is
 *  empty or lengths differ — both branches are unavoidable side-channel risks
 *  for short-circuit comparison, so we fail closed and log via captureError. */
function safeSecretEqual(headerValue: string, secret: string): boolean {
	if (!headerValue || !secret) return false;
	const a = Buffer.from(headerValue);
	const b = Buffer.from(secret);
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

interface EligibilityBody {
	customerPhone?: string;
	restaurantID?: string;
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
	const secret = process.env.N8N_WEBHOOK_SECRET ?? "";
	if (!secret) {
		captureError(new Error("N8N_WEBHOOK_SECRET not configured"), {
			route: "internal/customer/eligibility",
		});
		return NextResponse.json({ error: "missing_secret" }, { status: 500 });
	}

	const headerSecret = req.headers.get("x-n8n-secret") ?? "";
	if (!safeSecretEqual(headerSecret, secret)) {
		captureError(new Error("Invalid X-N8N-Secret on /api/internal/customer/eligibility"), {
			route: "internal/customer/eligibility",
		});
		return NextResponse.json({ error: "invalid_secret" }, { status: 401 });
	}

	let body: EligibilityBody;
	try {
		body = (await req.json()) as EligibilityBody;
	} catch {
		return NextResponse.json({ error: "invalid_json" }, { status: 400 });
	}

	const { customerPhone, restaurantID } = body;
	if (!customerPhone || !restaurantID) {
		return NextResponse.json({ error: "customerPhone and restaurantID are required" }, { status: 400 });
	}

	await connectDB();

	const customer = await Customers.findOne({
		phone: customerPhone,
		restaurantID,
	}).lean();

	// Customer-not-found is NOT an error condition for n8n — we return
	// eligible:false so the workflow's If-Eligible node skips the WhatsApp send.
	if (!customer) {
		return NextResponse.json({
			eligible: false,
			customerPhone,
		});
	}

	// Direct-acquired customers already bypass aggregators — no commission to save.
	if (customer.source === "direct") {
		return NextResponse.json({
			eligible: false,
			customerPhone,
		});
	}

	// Has the customer placed a 2nd order in the last 3 days? If yes, they're
	// actively engaged → don't spam them. Count <= 1 means 0 or 1 order in the
	// window → eligible.
	const since = new Date(Date.now() - THREE_DAYS_MS);
	const recentOrdersCount = await Orders.countDocuments({
		customer: customer._id,
		restaurantID,
		createdAt: { $gte: since },
	});

	if (recentOrdersCount > 1) {
		return NextResponse.json({
			eligible: false,
			customerPhone,
		});
	}

	const offerCode = `DIRECT10-${randomUUID().slice(0, 6).toUpperCase()}`;
	const baseUrl = process.env.NEXT_PUBLIC_URL ?? process.env.NEXTAUTH_URL ?? "";
	const directOrderUrl = `${baseUrl}/${restaurantID}/direct?code=${offerCode}`;

	return NextResponse.json({
		eligible: true,
		offerCode,
		directOrderUrl,
		customerPhone,
	});
}
