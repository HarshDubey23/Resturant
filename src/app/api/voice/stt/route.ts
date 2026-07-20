import { NextResponse } from "next/server";
import { CatchNextResponse } from "#utils/helper/common";

const PROVIDERS = [
	{ keyEnv: "AI_GROQ_KEY", url: "https://api.groq.com/openai/v1/audio/transcriptions", model: "whisper-large-v3" },
	{ keyEnv: "AI_CEREBRAS_KEY", url: "https://api.cerebras.ai/v1/audio/transcriptions", model: "whisper-large-v3" },
];

const RECORDING_TOO_SHORT = "Recording too short. Please speak again.";
const _NO_SPEECH_DETECTED = "No speech detected. Please try again.";
const SERVICE_UNAVAILABLE = "Voice service unavailable. Please type your order.";

async function tryProvider(provider: { keyEnv: string; url: string; model: string }, audio: Blob, signal?: AbortSignal): Promise<string | null> {
	const key = process.env[provider.keyEnv];
	if (!key) return null;

	const form = new FormData();
	form.append("model", provider.model);
	form.append("file", audio, "recording.wav");
	form.append("language", "hi");
	form.append("response_format", "json");
	form.append("temperature", "0");

	const res = await fetch(provider.url, {
		method: "POST",
		headers: { Authorization: `Bearer ${key}` },
		body: form,
		signal,
	});

	if (res.status === 429) return null;
	if (!res.ok) return null;

	const data = await res.json();
	const text = (data.text || "").trim();
	return text || null;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		const audio = formData.get("audio") as Blob | null;
		if (!audio) throw { status: 400, message: "Audio blob is required" };

		if (audio.size < 2000) {
			return NextResponse.json({ error: RECORDING_TOO_SHORT, text: "" });
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 15000);
		let text: string | null = null;

		try {
			for (const provider of PROVIDERS) {
				text = await tryProvider(provider, audio, controller.signal);
				if (text) break;
			}
		} finally {
			clearTimeout(timeout);
		}

		if (!text) {
			return NextResponse.json({ error: SERVICE_UNAVAILABLE, text: "" });
		}

		const isHindiOnly = /^[\u0900-\u097F\s]+$/.test(text);
		const detectedLang = isHindiOnly ? "hi" : text.length < 3 ? "unknown" : "hi-en";

		return NextResponse.json({ text, detectedLanguage: detectedLang });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}
