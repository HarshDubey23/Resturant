/** @file GET/POST /api/feedback/[token] — token-gated customer feedback API.
 *    The token is a base64url(JSON{ o, r, e }) payload + "." + base64url(HMAC)
 *    signed with N8N_WEBHOOK_SECRET (re-used so no new env var is required).
 *    The payload carries the orderId, restaurantID and a 30-day expiry. GET
 *    returns the public restaurant identity + whether feedback was already
 *    submitted. POST validates the body with zod, creates the feedback doc
 *    (or 409 if one already exists for the order), and — for rating ≤ 2 —
 *    fires the `feedback.negative` n8n event so the owner gets an instant
 *    WhatsApp alert + the dashboard inbox picks it up.
 * @phase 3
 * @audit-finding n/a
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { triggerN8nWorkflow } from "#lib/n8n/client";
import connectDB from "#utils/database/connect";
import { Customers } from "#utils/database/models/customer";
import { Feedbacks } from "#utils/database/models/feedback";
import { Orders } from "#utils/database/models/order";
import { Profiles } from "#utils/database/models/profile";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const FEEDBACK_COMMENT_MAX = 500;
const FEEDBACK_TAGS_MAX = 8;

interface FeedbackTokenPayload {
	o: string; // orderId (hex ObjectId string)
	r: string; // restaurantID (lowercase slug)
	e: number; // expiry (ms since epoch)
}

function base64UrlEncode(input: string): string {
	return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
	return Buffer.from(input, "base64url").toString("utf8");
}

function getSecret(): string {
	return process.env.N8N_WEBHOOK_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
}

function signMessage(message: string): string {
	const secret = getSecret();
	if (!secret) {
		throw { status: 500, message: "Feedback signing secret not configured" };
	}
	return createHmac("sha256", secret).update(message).digest("base64url");
}

/** Split `payload.signature`, verify the HMAC (constant-time), and return the
 *    decoded JSON payload. Throws { status, message } on any failure. */
function verifyToken(rawToken: string): FeedbackTokenPayload {
	const dot = rawToken.lastIndexOf(".");
	if (dot <= 0 || dot === rawToken.length - 1) {
		throw { status: 400, message: "Malformed feedback token" };
	}
	const payloadB64 = rawToken.slice(0, dot);
	const signature = rawToken.slice(dot + 1);
	const expectedSig = signMessage(payloadB64);
	const a = Buffer.from(signature);
	const b = Buffer.from(expectedSig);
	if (a.length !== b.length || !timingSafeEqual(a, b)) {
		throw { status: 401, message: "Invalid feedback token signature" };
	}
	let parsed: FeedbackTokenPayload;
	try {
		parsed = JSON.parse(base64UrlDecode(payloadB64)) as FeedbackTokenPayload;
	} catch {
		throw { status: 400, message: "Malformed feedback token payload" };
	}
	if (!parsed?.o || !parsed?.r || typeof parsed.e !== "number") {
		throw { status: 400, message: "Incomplete feedback token" };
	}
	if (parsed.e < Date.now()) {
		throw { status: 410, message: "Feedback link has expired" };
	}
	return parsed;
}

/** Public helper for other server code (e.g. order-complete notification flow)
 *    to mint a feedback token for a finished order. Exported but not used
 *    inside this file — kept here so the token format has a single source. */
export function signFeedbackToken(orderId: string, restaurantID: string): string {
	const payload: FeedbackTokenPayload = { o: orderId, r: restaurantID, e: Date.now() + TOKEN_TTL_MS };
	const payloadB64 = base64UrlEncode(JSON.stringify(payload));
	const signature = signMessage(payloadB64);
	return `${payloadB64}.${signature}`;
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
	try {
		const { token } = await params;
		const decoded = verifyToken(token);

		await connectDB();

		const [order, profile, existingFeedback] = await Promise.all([
			Orders.findById(decoded.o).select("restaurantID customer").lean(),
			Profiles.findOne({ restaurantID: decoded.r }).select("name logoUrl avatar").lean(),
			Feedbacks.findOne({ order: decoded.o }).select("_id").lean(),
		]);

		if (!order) throw { status: 404, message: "Order not found" };
		if (String(order.restaurantID).toLowerCase() !== decoded.r.toLowerCase()) {
			throw { status: 403, message: "Token does not match order" };
		}

		const profileDoc = profile as { name?: string; logoUrl?: string; avatar?: string } | null;
		return NextResponse.json({
			restaurantName: profileDoc?.name ?? decoded.r,
			logoUrl: profileDoc?.logoUrl ?? profileDoc?.avatar ?? null,
			orderId: decoded.o,
			submitted: !!existingFeedback,
		});
	} catch (err) {
		if (err && typeof err === "object" && "status" in err) {
			return CatchNextResponse(err);
		}
		captureError(err, { route: "/api/feedback/[token] GET" });
		return CatchNextResponse(err);
	}
}

// ─── POST ────────────────────────────────────────────────────────────────────

const feedbackBodySchema = z.object({
	rating: z.number().int().min(1).max(5),
	tags: z.array(z.string().trim().max(40)).max(FEEDBACK_TAGS_MAX).default([]),
	comment: z.string().trim().max(FEEDBACK_COMMENT_MAX).optional().default(""),
});

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
	try {
		const { token } = await params;
		const decoded = verifyToken(token);

		const body = await req.json();
		const parsed = feedbackBodySchema.safeParse(body);
		if (!parsed.success) {
			throw { status: 400, message: parsed.error.issues?.[0]?.message ?? "Invalid feedback payload" };
		}
		const { rating, tags, comment } = parsed.data;

		await connectDB();

		const [order, existingFeedback] = await Promise.all([
			Orders.findById(decoded.o).select("restaurantID customer state").lean(),
			Feedbacks.findOne({ order: decoded.o }).select("_id").lean(),
		]);

		if (!order) throw { status: 404, message: "Order not found" };
		if (String(order.restaurantID).toLowerCase() !== decoded.r.toLowerCase()) {
			throw { status: 403, message: "Token does not match order" };
		}
		if (existingFeedback) throw { status: 409, message: "Feedback already submitted for this order" };

		// Resolve the customer's phone so the negative-feedback n8n workflow can
		// message the owner with a clickable customer reference.
		const customerDoc = order.customer ? await Customers.findById(order.customer).select("phone fname lname").lean() : null;
		const customerPhone = customerDoc?.phone ?? "";
		const customerName = customerDoc ? `${customerDoc.fname ?? ""} ${customerDoc.lname ?? ""}`.trim() : "Guest";

		const restaurantID = String(order.restaurantID).toLowerCase();

		await Feedbacks.create({
			restaurantID,
			order: decoded.o,
			customer: order.customer ?? undefined,
			rating,
			tags,
			comment,
			orderId: decoded.o,
			customerId: order.customer ?? undefined,
			customerPhone,
			refunded: false,
			refundAmount: 0,
		});

		if (rating <= 2) {
			// Fire-and-forget — the workflow is idempotent (deduped by eventId in
			// the n8n dispatcher) and the dashboard inbox polls the DB directly, so
			// a transient n8n outage does not affect feedback persistence.
			triggerN8nWorkflow("feedback.negative", {
				orderId: decoded.o,
				restaurantID,
				customerPhone,
				customerName,
				rating,
				comment,
				tags,
			}).catch((e: unknown) => captureError(e, { route: "/api/feedback/[token] POST", context: "feedback.negative n8n dispatch" }));
		}

		return NextResponse.json({ status: 200, submitted: true });
	} catch (err) {
		if (err && typeof err === "object" && "status" in err) {
			return CatchNextResponse(err);
		}
		captureError(err, { route: "/api/feedback/[token] POST" });
		return CatchNextResponse(err);
	}
}
