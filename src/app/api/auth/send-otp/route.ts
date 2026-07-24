import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { getRedis } from "#utils/database/redis";
import { CatchNextResponse } from "#utils/helper/common";
import { rateLimitMiddleware } from "#utils/helper/rateLimit";
import { sendWhatsAppText } from "#utils/whatsapp/index";

const OTP_TTL_SECONDS = 300; // 5 minutes
const OTP_RATE_LIMIT = 5; // max OTP requests
const OTP_RATE_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes (per phone AND per IP)

// Demo mode is a development-only convenience. It is hard-disabled in
// production builds regardless of how DEMO_MODE is configured, and only
// ever applies to the seeded "demo" restaurant slug — never to a real
// tenant. This mirrors the guard in authHelper's customer authorize.
function isDemoMode(restaurant: string): boolean {
	return restaurant === "demo" && process.env.NODE_ENV !== "production" && process.env.DEMO_MODE === "true";
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { restaurant, phone } = body;

		if (!restaurant || !phone) throw { status: 400, message: "restaurant and phone are required" };
		if (!/^[0-9+\-\s]{8,16}$/.test(String(phone))) throw { status: 400, message: "Invalid phone number format" };

		// Defense-in-depth rate limiting: per phone number AND per IP.
		// 5 OTP sends per 10 min on each dimension — blocks both targeted
		// harassment of a single number and broad IP-based spraying.
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
		const phoneLimit = await rateLimitMiddleware(`send-otp:phone:${restaurant}:${phone}`, OTP_RATE_LIMIT, OTP_RATE_WINDOW_MS);
		if (phoneLimit) return phoneLimit;
		const ipLimit = await rateLimitMiddleware(`send-otp:ip:${ip}`, OTP_RATE_LIMIT, OTP_RATE_WINDOW_MS);
		if (ipLimit) return ipLimit;

		// Demo mode short-circuit: skip OTP generation + WhatsApp send entirely.
		// The client checks `demoMode === true` in the response body and proceeds
		// to the details step without prompting for an OTP. The customer authorize
		// callback (authHelper.ts) also skips token verification in demo mode.
		if (isDemoMode(restaurant)) {
			return NextResponse.json({ demoMode: true, delivered: false });
		}

		await connectDB();

		const otp = randomInt(100000, 999999).toString();
		const redis = getRedis();
		await redis.setex(`otp:${restaurant}:${phone}`, OTP_TTL_SECONDS, otp);
		// Reset attempt counter for the fresh OTP
		await redis.del(`otp-attempts:${restaurant}:${phone}`);

		// Debug OTP is only ever exposed in a true local development environment.
		// DEMO_MODE can never unlock it outside of development.
		const isDev = process.env.NODE_ENV === "development";
		let delivered = false;

		try {
			await sendWhatsAppText(phone, `Your OrderWorder OTP is: ${otp}. Valid for 5 minutes.`);
			delivered = true;
		} catch {
			// WhatsApp delivery failure is non-fatal in dev (debug OTP is surfaced
			// below via the response body). In production a failed send still returns
			// 200 so we don't leak transport-state to the client; the user simply
			// requests a new OTP. Reported to Sentry via the catch-all below if it
			// throws past the outer try.
		}

		return NextResponse.json({
			delivered,
			...(isDev && { debugOtp: otp }),
		});
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
