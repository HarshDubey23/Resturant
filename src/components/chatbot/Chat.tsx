"use client";

import { Bot, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useChat } from "../../utils/hooks/useChat";
import { useResize } from "../../utils/hooks/useResize";
import { useOrder, useRestaurant } from "../context/useContext";
import { ChatFab } from "./ChatFab";
import { MessageList } from "./MessageList";
import { VoiceButton } from "./VoiceButton";
import { Welcome } from "./Welcome";

export const ChatInterface = () => {
	const session = useSession();
	const { restaurant, loading } = useRestaurant();
	const { setLoginOpen } = useOrder();
	const isAuthenticated = session.status === "authenticated";

	const { isOpen, setIsOpen, messages, isLoading, sendMessage, toggleOpen, resetChat, messagesEndRef, chatRef } = useChat({
		restaurantId: restaurant?.username ?? "",
		isAuthenticated,
	});

	const { dimensions, handleResizeStart } = useResize({
		initialWidth: 500,
		initialHeight: 700,
		minWidth: 350,
		minHeight: 450,
		maxWidth: 640,
		maxHeight: 950,
	});

	const [input, setInput] = useState("");

	const handleLoginRedirect = () => {
		setIsOpen(false);
		setLoginOpen(true);
	};

	return (
		<>
			{!loading && <ChatFab isOpen={isOpen} toggleOpen={toggleOpen} resetChat={resetChat} isAuthenticated={isAuthenticated} />}
			<div
				ref={chatRef}
				className={cn(
					"fixed bottom-24 right-6 z-50 flex flex-col rounded-xl border bg-card shadow-xl transition-all duration-300",
					isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
					isAuthenticated ? "" : "w-auto h-auto",
				)}
				style={isAuthenticated ? { width: `${dimensions.width}px`, height: `${dimensions.height}px`, maxWidth: "calc(100vw - 32px)" } : undefined}>
				{isAuthenticated ? (
					<>
						<div className="flex items-center gap-3 border-b px-4 py-3 shrink-0">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
								<Bot className="h-5 w-5" />
							</div>
							<span className="text-sm font-semibold">Jarvis</span>
						</div>
						<MessageList messages={messages} isLoading={isLoading} bottomRef={messagesEndRef} onResizeStart={handleResizeStart} />
						<div className="border-t p-3 shrink-0">
							<div className="flex items-center gap-2">
								<VoiceButton
									onTranscript={(text) => {
										setInput(text);
										if (text.trim()) {
											sendMessage(text);
											setInput("");
										}
									}}
									disabled={isLoading}
								/>
								<Input
									value={input}
									placeholder="Ask me anything or use the mic"
									className="flex-1"
									onChange={(e) => setInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter" && input.trim() && !isLoading) {
											sendMessage(input);
											setInput("");
										}
									}}
								/>
								<Button
									size="icon"
									disabled={!input.trim() || isLoading}
									onClick={() => {
										if (input.trim() && !isLoading) {
											sendMessage(input);
											setInput("");
										}
									}}>
									<Send className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</>
				) : (
					<Welcome onLogin={handleLoginRedirect} />
				)}
			</div>
		</>
	);
};
