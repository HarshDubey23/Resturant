/** @file StaffTips — per-waiter tip totals + payout dashboard.
 *    Today / week / month range toggle drives a fetch to `GET /api/tips`
 *    (3-E1's API). Top waiters by tips are visualised in a recharts bar
 *    chart; total/pending/paid counts animate up via motion's useMotionValue.
 *    Per-row "Mark as paid" calls POST /api/tips/mark-paid. If the tips API
 *    is not yet deployed, the component degrades to a friendly empty state
 *    instead of crashing the dashboard tab.
 * @phase 3
 * @audit-finding n/a
 */
"use client";

import { Banknote, CheckCircle2, Clock, HandCoins, TrendingUp, Users } from "lucide-react";
import { animate, motion, useMotionValue } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { useAdmin } from "#components/context/useContext";
import { currencySymbol, formatCurrency } from "#utils/helper/currency";
import { captureError } from "#utils/helper/sentryWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type TipRange = "today" | "week" | "month";

interface WaiterTipRow {
	waiterId: string;
	waiterName: string;
	totalTips: number;
	tipCount: number;
	paidOut: number;
	pending: number;
	lastTipAt?: string;
}

interface TipsResponse {
	range: TipRange;
	totalTips: number;
	paidOut: number;
	pending: number;
	waiters: WaiterTipRow[];
	message?: string;
}

const RANGE_OPTIONS: Array<{ value: TipRange; label: string }> = [
	{ value: "today", label: "Today" },
	{ value: "week", label: "This week" },
	{ value: "month", label: "This month" },
];

function CountUp({ value, currency }: { value: number; currency: string }) {
	const mv = useMotionValue(0);
	const [display, setDisplay] = useState(formatCurrency(0, currency));
	useEffect(() => {
		const controls = animate(mv, value, {
			duration: 0.7,
			ease: "easeOut",
			onUpdate: (v) => setDisplay(formatCurrency(v, currency)),
		});
		return controls.stop;
	}, [mv, value, currency]);
	return (
		<motion.span className="tabular-nums" suppressHydrationWarning>
			{display}
		</motion.span>
	);
}

function StatTile({ icon: Icon, label, value, sub, accent }: { icon: typeof Banknote; label: string; value: string; sub?: string; accent: string }) {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
					<Icon className={cn("h-3.5 w-3.5", accent)} />
					{label}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-xl font-bold text-foreground">{value}</p>
				{sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
			</CardContent>
		</Card>
	);
}

export default function StaffTips() {
	const { profile } = useAdmin();
	const currency = profile?.currency ?? "INR";

	const [range, setRange] = useState<TipRange>("today");
	const [data, setData] = useState<TipsResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [markingId, setMarkingId] = useState<string | null>(null);

	const fetchTips = useCallback(async (selected: TipRange) => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/tips?range=${selected}`, { cache: "no-store" });
			if (res.status === 404) {
				// 3-E1's tips API not yet deployed — surface a friendly hint
				// instead of crashing the dashboard tab.
				setData(null);
				setError("Tips API not configured. Once /api/tips is deployed, per-waiter tip totals will appear here.");
				return;
			}
			const json = (await res.json()) as TipsResponse;
			if (!res.ok) throw new Error(json?.message ?? "Failed to load tips");
			setData(json);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to load tips";
			setError(msg);
			captureError(err, { route: "StaffTips.fetchTips", range: selected });
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchTips(range);
	}, [range, fetchTips]);

	const onMarkPaid = async (waiterId: string, waiterName: string) => {
		setMarkingId(waiterId);
		try {
			const res = await fetch("/api/tips/mark-paid", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ waiterId, range }),
			});
			const json = (await res.json()) as { message?: string };
			if (!res.ok) throw new Error(json?.message ?? "Mark-as-paid failed");
			toast.success(`Marked ${waiterName}'s tips as paid`);
			await fetchTips(range);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Mark-as-paid failed";
			toast.error(msg);
			captureError(err, { route: "StaffTips.markPaid", waiterId });
		} finally {
			setMarkingId(null);
		}
	};

	const chartData = useMemo(() => {
		if (!data?.waiters?.length) return [];
		return [...data.waiters]
			.sort((a, b) => b.totalTips - a.totalTips)
			.slice(0, 8)
			.map((w) => ({
				name: w.waiterName.length > 12 ? `${w.waiterName.slice(0, 11)}…` : w.waiterName,
				fullName: w.waiterName,
				tips: Number(w.totalTips.toFixed(2)),
				pending: Number(w.pending.toFixed(2)),
			}));
	}, [data]);

	const totalTips = data?.totalTips ?? 0;
	const paidOut = data?.paidOut ?? 0;
	const pending = data?.pending ?? 0;
	const waiterCount = data?.waiters?.length ?? 0;

	return (
		<div className="space-y-4">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h2 className="text-lg font-bold tracking-tight text-foreground">Staff Tips</h2>
					<p className="text-xs text-muted-foreground mt-0.5">Per-waiter tip totals, payout status, and mark-as-paid.</p>
				</div>
				<div className="flex gap-1 bg-muted rounded-lg p-1" role="tablist" aria-label="Tip range">
					{RANGE_OPTIONS.map((opt) => (
						<button
							key={opt.value}
							type="button"
							role="tab"
							aria-selected={range === opt.value}
							onClick={() => setRange(opt.value)}
							className={cn(
								"px-3 py-1.5 text-xs font-medium rounded-md transition-colors min-h-[36px]",
								range === opt.value ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
							)}>
							{opt.label}
						</button>
					))}
				</div>
			</header>

			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<StatTile
					icon={HandCoins}
					label="Total tips"
					value={loading ? "—" : formatCurrency(totalTips, currency)}
					sub={`${waiterCount} waiters`}
					accent="text-violet-500"
				/>
				<StatTile icon={CheckCircle2} label="Paid out" value={loading ? "—" : formatCurrency(paidOut, currency)} accent="text-emerald-500" />
				<StatTile icon={Clock} label="Pending payout" value={loading ? "—" : formatCurrency(pending, currency)} accent="text-amber-500" />
				<StatTile
					icon={Users}
					label="Avg / waiter"
					value={loading ? "—" : formatCurrency(waiterCount > 0 ? totalTips / waiterCount : 0, currency)}
					accent="text-sky-500"
				/>
			</div>

			{loading ? (
				<StaffTipsSkeleton />
			) : error && !data ? (
				<Card className="border-amber-500/40 bg-amber-500/5">
					<CardContent className="flex flex-col items-center gap-3 p-6 text-center">
						<Banknote className="h-8 w-8 text-amber-600 dark:text-amber-400" />
						<p className="text-sm text-foreground/80 max-w-md">{error}</p>
					</CardContent>
				</Card>
			) : waiterCount === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
							<HandCoins className="h-8 w-8 text-muted-foreground" />
						</div>
						<p className="text-sm font-semibold text-foreground">No tips recorded for this period</p>
						<p className="text-xs text-muted-foreground max-w-sm">Tips customers add at checkout will appear here, grouped by waiter.</p>
					</CardContent>
				</Card>
			) : (
				<>
					{/* Top-waiters bar chart */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<TrendingUp className="h-4 w-4 text-violet-500" />
								Top waiters by tips
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width="100%" height={260}>
								<BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
									<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
									<XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval={0} />
									<YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${currencySymbol(currency)}${v}`} />
									<Tooltip
										cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
										contentStyle={{
											background: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "8px",
											fontSize: "12px",
										}}
										formatter={(value, name) => [formatCurrency(Number(value), currency), name === "tips" ? "Total tips" : "Pending"]}
										labelFormatter={(_v, payload) => {
											const item = payload?.[0]?.payload as { fullName?: string } | undefined;
											return item?.fullName ?? "";
										}}
									/>
									<Bar dataKey="tips" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} maxBarSize={48} />
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Per-waiter table */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Waiter payouts</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-border text-left text-xs text-muted-foreground">
											<th className="px-4 py-2 font-medium">Waiter</th>
											<th className="px-4 py-2 font-medium text-right">Tips</th>
											<th className="px-4 py-2 font-medium text-right">Count</th>
											<th className="px-4 py-2 font-medium text-right">Pending</th>
											<th className="px-4 py-2 font-medium">Status</th>
											<th className="px-4 py-2 font-medium text-right">Action</th>
										</tr>
									</thead>
									<tbody>
										{data?.waiters.map((w) => {
											const isPaidOut = w.pending <= 0 && w.totalTips > 0;
											return (
												<tr key={w.waiterId} className="border-b border-border/50 last:border-0">
													<td className="px-4 py-3 font-medium text-foreground">{w.waiterName}</td>
													<td className="px-4 py-3 text-right tabular-nums">
														<CountUp value={w.totalTips} currency={currency} />
													</td>
													<td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{w.tipCount}</td>
													<td className="px-4 py-3 text-right tabular-nums">
														{w.pending > 0 ? (
															<span className="text-amber-600 dark:text-amber-400 font-medium">{formatCurrency(w.pending, currency)}</span>
														) : (
															<span className="text-muted-foreground">—</span>
														)}
													</td>
													<td className="px-4 py-3">
														{isPaidOut ? (
															<Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
																<CheckCircle2 className="h-3 w-3" />
																Paid
															</Badge>
														) : (
															<Badge variant="secondary">Pending</Badge>
														)}
													</td>
													<td className="px-4 py-3 text-right">
														<Button
															size="sm"
															variant="outline"
															onClick={() => onMarkPaid(w.waiterId, w.waiterName)}
															loading={markingId === w.waiterId}
															disabled={isPaidOut || w.pending <= 0}
															className="min-h-[40px]">
															<Banknote className="h-3.5 w-3.5" />
															Mark paid
														</Button>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}

function StaffTipsSkeleton() {
	return (
		<div className="space-y-4" aria-hidden="true">
			<Card>
				<CardContent className="p-4">
					<Skeleton className="h-4 w-40 mb-3" />
					<Skeleton className="h-[260px] w-full rounded-lg" />
				</CardContent>
			</Card>
			<Card>
				<CardContent className="p-0">
					{[0, 1, 2, 3].map((i) => (
						<div key={`tsk-${i.toString()}`} className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0">
							<Skeleton className="h-4 w-32" />
							<div className="flex items-center gap-4">
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-4 w-12" />
								<Skeleton className="h-8 w-24 rounded-lg" />
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
