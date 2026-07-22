import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import AIConfig from "#utils/database/models/aiConfig";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { rateLimitMiddleware } from "#utils/helper/rateLimit";

const DAILY_TTS_CHAR_LIMIT = 10000;

async function checkTtsDailyBudget(restaurantID: string, textLength: number): Promise<boolean> {
	try {
		await connectDB();
		const now = new Date();
		const config = await AIConfig.findOneAndUpdate({ restaurantID }, { $inc: { dailyTtsChars: textLength } }, { new: true, upsert: true });
		const lastReset = config?.lastTtsReset ?? new Date(0);
		if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
			await AIConfig.updateOne({ restaurantID }, { $set: { dailyTtsChars: textLength, lastTtsReset: now } });
			return textLength <= DAILY_TTS_CHAR_LIMIT;
		}
		return (config?.dailyTtsChars ?? 0) <= DAILY_TTS_CHAR_LIMIT;
	} catch {
		return true;
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const restaurantID = session.username as string;
		const ip = req.headers.get("x-forwarded-for") ?? "unknown";
		const rateLimitResponse = await rateLimitMiddleware(`voice-tts:${ip}`, 10, 60000);
		if (rateLimitResponse) return rateLimitResponse;

		const { text, voice } = await req.json();
		if (!text || typeof text !== "string") throw { status: 400, message: "Text is required" };

		if (!(await checkTtsDailyBudget(restaurantID, text.length))) {
			return NextResponse.json({ error: "Daily TTS character limit reached" }, { status: 429 });
		}

		const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
		if (!elevenLabsKey) {
			throw { status: 503, message: "ElevenLabs TTS not configured. Use browser SpeechSynthesis instead." };
		}

		const isHindi = /[\u0900-\u097F]/.test(text);
		const voiceId = voice || (isHindi ? "pqHfZKPn4CzCUMkZIhBQ" : "21m00Tcm4TlvDq8ikWAM");

		const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"xi-api-key": elevenLabsKey,
			},
			body: JSON.stringify({
				text,
				model_id: "eleven_multilingual_v2",
				voice_settings: { stability: 0.35, similarity_boost: 0.75, speed: 0.9 },
			}),
		});

		if (!res.ok) {
			const errBody = await res.json().catch(() => ({}));
			throw { status: 502, message: errBody.detail?.message || "TTS failed" };
		}

		const audioBuffer = await res.arrayBuffer();
		return new NextResponse(audioBuffer, {
			headers: {
				"Content-Type": "audio/mpeg",
				"Content-Length": audioBuffer.byteLength.toString(),
			},
		});
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}
