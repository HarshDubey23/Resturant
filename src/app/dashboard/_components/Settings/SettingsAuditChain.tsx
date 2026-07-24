"use client";

/** @file SettingsAuditChain — paginated table of billAuditChain entries with a
 *    verify button that calls /api/audit-chain/verify. Green/red banner shows
 *    the verification result. Filter by billId is supported.
 * @phase 2
 * @audit-finding n/a
 */
import { motion } from "motion/react";
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, Search, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AuditChainEntry {
	_id: string;
	billId?: { toString(): string };
	restaurantID: string;
	sequenceNo: number;
	prevHash: string;
	payloadHash: string;
	hash: string;
	actorRole: string;
	action: string;
	timestamp: string;
}

interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

interface VerifyResult {
	ok: boolean;
	brokenAt?: number;
	totalEntries: number;
}

const ACTION_COLORS: Record<string, string> = {
	create: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
	edit: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
	cancel: "bg-red-500/10 text-red-700 dark:text-red-300",
	refund: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
	void: "bg-red-500/10 text-red-700 dark:text-red-300",
	shift_close: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
	stock_adjust: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
	no_delete_toggle: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

function truncate(s: string, n = 12): string {
	if (!s) return "—";
	return s.length > n ? `${s.substring(0, n)}…` : s;
}

function formatDate(d: string): string {
	return new Date(d).toLocaleString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
}

export default function SettingsAuditChain() {
	const [entries, setEntries] = useState<AuditChainEntry[]>([]);
	const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
	const [loading, setLoading] = useState(true);
	const [billIdFilter, setBillIdFilter] = useState("");
	const [verifying, setVerifying] = useState(false);
	const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

	const fetchEntries = useCallback(async (page: number) => {
		setLoading(true);
		try {
			const params = new URLSearchParams({ page: String(page), limit: "25" });
			if (billIdFilter) params.set("billId", billIdFilter);
			const res = await fetch(`/api/audit-chain?${params.toString()}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message ?? "Failed to fetch audit chain");
			setEntries(data.entries ?? []);
			setPagination(data.pagination ?? { page: 1, limit: 25, total: 0, totalPages: 0 });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to fetch audit chain");
		} finally {
			setLoading(false);
		}
	}, [billIdFilter]);

	useEffect(() => {
		fetchEntries(1);
	}, [fetchEntries]);

	const handleVerify = async () => {
		setVerifying(true);
		try {
			const res = await fetch("/api/audit-chain/verify");
			const data = (await res.json()) as VerifyResult | { message?: string };
			if (!res.ok) throw new Error((data as { message?: string }).message ?? "Verification failed");
			setVerifyResult(data as VerifyResult);
			if ((data as VerifyResult).ok) {
				toast.success("Audit chain verified — no tampering detected");
			} else {
				toast.error(`Chain broken at entry #${(data as VerifyResult).brokenAt}`);
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Verification failed");
		} finally {
			setVerifying(false);
		}
	};

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm flex items-center justify-between">
						<span>Tamper-Proof Audit Chain</span>
						<Button size="sm" variant="outline" onClick={handleVerify} loading={verifying}>
							<ShieldCheck className="h-4 w-4 mr-1" />
							Verify Chain
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-xs text-muted-foreground">
						Every bill create/edit/cancel/refund/void, shift close, stock adjust and no-delete toggle is
						hash-chained here. Deletes are blocked at the model layer — this table is append-only.
					</p>

					{verifyResult && (
						<motion.div
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							className={
								verifyResult.ok
									? "rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2"
									: "rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2"
							}>
							{verifyResult.ok ? (
								<>
									<ShieldCheck className="h-4 w-4" />
									<span className="font-semibold">Chain verified ✓</span>
									<span className="text-xs opacity-80">({verifyResult.totalEntries} entries, all hashes match)</span>
								</>
							) : (
								<>
									<AlertTriangle className="h-4 w-4" />
									<span className="font-semibold">CHAIN BROKEN AT #{verifyResult.brokenAt}</span>
									<span className="text-xs opacity-80">of {verifyResult.totalEntries} entries — investigate immediately</span>
								</>
							)}
						</motion.div>
					)}

					<div className="flex items-end gap-2">
						<div className="space-y-1.5 flex-1 max-w-sm">
							<Label htmlFor="chain-bill-filter" className="text-xs font-medium text-muted-foreground">
								Filter by Bill ID
							</Label>
							<div className="relative">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									id="chain-bill-filter"
									placeholder="ObjectId or empty for all"
									value={billIdFilter}
									onChange={(e) => setBillIdFilter(e.target.value)}
									className="pl-8 h-8 text-sm"
								/>
							</div>
						</div>
						<Button size="sm" variant="outline" onClick={() => fetchEntries(1)}>Apply</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-0">
					{loading ? (
						<div className="space-y-2 p-4">
							{[...Array(6)].map((_, i) => (
								<Skeleton key={`chain-sk-${i.toString()}`} className="h-10 w-full rounded-lg" />
							))}
						</div>
					) : entries.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
							<div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
								<ShieldCheck className="h-7 w-7 text-muted-foreground" />
							</div>
							<div>
								<p className="text-sm font-semibold">No audit entries yet</p>
								<p className="text-xs text-muted-foreground mt-1 max-w-sm">
									Audit chain entries appear here as soon as bills are created, edited, cancelled, or stock is adjusted.
								</p>
							</div>
						</div>
					) : (
						<>
							<div className="max-h-[520px] overflow-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-16">#</TableHead>
											<TableHead>Action</TableHead>
											<TableHead>Actor</TableHead>
											<TableHead>Bill</TableHead>
											<TableHead>Hash</TableHead>
											<TableHead>Prev</TableHead>
											<TableHead>Timestamp</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{entries.map((e, i) => (
											<motion.tr
												key={e._id}
												initial={{ opacity: 0, y: 4 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.2 }}
												className="hover:bg-muted/40 font-mono text-xs"
											>
												<TableCell className="font-semibold tabular-nums">{e.sequenceNo}</TableCell>
												<TableCell>
													<Badge className={`text-[10px] ${ACTION_COLORS[e.action] ?? "bg-muted text-muted-foreground"}`}>
														{e.action}
													</Badge>
												</TableCell>
												<TableCell className="font-sans">{e.actorRole}</TableCell>
												<TableCell className="text-muted-foreground">{e.billId ? truncate(e.billId.toString(), 10) : "—"}</TableCell>
												<TableCell className="text-muted-foreground" title={e.hash}>{truncate(e.hash, 14)}</TableCell>
												<TableCell className="text-muted-foreground" title={e.prevHash}>
													{e.prevHash === "GENESIS" ? "GENESIS" : truncate(e.prevHash, 10)}
												</TableCell>
												<TableCell className="font-sans">{formatDate(e.timestamp)}</TableCell>
											</motion.tr>
										))}
									</TableBody>
								</Table>
							</div>
							{pagination.totalPages > 1 && (
								<div className="flex items-center justify-between px-4 py-3 border-t">
									<p className="text-xs text-muted-foreground">
										Showing {(pagination.page - 1) * pagination.limit + 1}–
										{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
									</p>
									<div className="flex items-center gap-2">
										<Button variant="outline" size="sm" disabled={pagination.page <= 1 || loading} onClick={() => fetchEntries(pagination.page - 1)}>
											<ChevronLeft className="h-3.5 w-3.5" />
											Prev
										</Button>
										<span className="text-xs tabular-nums">{pagination.page} / {pagination.totalPages}</span>
										<Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => fetchEntries(pagination.page + 1)}>
											Next
											<ChevronRight className="h-3.5 w-3.5" />
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{loading && (
				<div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
					<Loader2 className="h-3 w-3 animate-spin" />
					Loading chain…
				</div>
			)}
		</div>
	);
}
