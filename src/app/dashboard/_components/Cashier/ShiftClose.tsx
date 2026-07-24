"use client";

/**
 * @file ShiftClose — End-of-shift flow with cash reconciliation + Z report.
 * @phase 2
 * @audit-finding n/a
 *
 * Shows expected cash (opening + cash sales − cash refunds − payouts + cash
 * tips), prompts for counted cash, computes variance. If counted < expected −
 * tolerance: status becomes `flagged`, a red banner renders, and the close
 * API dispatches `cash.shift_short`. After a successful close, the printable
 * Z report (ShiftZReport) renders inside the same dialog.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CheckCircle2, Printer, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "#utils/helper/currency";
import ShiftZReport from "./ShiftZReport";

const closeSchema = z.object({
	countedCash: z
		.number({ invalid_type_error: "Enter a numeric amount" })
		.min(0, "Counted cash cannot be negative"),
});
type CloseValues = z.infer<typeof closeSchema>;

export interface ShiftCloseProps {
	open: boolean;
	/** Called after a successful close — parent refetches shift state. */
	onClosed: () => void;
	/** Allow dismissal without closing (e.g. click outside). */
	onCancel: () => void;
}

interface ExpectedCashPayload {
	expectedCash: number;
	openingCash: number;
	cashSales: number;
	cashRefunds: number;
	payouts: number;
	cashTips: number;
	tolerance: number;
	currency: string;
}

export default function ShiftClose({ open, onClosed, onCancel }: ShiftCloseProps) {
	const [expected, setExpected] = useState<ExpectedCashPayload | null>(null);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [zReport, setZReport] = useState<unknown | null>(null);

	const {
		register,
		handleSubmit,
		watch,
		reset,
		formState: { errors },
	} = useForm<CloseValues>({
		resolver: zodResolver(closeSchema),
		defaultValues: { countedCash: 0 },
	});

	const counted = watch("countedCash") ?? 0;
	const expectedNow = expected?.expectedCash ?? 0;
	const variance = Number(counted || 0) - expectedNow;
	const tolerance = expected?.tolerance ?? 0;
	const flagged = Number(counted || 0) < expectedNow - tolerance;

	useEffect(() => {
		if (!open) return;
		setLoading(true);
		setZReport(null);
		fetch("/api/cashier/shift/x-report", { cache: "no-store" })
			.then((r) => r.json())
			.then((data) => {
				const m = data?.metrics ?? {};
				const shift = data?.shift ?? {};
				setExpected({
					expectedCash: Number(m.expectedCash ?? shift.openingCash ?? 0),
					openingCash: Number(shift.openingCash ?? 0),
					cashSales: Number(m.cashSales ?? 0),
					cashRefunds: Number(m.refunds?.amount ?? 0),
					payouts: 0,
					cashTips: Number(m.tips ?? 0),
					tolerance: Number(m.tolerance ?? shift.tolerance ?? 0),
					currency: "INR",
				});
				reset({ countedCash: Number(m.expectedCash ?? shift.openingCash ?? 0) });
			})
			.catch(() => toast.error("Failed to load shift snapshot"))
			.finally(() => setLoading(false));
	}, [open, reset]);

	const onSubmit = async (values: CloseValues) => {
		setSubmitting(true);
		try {
			const res = await fetch("/api/cashier/shift/close", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ countedCash: values.countedCash }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message ?? "Failed to close shift");
			if (data?.metrics?.flagged) {
				toast.error("Shift flagged for cash shortage");
			} else {
				toast.success("Shift closed");
			}
			setZReport(data);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to close shift");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDone = () => {
		setZReport(null);
		reset({ countedCash: 0 });
		onClosed();
	};

	return (
		<Dialog open={open} onOpenChange={(next) => !next && !zReport && onCancel()}>
			<DialogContent className="sm:max-w-lg">
				{zReport ? (
					<ShiftZReport data={zReport} onClose={handleDone} />
				) : (
					<>
						<DialogHeader>
							<DialogTitle>End Shift — Cash Reconciliation</DialogTitle>
							<DialogDescription>Count the cash drawer and enter the total to close the shift.</DialogDescription>
						</DialogHeader>

						{loading || !expected ? (
							<div className="space-y-3">
								<Skeleton className="h-20 w-full" />
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
							</div>
						) : (
							<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
								<div className="rounded-xl border bg-muted/30 p-3 text-sm">
									<Row label="Opening cash" value={formatCurrency(expected.openingCash)} />
									<Row label="+ Cash sales" value={formatCurrency(expected.cashSales)} />
									<Row label="− Cash refunds" value={formatCurrency(expected.cashRefunds)} />
									<Row label="− Payouts" value={formatCurrency(expected.payouts)} />
									<Row label="+ Cash tips" value={formatCurrency(expected.cashTips)} />
									<Separator className="my-2" />
									<Row label="Expected cash" value={formatCurrency(expected.expectedCash)} strong />
								</div>

								<div className="space-y-2">
									<Label htmlFor="countedCash">Counted Cash</Label>
									<Input
										id="countedCash"
										type="number"
										step="0.01"
										min="0"
										aria-invalid={!!errors.countedCash}
										{...register("countedCash", { valueAsNumber: true })}
									/>
									{errors.countedCash && <p className="text-xs text-destructive">{errors.countedCash.message}</p>}
								</div>

								<div
									className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
										flagged ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
									}`}>
									{flagged ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
									<div className="flex-1">
										<p className="font-medium">
											Variance: {formatCurrency(variance)} {flagged ? "— SHORT" : "— OK"}
										</p>
										<p className="text-xs opacity-80">Tolerance: {formatCurrency(tolerance)}</p>
									</div>
								</div>

								{flagged && (
									<div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
										<XCircle className="mt-0.5 h-4 w-4 shrink-0" />
										<p>Closing will flag this shift and dispatch a <code>cash.shift_short</code> alert to n8n for manager review. The shift cannot be reopened.</p>
									</div>
								)}

								<div className="flex items-center justify-end gap-2">
									<Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
										Cancel
									</Button>
									<motion.div whileHover={{ scale: submitting ? 1 : 1.02 }} whileTap={{ scale: submitting ? 1 : 0.98 }}>
										<Button type="submit" loading={submitting}>
											<Printer className="h-4 w-4" />
											Close & Print Z
										</Button>
									</motion.div>
								</div>
							</form>
						)}
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
	return (
		<div className="flex items-center justify-between py-0.5">
			<span className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</span>
			<span className={strong ? "font-bold tabular-nums" : "tabular-nums"}>{value}</span>
		</div>
	);
}
