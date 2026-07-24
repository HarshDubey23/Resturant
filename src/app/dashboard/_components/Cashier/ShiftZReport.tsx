"use client";

/**
 * @file ShiftZReport — end-of-day Z report (post-close, locked).
 * @phase 2
 * @audit-finding n/a
 *
 * Renders after ShiftClose successfully closes a shift. Shows expected vs
 * counted cash, variance, all shift metrics, and a locked indicator. The
 * close API already appended a `shift_close` entry to billAuditChain, so
 * this report is the human-readable projection of that hash-chained record.
 * Totals animate up via motion's useMotionValue + animate().
 */

import { animate, motion, useMotionValue } from "motion/react";
import { useEffect, useState } from "react";
import { Lock, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "#utils/helper/currency";

export interface ShiftZReportData {
        shift: {
                _id?: string;
                openingCash: number;
                cashierName?: string;
                openedAt: string;
                closedAt?: string;
                status: "open" | "closed" | "flagged";
                expectedCash: number;
                countedCash: number;
                variance: number;
                kotCount: number;
                hashChainSeq?: number;
        };
        metrics: {
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
                countedCash: number;
                variance: number;
                tolerance: number;
                flagged: boolean;
                hashChainSeq?: number;
        };
}

export interface ShiftZReportProps {
        data: unknown;
        onClose: () => void;
}

export default function ShiftZReport({ data, onClose }: ShiftZReportProps) {
        const report = data as ShiftZReportData;
        const shift = report?.shift;
        const metrics = report?.metrics;
        const flagged = !!metrics?.flagged;

        const handlePrint = () => {
                window.print();
        };

        if (!shift || !metrics) {
                return (
                        <div className="rounded-xl border bg-destructive/10 p-4 text-sm text-destructive">
                                Unable to render Z report — missing data.
                        </div>
                );
        }

        return (
                <div className="space-y-4">
                        <div className="flex items-start justify-between">
                                <div>
                                        <div className="flex items-center gap-2">
                                                <h3 className="text-base font-semibold">Z Report</h3>
                                                <Badge variant={flagged ? "destructive" : "secondary"} className="gap-1">
                                                        <Lock className="h-3 w-3" />
                                                        {flagged ? "Flagged" : "Locked"}
                                                </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                                Cashier: {shift.cashierName ?? "—"} • Closed {shift.closedAt ? new Date(shift.closedAt).toLocaleString() : "—"}
                                        </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={handlePrint}>
                                        <Printer className="h-3.5 w-3.5" />
                                        Print
                                </Button>
                        </div>

                        {flagged && (
                                <motion.div
                                        initial={{ opacity: 0, scale: 0.96 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                                        <p className="font-semibold">Cash shortage detected</p>
                                        <p className="text-xs opacity-90">
                                                Shortfall of {formatCurrency(Math.max(0, metrics.expectedCash - metrics.countedCash))} has been reported to n8n via <code>cash.shift_short</code>. This shift cannot be reopened.
                                        </p>
                                </motion.div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                                <CountUpStat label="Opening cash" value={shift.openingCash} />
                                <CountUpStat label="Total sales" value={metrics.totalSales} highlight />
                                <CountUpStat label="Cash sales" value={metrics.cashSales} />
                                <CountUpStat label="UPI sales" value={metrics.upiSales} />
                                <CountUpStat label="Card sales" value={metrics.cardSales} />
                                <CountUpStat label="Tips" value={metrics.tips} />
                        </div>

                        <Separator />

                        <div className="rounded-xl border bg-muted/30 p-3 text-sm">
                                <Row label="Expected cash" value={formatCurrency(metrics.expectedCash)} />
                                <Row label="Counted cash" value={formatCurrency(metrics.countedCash)} />
                                <Separator className="my-2" />
                                <Row label="Variance" value={formatCurrency(metrics.variance)} strong />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                                <MiniStat label="Voids" count={metrics.voids.count} amount={metrics.voids.amount} />
                                <MiniStat label="Discounts" count={metrics.discounts.count} amount={metrics.discounts.amount} />
                                <MiniStat label="Refunds" count={metrics.refunds.count} amount={metrics.refunds.amount} />
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3 text-sm">
                                <span className="text-muted-foreground">KOTs printed</span>
                                <span className="font-semibold tabular-nums">{metrics.kotCount}</span>
                        </div>

                        <div className="flex items-center justify-end">
                                <Button onClick={onClose}>Done</Button>
                        </div>
                </div>
        );
}

function CountUpStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
        const motionValue = useMotionValue(0);
        const [display, setDisplay] = useState(formatCurrency(0));

        useEffect(() => {
                const controls = animate(motionValue, value, {
                        duration: 0.6,
                        ease: "easeOut",
                        onUpdate: (v) => setDisplay(formatCurrency(v)),
                });
                return controls.stop;
        }, [motionValue, value]);

        return (
                <div className={`rounded-xl border p-3 ${highlight ? "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800" : "bg-card"}`}>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <motion.p className="mt-1 text-sm font-semibold tabular-nums" suppressHydrationWarning>
                                {display}
                        </motion.p>
                </div>
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

function MiniStat({ label, count, amount }: { label: string; count: number; amount: number }) {
        return (
                <div className="rounded-xl border bg-card p-2 text-center">
                        <p className="text-muted-foreground">{label}</p>
                        <p className="text-sm font-semibold">{count}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(amount)}</p>
                </div>
        );
}
