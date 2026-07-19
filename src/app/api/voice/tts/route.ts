import { NextResponse } from "next/server";
import { CatchNextResponse } from "#utils/helper/common";

const _ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM";

export async function POST(req: Request) {
	try {
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
