import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { getRedis } from "#utils/database/redis";
import { CatchNextResponse } from "#utils/helper/common";
import { sendWhatsAppText } from "#utils/whatsapp/index";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { restaurant, phone } = body;

		if (!restaurant || !phone) throw { status: 400, message: "restaurant and phone are required" };

		await connectDB();

		const otp = randomInt(100000, 999999).toString();
		const redis = getRedis();
		await redis.setex(`otp:${restaurant}:${phone}`, 300, otp);

		const isDev = process.env.NODE_ENV === "development" || process.env.DEMO_MODE === "true";
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
