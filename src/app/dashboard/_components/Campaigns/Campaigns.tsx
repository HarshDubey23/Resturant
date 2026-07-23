"use client";

import { Calendar, Clock, Loader2, Megaphone, RefreshCw, Send, Trash2 } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

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
        scheduledAt?: string;
}

const TEMPLATES = [
        { label: "Custom message", value: "" },
        {
                label: "🎉 Weekend Special Offer",
                value: "Hi {name}! 🎉 This weekend, enjoy {discount}% off on all orders! Use code WEEKEND at checkout. Valid until Sunday. — Team",
        },
        {
                label: "🍕 New Menu Alert",
                value: "Hi {name}! We've added exciting new items to our menu! 🍕🥗 Come try them out at Table {table}. View our menu and order now! — Team",
        },
        {
                label: "🎂 Birthday Greeting",
                value: "Happy Birthday {name}! 🎂🎉 Celebrate with us and enjoy a complimentary dessert on us! Show this message at the counter. — Team",
        },
        {
                label: "💝 We Miss You",
                value: "Hi {name}! It's been a while since you last visited. 💝 Come back and enjoy {discount}% off your next meal! Use code COMEBACK. — Team",
        },
        {
                label: "⭐ Feedback Request",
                value: "Hi {name}! We hope you enjoyed your recent visit. ⭐ We'd love your feedback! Reply or leave a review. Your opinion matters! — Team",
        },
];

const STATUS_STYLES: Record<string, string> = {
        sent: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        sending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        draft: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
};

export default function Campaigns() {
        const [campaigns, setCampaigns] = useState<Campaign[]>([]);
        const [loading, setLoading] = useState(true);
        const [sending, setSending] = useState(false);
        const [title, setTitle] = useState("");
        const [message, setMessage] = useState("");
        const [selectedTemplate, setSelectedTemplate] = useState("");
        const [scheduleMode, setScheduleMode] = useState(false);
        const [scheduledAt, setScheduledAt] = useState("");
        const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
        const [page, setPage] = useState(1);
        const [totalPages, setTotalPages] = useState(1);

        const fetchCampaigns = useCallback(async () => {
                setLoading(true);
                try {
                        const res = await fetch(`/api/whatsapp/campaigns?page=${page}&limit=20`);
                        if (res.ok) {
                                const data = await res.json();
                                setCampaigns(data.campaigns || []);
                                setTotalPages(data.pagination?.totalPages || 1);
                        }
                } catch {
                        toast.error("Failed to load campaigns");
                } finally {
                        setLoading(false);
                }
        }, [page]);

        useEffect(() => {
                fetchCampaigns();
        }, [fetchCampaigns]);

        useEffect(() => {
                if (selectedTemplate) {
                        setMessage(selectedTemplate);
                }
        }, [selectedTemplate]);

        const handleSubmit = async (e: FormEvent) => {
                e.preventDefault();
                if (!title.trim() || !message.trim()) return;

                setSending(true);
                try {
                        const body: Record<string, string> = { title, message };
                        if (scheduleMode && scheduledAt) body.scheduledAt = new Date(scheduledAt).toISOString();

                        const res = await fetch("/api/whatsapp/campaigns", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(body),
                        });
                        const data = await res.json();
                        if (res.ok) {
                                toast.success(scheduleMode ? "Campaign scheduled!" : "Campaign sent to opted-in customers");
                                setTitle("");
                                setMessage("");
                                setSelectedTemplate("");
                                setScheduleMode(false);
                                setScheduledAt("");
                                fetchCampaigns();
                        } else {
                                toast.error(data?.message || "Failed");
                        }
                } catch {
                        toast.error("Failed to create campaign");
                } finally {
                        setSending(false);
                }
        };

        const handleRetry = async (campaignId: string) => {
                try {
                        const res = await fetch(`/api/whatsapp/campaigns/${campaignId}/retry`, { method: "POST" });
                        if (res.ok) {
                                toast.success("Retrying campaign...");
                                fetchCampaigns();
                        } else {
                                toast.error("Failed to retry");
                        }
                } catch {
                        toast.error("Failed to retry");
                }
        };

        const handleDelete = async (campaignId: string) => {
                try {
                        const res = await fetch(`/api/whatsapp/campaigns/${campaignId}`, { method: "DELETE" });
                        if (res.ok) {
                                toast.success("Campaign deleted");
                                setDetailCampaign(null);
                                fetchCampaigns();
                        } else {
                                toast.error("Failed to delete");
                        }
                } catch {
                        toast.error("Failed to delete");
                }
        };

        const openDetail = async (campaignId: string) => {
                try {
                        const res = await fetch(`/api/whatsapp/campaigns/${campaignId}`);
                        if (res.ok) setDetailCampaign(await res.json());
                } catch {
                        toast.error("Failed to load campaign");
                }
        };

        return (
                <div className="space-y-6">
                        <Card className="p-4 sm:p-6 space-y-4">
                                <h2 className="font-semibold flex items-center gap-2 text-lg">
                                        <Megaphone className="h-5 w-5" />
                                        New Broadcast
                                </h2>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                                <label htmlFor="campaign-template" className="block text-sm font-medium text-muted-foreground mb-1">
                                                        Template
                                                </label>
                                                <select
                                                        id="campaign-template"
                                                        value={selectedTemplate}
                                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                                                        {TEMPLATES.map((t) => (
                                                                <option key={t.value} value={t.value}>
                                                                        {t.label}
                                                                </option>
                                                        ))}
                                                </select>
                                        </div>
                                        <div>
                                                <label htmlFor="campaign-title" className="block text-sm font-medium text-muted-foreground mb-1">
                                                        Campaign Title
                                                </label>
                                                <Input id="campaign-title" type="text" placeholder="e.g. Weekend Offer June" value={title} onChange={(e) => setTitle(e.target.value)} required />
                                        </div>
                                        <div>
                                                <label htmlFor="campaign-message" className="block text-sm font-medium text-muted-foreground mb-1">
                                                        Message
                                                </label>
                                                <textarea
                                                        id="campaign-message"
                                                        placeholder="Your message to customers... Use {name}, {table}, {discount} as placeholders."
                                                        value={message}
                                                        onChange={(e) => setMessage(e.target.value)}
                                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[120px]"
                                                        required
                                                />
                                        </div>
                                        <div className="flex items-center gap-2">
                                                <input
                                                        type="checkbox"
                                                        id="scheduleToggle"
                                                        checked={scheduleMode}
                                                        onChange={(e) => setScheduleMode(e.target.checked)}
                                                        className="rounded border-muted-foreground/30"
                                                />
                                                <label htmlFor="scheduleToggle" className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        Schedule for later
                                                </label>
                                        </div>
                                        {scheduleMode && (
                                                <div>
                                                        <label htmlFor="campaign-scheduled-at" className="block text-sm font-medium text-muted-foreground mb-1">
                                                                Send at
                                                        </label>
                                                        <Input
                                                                id="campaign-scheduled-at"
                                                                type="datetime-local"
                                                                value={scheduledAt}
                                                                onChange={(e) => setScheduledAt(e.target.value)}
                                                                required
                                                                className="max-w-xs"
                                                        />
                                                </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                                <Button type="submit" disabled={sending || !title.trim() || !message.trim() || (scheduleMode && !scheduledAt)}>
                                                        {sending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
                                                        {sending ? "Processing..." : scheduleMode ? "Schedule Campaign" : "Send to All Opted-In"}
                                                </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Only customers who opted in for WhatsApp updates will receive this.</p>
                                </form>
                        </Card>

                        <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium">Campaign History</h3>
                                        <Button variant="ghost" size="sm" onClick={fetchCampaigns} className="h-8">
                                                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                                Refresh
                                        </Button>
                                </div>

                                {loading ? (
                                        <div className="space-y-2">
                                                {[...Array(4)].map((_, i) => (
                                                        <Skeleton key={i} className="h-20 w-full rounded-lg" />
                                                ))}
                                        </div>
                                ) : campaigns.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                                <Megaphone className="h-10 w-10 mb-3 opacity-50" />
                                                <p className="text-sm font-medium">No campaigns yet</p>
                                                <p className="text-xs">Create your first broadcast above</p>
                                        </div>
                                ) : (
                                        <div className="space-y-2">
                                                {campaigns.map((c) => (
                                                        <div
                                                                key={c._id}
                                                                className="rounded-lg border p-3.5 text-sm hover:bg-muted/30 transition-colors cursor-pointer"
                                                                onClick={() => openDetail(c._id)}>
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                        <span className="font-medium truncate">{c.title}</span>
                                                                        <Badge className={`text-[10px] px-1.5 py-0 h-auto capitalize ${STATUS_STYLES[c.status] || ""}`}>{c.status}</Badge>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{c.message}</p>
                                                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                                                        <span>
                                                                                Sent: <strong>{c.sentCount}</strong>/{c.totalCount}
                                                                        </span>
                                                                        {c.failedCount > 0 && <span className="text-red-500">{c.failedCount} failed</span>}
                                                                        {c.scheduledAt && (
                                                                                <span className="flex items-center gap-1">
                                                                                        <Calendar className="h-3 w-3" />
                                                                                        {new Date(c.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                                                </span>
                                                                        )}
                                                                        <span className="ml-auto">{new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                                                                </div>
                                                        </div>
                                                ))}
                                        </div>
                                )}

                                {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 pt-2">
                                                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                                        ← Previous
                                                </Button>
                                                <span className="text-xs text-muted-foreground">
                                                        Page {page} of {totalPages}
                                                </span>
                                                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                                                        Next →
                                                </Button>
                                        </div>
                                )}
                        </div>

                        <Dialog
                                open={!!detailCampaign}
                                onOpenChange={(open) => {
                                        if (!open) setDetailCampaign(null);
                                }}>
                                <DialogContent className="sm:max-w-lg">
                                        <DialogHeader>
                                                <DialogTitle>{detailCampaign?.title}</DialogTitle>
							<DialogDescription>Campaign details, delivery stats, and message preview.</DialogDescription>
						</DialogHeader>
                                        {detailCampaign && (
                                                <div className="space-y-4">
                                                        <div className="flex items-center gap-2">
                                                                <Badge className={`capitalize ${STATUS_STYLES[detailCampaign.status] || ""}`}>{detailCampaign.status}</Badge>
                                                                {detailCampaign.scheduledAt && (
                                                                        <Badge variant="outline" className="text-[10px]">
                                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                                {new Date(detailCampaign.scheduledAt).toLocaleString("en-IN")}
                                                                        </Badge>
                                                                )}
                                                        </div>
                                                        <div className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap">{detailCampaign.message}</div>
                                                        <div className="grid grid-cols-3 gap-3 text-center">
                                                                <div className="rounded-lg bg-muted/30 p-2">
                                                                        <p className="text-lg font-bold">{detailCampaign.totalCount || 0}</p>
                                                                        <p className="text-[10px] text-muted-foreground">Total</p>
                                                                </div>
                                                                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-2">
                                                                        <p className="text-lg font-bold text-green-700 dark:text-green-400">{detailCampaign.sentCount || 0}</p>
                                                                        <p className="text-[10px] text-muted-foreground">Sent</p>
                                                                </div>
                                                                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-2">
                                                                        <p className="text-lg font-bold text-red-700 dark:text-red-400">{detailCampaign.failedCount || 0}</p>
                                                                        <p className="text-[10px] text-muted-foreground">Failed</p>
                                                                </div>
                                                        </div>
                                                        {detailCampaign.sentAt && <p className="text-xs text-muted-foreground">Sent at: {new Date(detailCampaign.sentAt).toLocaleString("en-IN")}</p>}
                                                        <div className="flex gap-2 pt-2">
                                                                {detailCampaign.status === "failed" && detailCampaign.totalCount > 0 && (
                                                                        <Button
                                                                                variant="default"
                                                                                size="sm"
                                                                                className="flex-1"
                                                                                onClick={() => {
                                                                                        handleRetry(detailCampaign._id);
                                                                                        setDetailCampaign(null);
                                                                                }}>
                                                                                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                                                                Retry Failed
                                                                        </Button>
                                                                )}
                                                                <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(detailCampaign._id)}>
                                                                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                                        Delete
                                                                </Button>
                                                        </div>
                                                </div>
                                        )}
                                </DialogContent>
                        </Dialog>
                </div>
        );
}
