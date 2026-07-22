"use client";

import DOMPurify from "dompurify";
import { Bot, Volume2 } from "lucide-react";
import { memo, type RefObject } from "react";
import { useTTS } from "#utils/hooks/useTTS";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "../../types/chat";
import { MenuCard } from "./MenuCard";

interface MessageListProps {
	messages: ChatMessage[];
	isLoading: boolean;
	bottomRef: RefObject<HTMLDivElement | null>;
	onResizeStart: (e: React.MouseEvent) => void;
}

const MessageContent = ({ content }: { content: string }) => {
	const { speak } = useTTS();
	return (
		<div className="flex items-start gap-2">
			<div className="text-sm leading-relaxed flex-1" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					speak(content.replace(/<[^>]*>/g, ""));
				}}
				className="shrink-0 mt-0.5 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
				title="Read aloud">
				<Volume2 className="h-3.5 w-3.5" />
			</button>
		</div>
	);
};

export const MessageList = memo(({ messages, isLoading, bottomRef, onResizeStart }: MessageListProps) => {
	return (
		<div className="flex-1 overflow-hidden relative">
			<div className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-primary/20 transition-colors" onMouseDown={onResizeStart} />
			<div className="h-full overflow-y-auto p-4 space-y-4">
				{messages.map((message) => (
					<div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
						{message.role === "user" ? (
							<div className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground max-w-[80%]">{message.content}</div>
						) : (
							<div className="max-w-[85%] space-y-2">
								<div className="flex items-center gap-2">
									<div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
										<Bot className="h-4 w-4 text-primary" />
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xs font-medium">Jarvis</span>
										<span className="text-[10px] text-muted-foreground">
											{new Intl.DateTimeFormat("default", {
												hour: "numeric",
												minute: "numeric",
												hour12: true,
											}).format(message.createdAt)}
										</span>
									</div>
								</div>
								<div className="space-y-2">
									{message.content && <MessageContent content={message.content} />}
									{message.toolResults && message.toolResults.length > 0 && (
										<div className="space-y-2">
											{message.toolResults.map((items, idx) => (
												<div key={idx} className="space-y-1">
													{items.map((item) => (
														<MenuCard key={item._id} item={item} />
													))}
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				))}

				{isLoading && (
					<div className="flex justify-start">
						<div className="max-w-[85%] space-y-2">
							<div className="flex items-center gap-2">
								<div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
									<Bot className="h-4 w-4 text-primary" />
								</div>
								<span className="text-xs font-medium">Jarvis</span>
							</div>
							<div className="flex items-center gap-1 px-3 py-2">
								<span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
								<span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
								<span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
							</div>
						</div>
					</div>
				)}
				<div ref={bottomRef} />
			</div>
		</div>
	);
});

MessageList.displayName = "MessageList";
