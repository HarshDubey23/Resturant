import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { getRedis } from "#utils/database/redis";
import { CatchNextResponse } from "#utils/helper/common";
import { rateLimit } from "#utils/helper/rateLimit";
import { sendWhatsAppText } from "#utils/whatsapp/index";

const OTP_TTL_SECONDS = 300; // 5 minutes
const OTP_RATE_LIMIT = 5; // max OTP requests
const OTP_RATE_WINDOW_MS = 60 * 60 * 1000; // per hour

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { restaurant, phone } = body;

		if (!restaurant || !phone) throw { status: 400, message: "restaurant and phone are required" };
		if (!/^[0-9+\-\s]{8,16}$/.test(String(phone))) throw { status: 400, message: "Invalid phone number format" };

		// Defense-in-depth rate limiting: per phone number AND per IP.
		// Max 5 OTP requests per hour on each dimension.
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
		const [phoneLimit, ipLimit] = await Promise.all([
			rateLimit(`send-otp:phone:${restaurant}:${phone}`, OTP_RATE_LIMIT, OTP_RATE_WINDOW_MS),
			rateLimit(`send-otp:ip:${ip}`, OTP_RATE_LIMIT * 2, OTP_RATE_WINDOW_MS),
		]);

		const exceeded = !phoneLimit.ok ? phoneLimit : !ipLimit.ok ? ipLimit : null;
		if (exceeded) {
			return NextResponse.json(
				{ message: "Too many OTP requests. Please try again later." },
				{ status: 429, headers: { "Retry-After": String(Math.ceil(exceeded.resetIn / 1000)) } },
			);
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
			if (isDev) console.warn("[send-otp] WhatsApp send failed, showing debug OTP");
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
