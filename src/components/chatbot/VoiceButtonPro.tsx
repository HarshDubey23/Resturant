"use client";

import { Loader2, Mic, MicOff, Square, Volume2 } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { useFreeVoiceSTT } from "#utils/hooks/useFreeVoiceSTT";
import { useFreeVoiceTTS } from "#utils/hooks/useFreeVoiceTTS";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceButtonProProps {
	onTranscript: (text: string) => void;
	disabled?: boolean;
	/** When provided, shows a speaker icon to play this text aloud */
	speakText?: string;
	/** Language code for TTS, e.g. "en-US", "hi-IN" */
	lang?: string;
	variant?: "icon" | "pill";
}

/**
 * VoiceButtonPro — fully free voice button:
 *  - Mic: in-browser Whisper STT (no API key) with native Web Speech fallback
 *  - Speaker: browser SpeechSynthesis TTS (no API key, offline)
 */
export const VoiceButtonPro = memo(({ onTranscript, disabled, speakText, lang = "en-US", variant = "icon" }: VoiceButtonProProps) => {
	const { isRecording, isProcessing, isLoadingModel, error, audioLevel, engine, startRecording, stopRecording, supported } = useFreeVoiceSTT({
		preferred: "whisper",
		language: lang,
	});
	const { speaking, speak, cancel } = useFreeVoiceTTS();
	const [showError, setShowError] = useState(false);

	useEffect(() => {
		if (error) {
			setShowError(true);
			const timer = setTimeout(() => setShowError(false), 3500);
			return () => clearTimeout(timer);
		}
	}, [error]);

	const handleMicClick = useCallback(async () => {
		if (isRecording) {
			const text = await stopRecording();
			if (text) onTranscript(text);
		} else {
			setShowError(false);
			await startRecording();
		}
	}, [isRecording, startRecording, stopRecording, onTranscript]);

	const handleSpeakerClick = useCallback(() => {
		if (speaking) {
			cancel();
		} else if (speakText) {
			speak(speakText, { lang });
		}
	}, [speaking, speak, cancel, speakText, lang]);

	if (!supported && !speakText) return null;

	const level = Math.round(audioLevel * 100);
	const bgIntensity = Math.round(level * 0.6);

	if (variant === "pill") {
		return (
			<div className="relative inline-flex items-center gap-2">
				<button
					type="button"
					disabled={disabled || isProcessing}
					onClick={handleMicClick}
					className={cn(
						"inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 shadow-lg",
						isRecording
							? "bg-red-500 text-white shadow-red-500/30"
							: "bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02]",
						(disabled || isProcessing) && "opacity-50 cursor-not-allowed",
					)}>
					{isProcessing ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : isRecording ? (
						<MicOff className="h-4 w-4 animate-pulse" />
					) : (
						<Mic className="h-4 w-4" />
					)}
					<span>{isProcessing ? "Transcribing…" : isLoadingModel ? "Loading model…" : isRecording ? "Tap to stop" : "Voice order"}</span>
					{isRecording && <span className="text-[10px] font-mono opacity-80 tabular-nums">{level}%</span>}
				</button>

				{speakText && (
					<button
						type="button"
						onClick={handleSpeakerClick}
						className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-2 text-sm font-medium text-white backdrop-blur hover:bg-slate-900 transition-all">
						{speaking ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
						<span className="text-xs">{speaking ? "Stop" : "Listen"}</span>
					</button>
				)}

				{showError && error && <span className="ml-1.5 text-xs text-destructive max-w-40 truncate">{error}</span>}
			</div>
		);
	}

	return (
		<div className="relative inline-flex items-center">
			{isRecording && (
				<>
					<div className="absolute -inset-1 rounded-full bg-red-500/10 animate-ping pointer-events-none" />
					<div
						className="absolute -inset-0.5 rounded-full transition-all duration-75 pointer-events-none"
						style={{
							backgroundColor: `rgba(239, 68, 68, ${bgIntensity * 0.006})`,
							transform: `scale(${1 + audioLevel * 0.15})`,
						}}
					/>
				</>
			)}
			<Button
				size="icon"
				variant={isRecording ? "destructive" : "ghost"}
				disabled={disabled || isProcessing}
				onClick={handleMicClick}
				title={showError ? error || "" : isRecording ? "Tap to stop recording" : "Voice order (free, in-browser)"}
				className="h-9 w-9 shrink-0 relative z-10">
				{isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : isRecording ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
			</Button>

			{speakText && (
				<Button size="icon" variant="ghost" onClick={handleSpeakerClick} title={speaking ? "Stop audio" : "Listen to description"} className="h-9 w-9 shrink-0">
					{speaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
				</Button>
			)}

			{isRecording && <span className="ml-1.5 text-[10px] text-red-500 font-mono w-6 tabular-nums">{level}%</span>}
			{engine === "whisper" && isRecording && <span className="ml-1 text-[9px] text-amber-600 font-medium">Whisper</span>}
			{engine === "native" && isRecording && <span className="ml-1 text-[9px] text-blue-600 font-medium">Native</span>}
			{showError && !isRecording && error && <span className="ml-1.5 text-[10px] text-destructive max-w-24 truncate">{error}</span>}
		</div>
	);
});

VoiceButtonPro.displayName = "VoiceButtonPro";
