"use client";

/**
 * useFreeVoiceTTS — Truly free Text-to-Speech using the browser's
 * built-in SpeechSynthesis API. No API keys, no network calls,
 * works offline. Voices depend on the OS/browser (Chrome on Android
 * has 90+ languages including Hindi).
 *
 * Picks the best available voice for the requested language, falling
 * back to the default voice. Handles the long-standing Chrome bug
 * where speech synthesis pauses after ~15s by chunking long text into
 * sentence-sized utterances.
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface VoiceInfo {
	name: string;
	lang: string;
	voiceURI: string;
}

function loadVoices(): VoiceInfo[] {
	if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
	return window.speechSynthesis.getVoices().map((v) => ({ name: v.name, lang: v.lang, voiceURI: v.voiceURI }));
}

function pickVoice(voices: VoiceInfo[], lang: string): VoiceInfo | null {
	if (voices.length === 0) return null;
	// Try exact lang first (e.g. "hi-IN"), then prefix match ("hi"), then default
	const exact = voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase());
	if (exact) return exact;
	const prefix = lang.split("-")[0].toLowerCase();
	const partial = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
	if (partial) return partial;
	return voices[0];
}

function chunkText(text: string, maxLen = 200): string[] {
	if (text.length <= maxLen) return [text];
	// Split on sentence boundaries first, then merge up to maxLen
	const sentences = text.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) || [text];
	const chunks: string[] = [];
	let current = "";
	for (const s of sentences) {
		if ((current + s).length > maxLen) {
			if (current) chunks.push(current.trim());
			current = s;
		} else {
			current += s;
		}
	}
	if (current.trim()) chunks.push(current.trim());
	return chunks;
}

export interface UseFreeVoiceTTSReturn {
	speaking: boolean;
	paused: boolean;
	supported: boolean;
	voices: VoiceInfo[];
	speak: (text: string, opts?: { lang?: string; rate?: number; pitch?: number }) => void;
	cancel: () => void;
	pause: () => void;
	resume: () => void;
}

export function useFreeVoiceTTS(): UseFreeVoiceTTSReturn {
	const supported = typeof window !== "undefined" && "speechSynthesis" in window;
	const [speaking, setSpeaking] = useState(false);
	const [paused, setPaused] = useState(false);
	const [voices, setVoices] = useState<VoiceInfo[]>([]);
	const queueRef = useRef<SpeechSynthesisUtterance[]>([]);
	const indexRef = useRef(0);

	useEffect(() => {
		if (!supported) return;
		const update = () => setVoices(loadVoices());
		update();
		window.speechSynthesis.onvoiceschanged = update;
		return () => {
			window.speechSynthesis.onvoiceschanged = null;
			try {
				window.speechSynthesis.cancel();
			} catch {}
		};
	}, [supported]);

	const cancel = useCallback(() => {
		if (!supported) return;
		queueRef.current = [];
		indexRef.current = 0;
		try {
			window.speechSynthesis.cancel();
		} catch {}
		setSpeaking(false);
		setPaused(false);
	}, [supported]);

	const speak = useCallback(
		(text: string, opts: { lang?: string; rate?: number; pitch?: number } = {}) => {
			if (!supported || !text.trim()) return;
			const synth = window.speechSynthesis;
			synth.cancel(); // interrupt any ongoing speech
			queueRef.current = [];
			indexRef.current = 0;

			const allVoices = synth.getVoices().map((v) => ({ name: v.name, lang: v.lang, voiceURI: v.voiceURI }));
			const voiceInfo = pickVoice(allVoices, opts.lang || "en-US");
			const voice = voiceInfo ? synth.getVoices().find((v) => v.voiceURI === voiceInfo.voiceURI) : null;

			const chunks = chunkText(text);
			const utterances = chunks.map((chunk) => {
				const u = new SpeechSynthesisUtterance(chunk);
				if (voice) u.voice = voice;
				u.lang = opts.lang || voice?.lang || "en-US";
				u.rate = opts.rate ?? 1;
				u.pitch = opts.pitch ?? 1;
				u.volume = 1;
				return u;
			});

			queueRef.current = utterances;

			const speakNext = () => {
				if (indexRef.current >= utterances.length) {
					setSpeaking(false);
					setPaused(false);
					queueRef.current = [];
					indexRef.current = 0;
					return;
				}
				const u = utterances[indexRef.current];
				u.onend = () => {
					indexRef.current++;
					speakNext();
				};
				u.onerror = () => {
					indexRef.current++;
					speakNext();
				};
				try {
					synth.speak(u);
				} catch {
					setSpeaking(false);
				}
			};

			setSpeaking(true);
			setPaused(false);
			speakNext();
		},
		[supported],
	);

	const pause = useCallback(() => {
		if (!supported) return;
		try {
			window.speechSynthesis.pause();
			setPaused(true);
		} catch {}
	}, [supported]);

	const resume = useCallback(() => {
		if (!supported) return;
		try {
			window.speechSynthesis.resume();
			setPaused(false);
		} catch {}
	}, [supported]);

	return { speaking, paused, supported, voices, speak, cancel, pause, resume };
}
