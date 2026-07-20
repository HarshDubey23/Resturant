import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { rateLimitMiddleware } from "#utils/helper/rateLimit";

const _ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const ip = req.headers.get("x-forwarded-for") ?? "unknown";
		const rateLimitResponse = await rateLimitMiddleware(`voice-tts:${ip}`, 10, 60000);
		if (rateLimitResponse) return rateLimitResponse;

		const { text, voice } = await req.json();
		if (!text || typeof text !== "string") throw { status: 400, message: "Text is required" };

		const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
		if (!elevenLabsKey) {
			return NextResponse.json({ fallback: true, message: "TTS not configured, use browser SpeechSynthesis" });
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
