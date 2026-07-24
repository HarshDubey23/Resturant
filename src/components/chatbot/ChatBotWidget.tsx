"use client";

import { MessageCircle, Send, X, Sparkles, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
}

export default function ChatBot() {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([
		{
			role: "assistant",
			content: "Hi! I'm Jarvis, your OrderWorder AI assistant. I can help you with menu recommendations, restaurant features, pricing, and more. What would you like to know?",
			timestamp: new Date(),
		},
	]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const sessionId = useRef(`chat-${Date.now()}`);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);

	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isOpen]);

	const sendMessage = async () => {
		if (!input.trim() || isLoading) return;

		const userMessage: ChatMessage = {
			role: "user",
			content: input.trim(),
			timestamp: new Date(),
		};
		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsLoading(true);

		try {
			const res = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sessionId: sessionId.current,
					message: userMessage.content,
				}),
			});

			const data = await res.json();

			if (data.success) {
				setMessages((prev) => [
					...prev,
					{
						role: "assistant",
						content: data.response,
						timestamp: new Date(),
					},
				]);
			} else {
				setMessages((prev) => [
					...prev,
					{
						role: "assistant",
						content: "I'm having trouble right now. Please try again in a moment.",
						timestamp: new Date(),
					},
				]);
			}
		} catch {
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: "Network error. Please check your connection and try again.",
					timestamp: new Date(),
				},
			]);
		} finally {
			setIsLoading(false);
		}
	};

	const resetChat = async () => {
		try {
			await fetch(`/api/chat?sessionId=${sessionId.current}`, { method: "DELETE" });
		} catch {
			// ignore
		}
		sessionId.current = `chat-${Date.now()}`;
		setMessages([
			{
				role: "assistant",
				content: "Hi! I'm Jarvis, your OrderWorder AI assistant. What would you like to know?",
				timestamp: new Date(),
			},
		]);
	};

	return (
		<>
			{/* Floating Action Button */}
			<AnimatePresence>
				{!isOpen && (
					<motion.button
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0, opacity: 0 }}
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
						onClick={() => setIsOpen(true)}
						className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-700 transition-colors flex items-center justify-center group"
						aria-label="Open AI chat">
						<MessageCircle className="h-6 w-6" />
						<span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
					</motion.button>
				)}
			</AnimatePresence>

			{/* Chat Panel */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: 20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 20, scale: 0.95 }}
						transition={{ duration: 0.2 }}
						className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[520px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
						{/* Header */}
						<div className="h-1 bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-500" />
						<div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
							<div className="flex items-center gap-2">
								<div className="h-8 w-8 rounded-lg bg-violet-600/10 flex items-center justify-center">
									<Sparkles className="h-4 w-4 text-violet-600" />
								</div>
								<div>
									<p className="text-sm font-bold text-slate-900">Jarvis AI</p>
									<p className="text-xs text-slate-500">OrderWorder Assistant</p>
								</div>
							</div>
							<div className="flex items-center gap-1">
								<Button variant="ghost" size="icon" onClick={resetChat} aria-label="Reset chat" className="h-8 w-8">
									<RotateCcw className="h-3.5 w-3.5" />
								</Button>
								<Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close chat" className="h-8 w-8">
									<X className="h-4 w-4" />
								</Button>
							</div>
						</div>

						{/* Messages */}
						<div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[360px]" style={{ scrollbarWidth: "thin" }}>
							{messages.map((msg, i) => (
								<motion.div
									key={i}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.2 }}
									className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
									<div
										className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
											msg.role === "user"
												? "bg-violet-600 text-white rounded-br-sm"
												: "bg-slate-100 text-slate-900 rounded-bl-sm"
										}`}>
										{msg.content}
									</div>
								</motion.div>
							))}
							{isLoading && (
								<div className="flex justify-start">
									<div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3 py-2.5 text-sm text-slate-500">
										<span className="inline-flex gap-1">
											<span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span>
											<span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span>
											<span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span>
										</span>
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>

						{/* Input */}
						<div className="border-t border-slate-100 p-3 bg-white">
							<div className="flex gap-2">
								<Input
									ref={inputRef}
									value={input}
									onChange={(e) => setInput(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && sendMessage()}
									placeholder="Ask Jarvis anything..."
									disabled={isLoading}
									className="rounded-xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/20"
								/>
								<Button
									onClick={sendMessage}
									disabled={!input.trim() || isLoading}
									className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white shrink-0"
									aria-label="Send message">
									<Send className="h-4 w-4" />
								</Button>
							</div>
							<p className="text-xs text-slate-400 mt-1.5 text-center">
								Jarvis can help with menu, features, pricing & more
							</p>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
