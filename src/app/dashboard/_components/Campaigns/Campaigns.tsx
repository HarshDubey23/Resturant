"use client";

import { Loader2, Megaphone, Send } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

interface Campaign {
	_id: string;
	title: string;
	message: string;
	status: string;
	sentCount: number;
	totalCount: number;
	failedCount: number;
	createdAt: string;
	sentAt?: string;
}

export default function Campaigns() {
	const [campaigns, setCampaigns] = useState<Campaign[]>([]);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [title, setTitle] = useState("");
	const [message, setMessage] = useState("");

	useEffect(() => {
		const fetchCampaigns = async () => {
			try {
				const res = await fetch("/api/whatsapp/campaigns");
				if (res.ok) setCampaigns(await res.json());
			} catch {
				toast.error("Failed to load campaigns");
			} finally {
				setLoading(false);
			}
		};
		fetchCampaigns();
	}, []);
	const refresh = () => {
		setLoading(true);
		const fetchCampaigns = async () => {
			try {
				const res = await fetch("/api/whatsapp/campaigns");
				if (res.ok) setCampaigns(await res.json());
			} catch {
				toast.error("Failed to load campaigns");
			} finally {
				setLoading(false);
			}
		};
		fetchCampaigns();
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!title.trim() || !message.trim()) return;

		setSending(true);
		try {
			const res = await fetch("/api/whatsapp/campaigns", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title, message }),
			});
			const data = await res.json();
			if (res.ok) {
				toast.success("Campaign sent to opted-in customers");
				setTitle("");
				setMessage("");
				refresh();
			} else {
				toast.error(data?.message || "Failed");
			}
		} catch {
			toast.error("Failed to create campaign");
		} finally {
			setSending(false);
		}
	};

	return (
		<div className="space-y-6 max-w-2xl">
			<form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
				<h2 className="font-semibold flex items-center gap-2">
					<Megaphone className="h-4 w-4" />
					New Broadcast
				</h2>
				<input
					type="text"
					placeholder="Campaign title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="w-full rounded-md border bg-background px-3 py-2 text-sm"
					required
				/>
				<textarea
					placeholder="Your message to customers..."
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[100px]"
					required
				/>
				<button
					type="submit"
					disabled={sending || !title.trim() || !message.trim()}
					className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
					{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
					{sending ? "Sending..." : "Send to All Opted-In"}
				</button>
				<p className="text-xs text-muted-foreground">Only customers who opted in for WhatsApp updates will receive this.</p>
			</form>

			<div className="space-y-2">
				<h3 className="text-sm font-medium">Campaign History</h3>
				{loading ? (
					<div className="flex justify-center py-8">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
				) : campaigns.length === 0 ? (
					<p className="text-sm text-muted-foreground py-8 text-center">No campaigns yet</p>
				) : (
					<div className="space-y-2">
						{campaigns.map((c) => (
							<div key={c._id} className="rounded-lg border p-3 text-sm">
								<div className="flex items-center justify-between mb-1">
									<span className="font-medium">{c.title}</span>
									<span
										className={`text-xs px-2 py-0.5 rounded capitalize ${
											c.status === "sent"
												? "bg-green-100 text-green-700"
												: c.status === "sending"
													? "bg-blue-100 text-blue-700"
													: c.status === "failed"
														? "bg-red-100 text-red-700"
														: "bg-gray-100 text-gray-700"
										}`}>
										{c.status}
									</span>
								</div>
								<p className="text-xs text-muted-foreground line-clamp-2 mb-1">{c.message}</p>
								<div className="flex items-center gap-3 text-xs text-muted-foreground">
									<span>
										Sent: {c.sentCount}/{c.totalCount}
									</span>
									{c.failedCount > 0 && <span className="text-red-500">{c.failedCount} failed</span>}
									<span>{new Date(c.createdAt).toLocaleDateString()}</span>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
