/** @file NegativeFeedbackInbox — dashboard inbox for rating ≤ 2 feedback.
 *    Lists negative feedback docs (rating 1 or 2) fetched from the existing
 *    /api/feedback admin endpoint, filtered client-side. Each row exposes:
 *    customer name + phone (if available), red-star rating, comment, order
 *    short id, timestamp, and a status badge (new / refunded). The
 *    "Generate Refund Code" action calls POST /api/refund/generate-code
 *    (3-E1's API) with { orderId, amount, reason } and, on success, marks
 *    the row as refunded and surfaces the returned code. Motion staggered
 *    entrance; illustrated empty state with `MessageCircleHeart`.
 * @phase 3
 * @audit-finding n/a
 */
"use client";

import { ExternalLink, Gift, MessageCircleHeart, RefreshCw, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "#utils/helper/currency";
import { captureError } from "#utils/helper/sentryWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FeedbackRow {
	_id: string;
	restaurantID: string;
	order: string | { _id: string };
	customer?: { fname?: string; lname?: string } | null;
	rating: number;
	review?: string;
	comment?: string;
	tags?: string[];
	customerPhone?: string;
	refunded: boolean;
	refundCode?: string;
	refundAmount?: number;
	createdAt: string;
}

interface FeedbackListResponse {
	feedbacks: FeedbackRow[];
	pagination?: { page: number; limit: number; total: number; totalPages: number };
	message?: string;
}

interface RefundCodeResponse {
	refundCode?: string;
	code?: string;
	amount?: number;
	message?: string;
}

function orderIdOf(row: FeedbackRow): string {
	return typeof row.order === "string" ? row.order : (row.order?._id ?? "");
}

function shortId(id: string): string {
	if (!id) return "—";
	return id.slice(-6).toUpperCase();
}

function customerName(row: FeedbackRow): string {
	const c = row.customer as { fname?: string; lname?: string } | null | undefined;
	if (!c) return "Guest";
	const full = `${c.fname ?? ""} ${c.lname ?? ""}`.trim();
	return full || "Guest";
}

function customerPhoneMasked(phone?: string): string | null {
	if (!phone) return null;
	const digits = phone.replace(/\D/g, "");
	if (digits.length < 4) return phone;
	return `••••${digits.slice(-4)}`;
}

function timeAgo(iso: string): string {
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return "";
	const diffMs = Date.now() - then;
	const mins = Math.round(diffMs / 60000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.round(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	const days = Math.round(hrs / 24);
	if (days < 7) return `${days}d ago`;
	return new Date(iso).toLocaleDateString();
}

export default function NegativeFeedbackInbox() {
	const [rows, setRows] = useState<FeedbackRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [generatingId, setGeneratingId] = useState<string | null>(null);
	const [refundAmount, setRefundAmount] = useState<Record<string, string>>({});

	const fetchList = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/feedback?page=1&limit=50", { cache: "no-store" });
			const data = (await res.json()) as FeedbackListResponse;
			if (!res.ok) throw new Error(data?.message ?? "Failed to load feedback");
			const negative = (data.feedbacks ?? []).filter((f) => f.rating <= 2);
			setRows(negative);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to load feedback";
			setError(msg);
			toast.error(msg);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchList();
	}, [fetchList]);

	const onGenerateRefund = async (row: FeedbackRow) => {
		const orderId = orderIdOf(row);
		if (!orderId) {
			toast.error("Order reference missing on this feedback");
			return;
		}
		const amountStr = refundAmount[row._id] ?? "";
		const amount = Number(amountStr || 0);
		if (!Number.isFinite(amount) || amount <= 0) {
			toast.error("Enter a refund amount (₹) greater than 0");
			return;
		}
		setGeneratingId(row._id);
		try {
			const res = await fetch("/api/refund/generate-code", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					orderId,
					amount,
					reason: `Negative feedback (${row.rating}★) — ${row.comment || row.review || "no comment"}`.slice(0, 200),
				}),
			});
			const data = (await res.json()) as RefundCodeResponse;
			if (!res.ok) throw new Error(data?.message ?? "Refund code generation failed");
			const code = data.refundCode ?? data.code ?? "";
			setRows((prev) =>
				prev.map((r) =>
					r._id === row._id
						? {
								...r,
								refunded: true,
								refundCode: code,
								refundAmount: data.amount ?? amount,
							}
						: r,
				),
			);
			toast.success(`Refund code generated: ${code}`);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Refund code generation failed";
			toast.error(msg);
			captureError(err, { route: "NegativeFeedbackInbox.generateRefund", orderId });
		} finally {
			setGeneratingId(null);
		}
	};

	const totalCount = rows.length;
	const refundedCount = useMemo(() => rows.filter((r) => r.refunded).length, [rows]);

	return (
		<div className="space-y-4">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h2 className="text-lg font-bold tracking-tight text-foreground">Negative Feedback Inbox</h2>
					<p className="text-xs text-muted-foreground mt-0.5">Reviews with rating ≤ 2 stars. Generate refund codes to make it right.</p>
				</div>
				<div className="flex items-center gap-2">
					<Badge variant={totalCount === 0 ? "secondary" : "destructive"}>{totalCount} open</Badge>
					{refundedCount > 0 && <Badge variant="outline">{refundedCount} refunded</Badge>}
					<Button variant="outline" size="sm" onClick={fetchList} disabled={loading} aria-label="Refresh feedback list">
						<RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
					</Button>
				</div>
			</header>

			{loading ? (
				<InboxSkeleton />
			) : error ? (
				<Card className="border-destructive/40 bg-destructive/5">
					<CardContent className="flex flex-col items-center gap-3 p-6 text-center">
						<p className="text-sm font-semibold text-destructive">{error}</p>
						<Button variant="outline" size="sm" onClick={fetchList}>
							Retry
						</Button>
					</CardContent>
				</Card>
			) : totalCount === 0 ? (
				<EmptyState />
			) : (
				<ul className="space-y-3" aria-label="Negative feedback items">
					<AnimatePresence initial={false}>
						{rows.map((row, idx) => {
							const id = row._id;
							const phone = customerPhoneMasked(row.customerPhone);
							const amount = refundAmount[id] ?? "";
							return (
								<motion.li
									key={id}
									layout
									initial={{ opacity: 0, y: 12 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -12 }}
									transition={{ duration: 0.25, delay: Math.min(idx * 0.05, 0.4) }}>
									<Card className={cn(row.refunded && "border-emerald-500/40 bg-emerald-500/[0.04]")}>
										<CardContent className="p-4 space-y-3">
											<div className="flex flex-wrap items-start gap-x-3 gap-y-2">
												<div className="min-w-0 flex-1">
													<div className="flex items-center gap-2 flex-wrap">
														<span className="text-sm font-semibold text-foreground">{customerName(row)}</span>
														{phone && <span className="text-xs text-muted-foreground tabular-nums">{phone}</span>}
													</div>
													<div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
														<span className="font-mono">#{shortId(orderIdOf(row))}</span>
														<span aria-hidden="true">·</span>
														<span>{timeAgo(row.createdAt)}</span>
													</div>
												</div>
												<div className="flex items-center gap-2 shrink-0">
													<div className="flex items-center gap-0.5" role="img" aria-label={`Rating: ${row.rating} of 5`}>
														{[1, 2, 3, 4, 5].map((v) => (
															<Star
																key={`rstar-${id}-${v.toString()}`}
																className={cn(
																	"h-3.5 w-3.5",
																	v <= row.rating ? "fill-rose-500 text-rose-500" : "text-muted-foreground/20",
																)}
															/>
														))}
													</div>
													{row.refunded ? (
														<Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
															Refunded
														</Badge>
													) : (
														<Badge variant="destructive">New</Badge>
													)}
												</div>
											</div>

											{(row.comment || row.review) && (
												<p className="text-sm text-foreground/90 leading-relaxed bg-muted/40 rounded-lg p-2.5 border border-border/50">
													{row.comment || row.review}
												</p>
											)}

											{row.tags && row.tags.length > 0 && (
												<div className="flex flex-wrap gap-1.5">
													{row.tags.map((t) => (
														<span
															key={`tag-${id}-${t}`}
															className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
															{t}
														</span>
													))}
												</div>
											)}

											{row.refunded && row.refundCode && (
												<div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 flex items-center gap-2">
													<Gift className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
													<div className="min-w-0 flex-1">
														<p className="text-[11px] text-muted-foreground">Refund code</p>
														<code className="text-sm font-mono font-semibold text-emerald-700 dark:text-emerald-300 break-all">
															{row.refundCode}
														</code>
													</div>
													{typeof row.refundAmount === "number" && row.refundAmount > 0 && (
														<span className="text-sm font-semibold text-foreground tabular-nums shrink-0">
															{formatCurrency(row.refundAmount, "INR")}
														</span>
													)}
												</div>
											)}

											{!row.refunded && (
												<div className="flex flex-wrap items-end gap-2 pt-1 border-t border-border/50">
													<div className="flex-1 min-w-[140px]">
														<label htmlFor={`refund-${id}`} className="block text-[11px] font-medium text-muted-foreground mb-1">
															Refund amount (₹)
														</label>
														<input
															id={`refund-${id}`}
															type="number"
															min={1}
															step="1"
															inputMode="numeric"
															value={amount}
															onChange={(e) => setRefundAmount((prev) => ({ ...prev, [id]: e.target.value }))}
															placeholder="e.g. 150"
															className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
														/>
													</div>
													<Button
														size="sm"
														onClick={() => onGenerateRefund(row)}
														loading={generatingId === id}
														disabled={!amount || Number(amount) <= 0}
														className="min-h-[44px]">
														<Gift className="h-4 w-4" />
														Generate refund code
													</Button>
													<Link href={`/dashboard?tab=orders`} className="inline-flex">
														<Button variant="outline" size="sm" className="min-h-[44px]">
															<ExternalLink className="h-4 w-4" />
															View order
														</Button>
													</Link>
												</div>
											)}

											{row.refunded && (
												<Link href={`/dashboard?tab=orders`} className="inline-flex">
													<Button variant="outline" size="sm" className="min-h-[44px]">
														<ExternalLink className="h-4 w-4" />
														View order
													</Button>
												</Link>
											)}
										</CardContent>
									</Card>
								</motion.li>
							);
						})}
					</AnimatePresence>
				</ul>
			)}
		</div>
	);
}

function EmptyState() {
	return (
		<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
			<Card>
				<CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 0.4, ease: "easeOut" }}
						className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 ring-4 ring-emerald-500/5">
						<MessageCircleHeart className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
					</motion.div>
					<div>
						<p className="text-base font-semibold text-foreground">No negative feedback. Great service!</p>
						<p className="text-sm text-muted-foreground mt-1 max-w-sm">
							When a customer rates their visit 2 stars or below, they'll show up here so you can make it right with a refund code.
						</p>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}

function InboxSkeleton() {
	return (
		<ul className="space-y-3" aria-hidden="true">
			{[0, 1, 2, 3].map((i) => (
				<li key={`ns-${i.toString()}`}>
					<Card>
						<CardContent className="p-4 space-y-3">
							<div className="flex items-center gap-3">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-4 w-20" />
							</div>
							<Skeleton className="h-3 w-24" />
							<Skeleton className="h-16 w-full rounded-lg" />
							<div className="flex gap-2">
								<Skeleton className="h-9 w-32 rounded-lg" />
								<Skeleton className="h-9 w-32 rounded-lg" />
							</div>
						</CardContent>
					</Card>
				</li>
			))}
		</ul>
	);
}
