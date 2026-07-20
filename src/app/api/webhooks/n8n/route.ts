import { createHmac, timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { dispatchN8nEvent } from "#lib/n8n/dispatcher";
import { env } from "#lib/n8n/env";
import { isDuplicate, markProcessed } from "#lib/n8n/idempotency";
import { captureError } from "#utils/helper/sentryWrapper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifySignature(rawBody: string, header: string, secret: string): boolean {
	if (!header) return false;
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
		payload = JSON.parse(rawBody);
	} catch {
		return NextResponse.json({ error: "invalid_json" }, { status: 400 });
	}

	const eventId = payload.eventId || req.headers.get("x-request-id") || "";
	if (!eventId) {
		return NextResponse.json({ error: "missing_event_id" }, { status: 400 });
	}
	if (await isDuplicate(eventId)) {
		return NextResponse.json({ ok: true, deduplicated: true });
	}

	try {
		await dispatchN8nEvent(payload.eventType || "unknown", payload.data);
		await markProcessed(eventId, payload);
	} catch (err) {
		captureError(err, { route: "webhook/n8n/dispatch", eventType: payload.eventType });
		return NextResponse.json({ error: "dispatch_failed" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
