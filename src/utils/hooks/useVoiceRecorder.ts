import { useCallback, useRef, useState } from "react";

const MAX_RECORDING_MS = 15000;
const MIN_AUDIO_SIZE = 2000;
const SILENCE_TIMEOUT_MS = 3000;

interface UseVoiceRecorderReturn {
	isRecording: boolean;
	isProcessing: boolean;
	error: string | null;
	audioLevel: number;
	startRecording: () => Promise<void>;
	stopRecording: () => Promise<string | null>;
	cancelRecording: () => void;
	supported: boolean;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
	const [isRecording, setIsRecording] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [audioLevel, setAudioLevel] = useState(0);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const animFrameRef = useRef<number | null>(null);
	const resolveRef = useRef<((text: string | null) => void) | null>(null);

	const supported = typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

	const cleanup = useCallback(() => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
		if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
		if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
			mediaRecorderRef.current.stop();
		}
		mediaRecorderRef.current = null;
		analyserRef.current = null;
		setAudioLevel(0);
	}, []);

	const startRecording = useCallback(async () => {
		setError(null);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					sampleRate: 16000,
				},
			});

			const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
				? "audio/webm;codecs=opus"
				: "audio/webm";

			const recorder = new MediaRecorder(stream, { mimeType });
			mediaRecorderRef.current = recorder;
			chunksRef.current = [];

			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunksRef.current.push(e.data);
			};

			recorder.onstop = () => {
				stream.getTracks().forEach((t) => t.stop());
			};

			recorder.start(250);
			setIsRecording(true);

			timeoutRef.current = setTimeout(() => {
				if (resolveRef.current) {
					resolveRef.current(null);
					resolveRef.current = null;
				}
				if (recorder.state !== "inactive") recorder.stop();
				setIsRecording(false);
				setError("Recording timed out");
				cleanup();
			}, MAX_RECORDING_MS);

			const audioCtx = new AudioContext();
			const source = audioCtx.createMediaStreamSource(stream);
			const analyser = audioCtx.createAnalyser();
			analyser.fftSize = 256;
			source.connect(analyser);
			analyserRef.current = analyser;

			const dataArray = new Uint8Array(analyser.frequencyBinCount);
			let silenceStart: number | null = null;

			const checkLevel = () => {
				if (!analyserRef.current) return;
				analyserRef.current.getByteFrequencyData(dataArray);
				const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
				setAudioLevel(Math.min(avg / 128, 1));

				if (avg < 10) {
					if (!silenceStart) silenceStart = Date.now();
					else if (Date.now() - silenceStart > SILENCE_TIMEOUT_MS) {
						if (resolveRef.current) {
							resolveRef.current(null);
							resolveRef.current = null;
						}
						if (recorder.state !== "inactive") recorder.stop();
						setIsRecording(false);
						setError("No speech detected");
						cleanup();
						return;
					}
				} else {
					silenceStart = null;
				}

				animFrameRef.current = requestAnimationFrame(checkLevel);
			};
			animFrameRef.current = requestAnimationFrame(checkLevel);
		} catch (err) {
			const message = err instanceof DOMException && err.name === "NotAllowedError"
				? "Microphone access denied"
				: "Could not start recording";
			setError(message);
		}
	}, [cleanup]);

	const stopRecording = useCallback(async (): Promise<string | null> => {
		return new Promise((resolve) => {
			const recorder = mediaRecorderRef.current;
			if (!recorder || recorder.state === "inactive") {
				setIsRecording(false);
				cleanup();
				resolve(null);
				return;
			}

			resolveRef.current = resolve;

			const originalOnStop = recorder.onstop;
			recorder.onstop = async () => {
				setIsRecording(false);
				cleanup();
				const blob = new Blob(chunksRef.current, { type: "audio/webm" });
				chunksRef.current = [];

				if (blob.size < MIN_AUDIO_SIZE) {
					resolve(null);
					return;
				}

				setIsProcessing(true);
				try {
					const formData = new FormData();
					formData.append("audio", blob, "recording.webm");

					const res = await fetch("/api/voice/stt", {
						method: "POST",
						body: formData,
					});

					const data = await res.json();
					if (data.error) {
						setError(data.error);
						resolve(null);
						return;
					}
					resolve(data.text || null);
				} catch {
					setError("Speech recognition failed");
					resolve(null);
				} finally {
					setIsProcessing(false);
				}
			};

			recorder.stop();
		});
	}, [cleanup]);

	const cancelRecording = useCallback(() => {
		const recorder = mediaRecorderRef.current;
		if (recorder && recorder.state !== "inactive") {
			recorder.stream?.getTracks().forEach((t) => t.stop());
			recorder.stop();
		}
		chunksRef.current = [];
		setIsRecording(false);
		setError(null);
		cleanup();
	}, [cleanup]);

	return { isRecording, isProcessing, error, audioLevel, startRecording, stopRecording, cancelRecording, supported };
}
