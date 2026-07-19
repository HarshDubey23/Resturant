"use client";

import { Loader2, Mic, MicOff, Volume2 } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useVoiceRecorder } from "#utils/hooks/useVoiceRecorder";

interface VoiceButtonProps {
	onTranscript: (text: string) => void;
	disabled?: boolean;
	lang?: "hi" | "en" | "hi-en";
}

export const VoiceButton = memo(({ onTranscript, disabled, lang }: VoiceButtonProps) => {
	const { isRecording, isProcessing, error, audioLevel, startRecording, stopRecording, cancelRecording, supported } =
		useVoiceRecorder();
	const [showError, setShowError] = useState(false);

	useEffect(() => {
		if (error) {
			setShowError(true);
			const timer = setTimeout(() => setShowError(false), 3000);
			return () => clearTimeout(timer);
		}
	}, [error]);

	const handleClick = useCallback(async () => {
		if (isRecording) {
			const text = await stopRecording();
			if (text) onTranscript(text);
		} else {
			setShowError(false);
			await startRecording();
		}
	}, [isRecording, startRecording, stopRecording, onTranscript]);

	const level = Math.round(audioLevel * 100);
	const bgIntensity = Math.round(level * 0.6);

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
				onClick={handleClick}
				title={
					showError
						? error || ""
						: isRecording
							? "Tap to stop recording"
							: error
								? error
								: `Voice order${lang === "hi" ? " (हिंदी)" : ""}`
				}
				className="h-9 w-9 shrink-0 relative z-10"
			>
				{isProcessing ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : isRecording ? (
					<MicOff className="h-4 w-4 animate-pulse" />
				) : (
					<Mic className="h-4 w-4" />
				)}
			</Button>
			{isRecording && (
				<span className="ml-1.5 text-[10px] text-red-500 font-mono w-6 tabular-nums">
					{level}%
				</span>
			)}
			{showError && !isRecording && error && (
				<span className="ml-1.5 text-[10px] text-destructive max-w-24 truncate">
					{error}
				</span>
			)}
		</div>
	);
});

VoiceButton.displayName = "VoiceButton";
