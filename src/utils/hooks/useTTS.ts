"use client";

import { useCallback, useRef } from "react";

export function useTTS() {
	const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

	const speak = useCallback(async (text: string, useElevenLabs = false) => {
		if (!text) return;

		if (useElevenLabs) {
			try {
				const res = await fetch("/api/voice/tts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ text }),
				});
				if (!res.ok) throw new Error("TTS API error");
				const blob = await res.blob();
				const url = URL.createObjectURL(blob);
				const audio = new Audio(url);
				await audio.play();
				URL.revokeObjectURL(url);
				return;
			} catch {
				console.warn("[useTTS] ElevenLabs failed, falling back to browser SpeechSynthesis");
			}
		}

		if (!("speechSynthesis" in window)) {
			console.warn("[useTTS] SpeechSynthesis not available");
			return;
		}

		window.speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = "en-IN";
		utterance.rate = 0.9;
		utteranceRef.current = utterance;
		window.speechSynthesis.speak(utterance);
	}, []);

	const stop = useCallback(() => {
		window.speechSynthesis.cancel();
	}, []);

	return { speak, stop };
}
