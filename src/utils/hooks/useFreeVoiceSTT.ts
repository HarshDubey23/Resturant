"use client";

/**
 * useFreeVoiceSTT — Truly free, in-browser Speech-to-Text.
 *
 * Uses @huggingface/transformers (Transformers.js) to run OpenAI Whisper
 * "tiny" model fully in the browser via WebGPU/WASM. No API keys, no
 * server cost, no rate limits. Model weights are fetched once from the
 * HuggingFace CDN and cached by the browser Cache API.
 *
 * Falls back to the browser's native Web Speech API (SpeechRecognition)
 * if the user's device cannot run Whisper in WASM (e.g. very low RAM).
 */

import { useCallback, useEffect, useRef, useState } from "react";

type STTEngine = {
	transcribe: (audio: Blob) => Promise<{ text: string }>;
};

let enginePromise: Promise<STTEngine> | null = null;

async function loadWhisperEngine(): Promise<STTEngine> {
	if (enginePromise) return enginePromise;

	enginePromise = (async () => {
		// Dynamic import — keeps the heavy WASM out of the initial bundle.
		const { pipeline, env } = await import("@huggingface/transformers");

		// Allow remote models from HF CDN. Allow local fallback to /models/.
		env.allowRemoteModels = true;
		env.allowLocalModels = false;

		// "tiny" model: ~40MB download, runs in 1-3s on a laptop. Multilingual.
		const transcriber = await pipeline("automatic-speech-recognition", "onnx-community/whisper-tiny", {
			dtype: "q8" as const,
			device: "wasm" as const,
		});

		return {
			transcribe: async (audio: Blob) => {
				// Transformers.js accepts a Blob directly.
				const output = (await transcriber(audio as unknown as Float32Array, {
					language: "english",
					task: "transcribe",
					chunk_length_s: 30,
					return_timestamps: false,
				})) as unknown as { text: string };
				return { text: (output.text || "").trim() };
			},
		};
	})();

	return enginePromise;
}

// ─── Native Web Speech API fallback ────────────────────────────────
type SpeechRecognitionLike = {
	start: () => void;
	stop: () => void;
	abort: () => void;
	onresult: ((e: { results: Array<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
	onerror: ((e: { error: string }) => void) | null;
	onend: (() => void) | null;
	lang: string;
	interimResults: boolean;
	continuous: boolean;
};

function getNativeRecognition(): SpeechRecognitionLike | null {
	if (typeof window === "undefined") return null;
	const w = window as unknown as {
		SpeechRecognition?: new () => SpeechRecognitionLike;
		webkitSpeechRecognition?: new () => SpeechRecognitionLike;
	};
	const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
	if (!Ctor) return null;
	const rec = new Ctor();
	rec.lang = "en-US";
	rec.interimResults = true;
	rec.continuous = false;
	return rec;
}

export interface UseFreeVoiceSTTOptions {
	preferred?: "whisper" | "native";
	language?: string; // for native fallback, e.g. "en-US", "hi-IN"
}

export interface UseFreeVoiceSTTReturn {
	isRecording: boolean;
	isProcessing: boolean;
	isLoadingModel: boolean;
	error: string | null;
	audioLevel: number;
	engine: "whisper" | "native" | null;
	startRecording: () => Promise<void>;
	stopRecording: () => Promise<string | null>;
	cancelRecording: () => void;
	supported: boolean;
}

export function useFreeVoiceSTT(opts: UseFreeVoiceSTTOptions = {}): UseFreeVoiceSTTReturn {
	const [isRecording, setIsRecording] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isLoadingModel, setIsLoadingModel] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [audioLevel, setAudioLevel] = useState(0);
	const [engine, setEngine] = useState<"whisper" | "native" | null>(null);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const animFrameRef = useRef<number | null>(null);
	const resolveRef = useRef<((text: string | null) => void) | null>(null);
	const nativeRecRef = useRef<SpeechRecognitionLike | null>(null);
	const nativeTextRef = useRef<string>("");
	const streamRef = useRef<MediaStream | null>(null);

	const supported = typeof window !== "undefined" && (!!navigator.mediaDevices?.getUserMedia || !!getNativeRecognition());

	const cleanup = useCallback(() => {
		if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
		if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
			try {
				mediaRecorderRef.current.stop();
			} catch {}
		}
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((t) => t.stop());
		}
		streamRef.current = null;
		mediaRecorderRef.current = null;
		analyserRef.current = null;
		setAudioLevel(0);
	}, []);

	const startRecording = useCallback(async () => {
		setError(null);
		nativeTextRef.current = "";

		// Try native Web Speech API first if preferred (faster, no model download)
		const preferNative = opts.preferred === "native";
		const nativeRec = preferNative ? getNativeRecognition() : null;

		if (nativeRec) {
			nativeRec.lang = opts.language || "en-US";
			nativeRec.onresult = (e) => {
				let finalText = "";
				for (const r of e.results) {
					if (r.isFinal) finalText += r[0].transcript;
				}
				nativeTextRef.current = finalText || nativeTextRef.current;
			};
			nativeRec.onerror = (e) => {
				setError(`Speech recognition error: ${e.error}`);
				setIsRecording(false);
			};
			nativeRec.onend = () => {
				setIsRecording(false);
				if (resolveRef.current) {
					resolveRef.current(nativeTextRef.current || null);
					resolveRef.current = null;
				}
			};
			nativeRecRef.current = nativeRec;
			setEngine("native");
			setIsRecording(true);
			try {
				nativeRec.start();
			} catch {
				setError("Could not start native speech recognition");
				setIsRecording(false);
			}
			return;
		}

		// Otherwise use Whisper in-browser
		if (!navigator.mediaDevices?.getUserMedia) {
			setError("Microphone not available in this browser");
			return;
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					sampleRate: 16000,
				},
			});
			streamRef.current = stream;

			const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
			const recorder = new MediaRecorder(stream, { mimeType });
			mediaRecorderRef.current = recorder;
			chunksRef.current = [];

			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunksRef.current.push(e.data);
			};

			recorder.onstop = () => {
				// stream tracks stopped in cleanup
			};

			recorder.start(250);
			setEngine("whisper");
			setIsRecording(true);

			// Audio level meter
			const audioCtx = new AudioContext();
			const source = audioCtx.createMediaStreamSource(stream);
			const analyser = audioCtx.createAnalyser();
			analyser.fftSize = 256;
			source.connect(analyser);
			analyserRef.current = analyser;

			const dataArray = new Uint8Array(analyser.frequencyBinCount);
			const checkLevel = () => {
				if (!analyserRef.current) return;
				analyserRef.current.getByteFrequencyData(dataArray);
				const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
				setAudioLevel(Math.min(avg / 128, 1));
				animFrameRef.current = requestAnimationFrame(checkLevel);
			};
			animFrameRef.current = requestAnimationFrame(checkLevel);
		} catch (err) {
			const message = err instanceof DOMException && err.name === "NotAllowedError" ? "Microphone access denied" : "Could not start recording";
			setError(message);
		}
	}, [opts.language, opts.preferred]);

	const stopRecording = useCallback(async (): Promise<string | null> => {
		// Native path
		if (nativeRecRef.current) {
			const nativeRec = nativeRecRef.current;
			return new Promise((resolve) => {
				resolveRef.current = resolve;
				try {
					nativeRec.stop();
				} catch {
					setIsRecording(false);
					resolve(nativeTextRef.current || null);
					resolveRef.current = null;
				}
			});
		}

		// Whisper path
		const recorder = mediaRecorderRef.current;
		if (!recorder || recorder.state === "inactive") {
			setIsRecording(false);
			cleanup();
			return null;
		}

		return new Promise((resolve) => {
			resolveRef.current = resolve;

			recorder.onstop = async () => {
				setIsRecording(false);
				const blob = new Blob(chunksRef.current, { type: "audio/webm" });
				chunksRef.current = [];
				cleanup();

				if (blob.size < 2000) {
					resolve(null);
					return;
				}

				setIsProcessing(true);
				try {
					setIsLoadingModel(true);
					const engine = await loadWhisperEngine();
					setIsLoadingModel(false);
					const result = await engine.transcribe(blob);
					resolve(result.text || null);
				} catch (err) {
					console.error("Whisper transcription failed:", err);
					setError("Could not transcribe audio. Please try again.");
					resolve(null);
				} finally {
					setIsProcessing(false);
				}
			};

			try {
				recorder.stop();
			} catch {
				setIsRecording(false);
				cleanup();
				resolve(null);
				resolveRef.current = null;
			}
		});
	}, [cleanup]);

	const cancelRecording = useCallback(() => {
		if (nativeRecRef.current) {
			try {
				nativeRecRef.current.abort();
			} catch {}
			nativeRecRef.current = null;
		}
		cleanup();
		chunksRef.current = [];
		nativeTextRef.current = "";
		setIsRecording(false);
		setError(null);
	}, [cleanup]);

	useEffect(() => {
		return () => {
			cleanup();
			if (nativeRecRef.current) {
				try {
					nativeRecRef.current.abort();
				} catch {}
			}
		};
	}, [cleanup]);

	return {
		isRecording,
		isProcessing,
		isLoadingModel,
		error,
		audioLevel,
		engine,
		startRecording,
		stopRecording,
		cancelRecording,
		supported,
	};
}
