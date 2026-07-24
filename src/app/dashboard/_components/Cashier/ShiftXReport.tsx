"use client";

/**
 * @file ShiftXReport — mid-shift snapshot (does NOT close the shift).
 * @phase 2
 * @audit-finding n/a
 *
 * Pulls /api/cashier/shift/x-report on open, renders opening cash, sales by
 * payment mode (cash / upi / card), voids, discounts, refunds, KOT count,
 * and tips. A small recharts donut visualises the payment-mode breakdown.
 * The report can be printed via the browser (window.print) or downloaded as
 * a JSON snapshot.
 */

import { Download, Loader2, Printer, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import { formatCurrency } from "#utils/helper/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface XMetrics {
	cashSales: number;
	upiSales: number;
	cardSales: number;
	totalSales: number;
	voids: { count: number; amount: number };
	discounts: { count: number; amount: number };
	refunds: { count: number; amount: number };
	kotCount: number;
	tips: number;
	expectedCash: number;
}

interface XReportData {
	status: number;
	shift: {
		_id?: string;
		openingCash: number;
		openedAt: string;
		cashierName?: string;
		tolerance?: number;
	} | null;
	metrics: XMetrics;
}

export interface ShiftXReportProps {
	open: boolean;
	onClose: () => void;
}

const PIE_COLORS = ["#7c3aed", "#10b981", "#f59e0b"];

export default function ShiftXReport({ open, onClose }: ShiftXReportProps) {
	const [data, setData] = useState<XReportData | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!open) return;
		setLoading(true);
		fetch("/api/cashier/shift/x-report", { cache: "no-store" })
			.then((r) => r.json())
			.then((d: XReportData) => setData(d))
			.catch(() => toast.error("Failed to load X report"))
			.finally(() => setLoading(false));
	}, [open]);

	const pieData = data
		? [
				{ name: "Cash", value: data.metrics.cashSales },
				{ name: "UPI", value: data.metrics.upiSales },
				{ name: "Card", value: data.metrics.cardSales },
			].filter((d) => d.value > 0)
		: [];

	const handlePrint = () => {
		window.print();
	};

	const handleDownload = () => {
		if (!data) return;
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `x-report-${new Date().toISOString().slice(0, 19)}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	return (
		<Dialog open={open} onOpenChange={(next) => !next && onClose()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<div className="flex items-start justify-between">
						<div>
							<DialogTitle className="flex items-center gap-2">
								X Report
								<Badge variant="secondary" className="text-[10px]">
									Live snapshot
								</Badge>
							</DialogTitle>
							<DialogDescription>Mid-shift summary — does not close the shift.</DialogDescription>
						</div>
						<Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
							<X className="h-4 w-4" />
						</Button>
					</div>
				</DialogHeader>

				{loading || !data ? (
					<div className="space-y-3">
						<Skeleton className="h-32 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				) : (
					<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
						{!data.shift ? (
							<div className="rounded-xl border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
								No open shift. Open a shift to view the X report.
							</div>
						) : (
							<>
								<div className="grid grid-cols-2 gap-3">
									<Stat label="Opening cash" value={formatCurrency(data.shift.openingCash)} />
									<Stat label="Expected cash" value={formatCurrency(data.metrics.expectedCash)} />
								</div>

								{pieData.length > 0 && (
									<div className="rounded-xl border bg-muted/20 p-3">
										<p className="mb-2 text-xs font-medium text-muted-foreground">Sales by payment mode</p>
										<div className="flex items-center gap-4">
											<ResponsiveContainer width={120} height={120}>
												<PieChart>
													<Pie
														data={pieData}
														dataKey="value"
														nameKey="name"
														cx="50%"
														cy="50%"
														innerRadius={28}
														outerRadius={48}
														paddingAngle={2}>
														{pieData.map((_, i) => (
															<Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
														))}
													</Pie>
													<Tooltip formatter={(v) => formatCurrency(Number(v))} />
												</PieChart>
											</ResponsiveContainer>
											<div className="flex-1 space-y-1 text-sm">
												{pieData.map((d, i) => (
													<div key={d.name} className="flex items-center justify-between">
														<span className="flex items-center gap-2">
															<span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
															{d.name}
														</span>
														<span className="tabular-nums">{formatCurrency(d.value)}</span>
													</div>
												))}
												<Separator className="my-1" />
												<div className="flex items-center justify-between font-semibold">
													<span>Total</span>
													<span className="tabular-nums">{formatCurrency(data.metrics.totalSales)}</span>
												</div>
											</div>
										</div>
									</div>
								)}

								<div className="grid grid-cols-2 gap-3">
									<Stat label="KOTs" value={String(data.metrics.kotCount)} />
									<Stat label="Tips" value={formatCurrency(data.metrics.tips)} />
									<Stat label="Voids" value={`${data.metrics.voids.count} (${formatCurrency(data.metrics.voids.amount)})`} />
									<Stat label="Discounts" value={`${data.metrics.discounts.count} (${formatCurrency(data.metrics.discounts.amount)})`} />
									<Stat label="Refunds" value={`${data.metrics.refunds.count} (${formatCurrency(data.metrics.refunds.amount)})`} />
								</div>

								<div className="flex items-center justify-end gap-2 pt-2">
									<Button variant="outline" size="sm" onClick={handleDownload}>
										<Download className="h-3.5 w-3.5" />
										JSON
									</Button>
									<Button size="sm" onClick={handlePrint}>
										<Printer className="h-3.5 w-3.5" />
										Print
									</Button>
								</div>
							</>
						)}
					</motion.div>
				)}
			</DialogContent>
		</Dialog>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl border bg-card p-3">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
		</div>
	);
}

// Re-exported so callers can show a loading state if needed.
export function ShiftXReportLoading() {
	return (
		<div className="flex items-center gap-2 text-sm text-muted-foreground">
			<Loader2 className="h-4 w-4 animate-spin" />
			Loading X report…
		</div>
	);
}
