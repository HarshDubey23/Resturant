/** @file POST /api/webhooks/n8n — inbound n8n webhook receiver. Verifies the
 *    HMAC-SHA256 signature in constant time (node:crypto timingSafeEqual) against
 *    process.env.N8N_WEBHOOK_SECRET, deduplicates by eventId via the idempotency
 *    store, dispatches to `dispatchN8nEvent`, and returns 200/400/500 with
 *    captureError on every failure path. No console calls.
 * @phase 3
 * @audit-finding n/a
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { dispatchN8nEvent } from "#lib/n8n/dispatcher";
import { env } from "#lib/n8n/env";
import { isDuplicate, markProcessed } from "#lib/n8n/idempotency";
import { captureError } from "#utils/helper/sentryWrapper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifySignature(rawBody: string, header: string, secret: string): boolean {
	if (!header || !secret) return false;
	const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
	const a = Buffer.from(header);
	const b = Buffer.from(expected);
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

function isIpAllowed(req: NextRequest): boolean {
	if (!env.N8N_INBOUND_ALLOWED_IPS) return true;
	const clientIp = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
	return env.N8N_INBOUND_ALLOWED_IPS.split(",")
		.map((s: string) => s.trim())
		.includes(clientIp);
}

interface HandledError {
	status: number;
	message: string;
}

function isHandledError(err: unknown): err is HandledError {
	return typeof err === "object" && err !== null && "status" in err && "message" in err;
}

export async function POST(req: NextRequest) {
	if (!isIpAllowed(req)) {
		return NextResponse.json({ error: "forbidden" }, { status: 403 });
	}

	const rawBody = await req.text();
	const signature = req.headers.get("x-n8n-signature") ?? "";

	if (!verifySignature(rawBody, signature, env.N8N_WEBHOOK_SECRET)) {
		captureError(new Error("Invalid n8n HMAC signature"), { route: "webhook/n8n" });
		return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
	}

	let payload: { eventType?: string; eventId?: string; data?: unknown };
	try {
		payload = JSON.parse(rawBody) as { eventType?: string; eventId?: string; data?: unknown };
	} catch {
		return NextResponse.json({ error: "invalid_json" }, { status: 400 });
	}

	const eventId = payload.eventId || req.headers.get("x-request-id") || "";
	if (!eventId) {
		return NextResponse.json({ error: "missing_event_id" }, { status: 400 });
	}

	// Idempotency: the `isDuplicate` create-or-fail atomic guarantees only one
	// webhook processing per eventId even under n8n retries. A duplicate returns
	// 200 (so n8n stops retrying) but skips dispatch.
	try {
		if (await isDuplicate(eventId)) {
			return NextResponse.json({ ok: true, deduplicated: true });
		}
	} catch (err) {
		captureError(err, { route: "webhook/n8n/idempotency", eventId });
		return NextResponse.json({ error: "idempotency_check_failed" }, { status: 500 });
	}

	try {
		await dispatchN8nEvent(payload.eventType || "unknown", payload.data);
		await markProcessed(eventId, payload);
	} catch (err) {
		captureError(err, { route: "webhook/n8n/dispatch", eventType: payload.eventType, eventId });
		// Handled errors (400/404 from the dispatcher) → 400 so n8n alerts but
		// doesn't retry forever on a malformed payload. Unexpected errors → 500
		// so n8n retries with backoff.
		if (isHandledError(err) && err.status >= 400 && err.status < 500) {
			return NextResponse.json({ error: "handled", message: err.message }, { status: err.status });
		}
		return NextResponse.json({ error: "dispatch_failed" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
