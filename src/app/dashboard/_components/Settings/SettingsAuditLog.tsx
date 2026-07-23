"use client";

import { ChevronLeft, ChevronRight, FileText, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useAdmin } from "#components/context/useContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AuditLogEntry {
	_id: string;
	restaurantID: string;
	actor: string;
	actorRole: string;
	action: string;
	targetType?: string;
	targetId?: string;
	metadata?: Record<string, unknown>;
	ipAddress?: string;
	userAgent?: string;
	createdAt: string;
	updatedAt: string;
}

interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

const ACTION_OPTIONS = [
	{ value: "", label: "All actions" },
	{ value: "order_accept", label: "Order Accept" },
	{ value: "order_reject", label: "Order Reject" },
	{ value: "order_reject_on_active", label: "Order Reject (Active)" },
	{ value: "order_complete", label: "Order Complete" },
	{ value: "menu_create", label: "Menu Create" },
	{ value: "menu_update", label: "Menu Update" },
	{ value: "menu_delete", label: "Menu Delete" },
	{ value: "menu_toggle_visibility", label: "Menu Toggle Visibility" },
	{ value: "theme_update", label: "Theme Update" },
	{ value: "password_change", label: "Password Change" },
	{ value: "ai_keys_update", label: "AI Keys Update" },
	{ value: "payment_refund", label: "Payment Refund" },
	{ value: "payment_route_settle", label: "Payment Route Settle" },
	{ value: "cron_settle", label: "Cron Settlement" },
	{ value: "whatsapp_campaign_create", label: "WhatsApp Campaign Create" },
	{ value: "whatsapp_campaign_send", label: "WhatsApp Campaign Send" },
	{ value: "whatsapp_campaign_retry", label: "WhatsApp Campaign Retry" },
	{ value: "whatsapp_campaign_delete", label: "WhatsApp Campaign Delete" },
	{ value: "tables_setup", label: "Tables Setup" },
	{ value: "menu_setup", label: "Menu Setup" },
	{ value: "billing_checkout", label: "Billing Checkout" },
	{ value: "customer_login", label: "Customer Login" },
	{ value: "customer_order_place", label: "Customer Order Place" },
	{ value: "customer_order_cancel", label: "Customer Order Cancel" },
];

const ACTION_COLORS: Record<string, string> = {
	order_accept: "bg-emerald-100 text-emerald-700",
	order_complete: "bg-emerald-100 text-emerald-700",
	order_reject: "bg-red-100 text-red-700",
	order_reject_on_active: "bg-red-100 text-red-700",
	menu_create: "bg-blue-100 text-blue-700",
	menu_update: "bg-amber-100 text-amber-700",
	menu_delete: "bg-red-100 text-red-700",
	menu_toggle_visibility: "bg-amber-100 text-amber-700",
	menu_setup: "bg-blue-100 text-blue-700",
	theme_update: "bg-violet-100 text-violet-700",
	password_change: "bg-orange-100 text-orange-700",
	ai_keys_update: "bg-cyan-100 text-cyan-700",
	payment_refund: "bg-red-100 text-red-700",
	payment_route_settle: "bg-emerald-100 text-emerald-700",
	cron_settle: "bg-slate-100 text-slate-700",
	whatsapp_campaign_create: "bg-teal-100 text-teal-700",
	billing_checkout: "bg-violet-100 text-violet-700",
	tables_setup: "bg-blue-100 text-blue-700",
};

function formatActionLabel(action: string): string {
	const found = ACTION_OPTIONS.find((o) => o.value === action);
	return found ? found.label : action;
}

function formatDate(dateStr: string): string {
	const d = new Date(dateStr);
	return d.toLocaleString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
}

export default function SettingsAuditLog() {
	const { profile } = useAdmin();
	const [logs, setLogs] = useState<AuditLogEntry[]>([]);
	const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
	const [loading, setLoading] = useState(true);
	const [actionFilter, setActionFilter] = useState("");
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");

	const fetchLogs = useCallback(
		async (page: number) => {
			setLoading(true);
			try {
				const params = new URLSearchParams({ page: String(page), limit: "20" });
				if (actionFilter) params.set("action", actionFilter);
				if (fromDate) params.set("from", fromDate);
				if (toDate) params.set("to", toDate);

				const res = await fetch(`/api/admin/audit-log?${params.toString()}`);
				const data = await res.json();
				if (!res.ok) throw new Error(data?.message || "Failed to fetch audit logs");

				setLogs(data.logs || []);
				setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
			} catch {
				setLogs([]);
			} finally {
				setLoading(false);
			}
		},
		[actionFilter, fromDate, toDate],
	);

	useEffect(() => {
		fetchLogs(1);
	}, [fetchLogs]);

	// Only visible to owner and manager roles
	const role = profile?.role;
	if (role !== "owner" && role !== "manager" && role !== "admin") {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
					<FileText className="h-8 w-8 text-muted-foreground" />
				</div>
				<p className="text-sm font-semibold">Access restricted</p>
				<p className="text-xs text-muted-foreground mt-1 max-w-xs">Audit logs are visible to owners and managers only.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-4">
			{/* Header */}
			<div>
				<h2 className="text-lg font-bold tracking-tight">Audit Log</h2>
				<p className="text-sm text-muted-foreground mt-0.5 max-w-md">
					Track all significant actions across your restaurant — orders, menu changes, payments, and more.
				</p>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base flex items-center gap-2">
						<Search className="h-4 w-4" />
						Filters
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-3 items-end">
						<div className="space-y-1.5 min-w-[180px]">
							<span className="text-xs font-medium text-muted-foreground">Action type</span>
							<Select value={actionFilter} onValueChange={setActionFilter}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="All actions" />
								</SelectTrigger>
								<SelectContent>
									{ACTION_OPTIONS.map((opt) => (
										<SelectItem key={opt.value || "all"} value={opt.value || "all"}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="audit-from" className="text-xs font-medium text-muted-foreground">
								From date
							</Label>
							<Input id="audit-from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-[160px]" />
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="audit-to" className="text-xs font-medium text-muted-foreground">
								To date
							</Label>
							<Input id="audit-to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-[160px]" />
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Table */}
			<Card>
				<CardContent className="p-0">
					{loading ? (
						<div className="flex items-center justify-center py-20">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : !logs.length ? (
						<div className="flex flex-col items-center justify-center py-20 text-center">
							<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
								<FileText className="h-8 w-8 text-muted-foreground" />
							</div>
							<p className="text-sm font-semibold">No audit logs found</p>
							<p className="text-xs text-muted-foreground mt-1">Adjust filters or wait for actions to be recorded.</p>
						</div>
					) : (
						<>
							<div className="max-h-96 overflow-y-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Timestamp</TableHead>
											<TableHead>Actor</TableHead>
											<TableHead>Action</TableHead>
											<TableHead>Target Type</TableHead>
											<TableHead>Target ID</TableHead>
											<TableHead>IP Address</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{logs.map((log) => (
											<TableRow key={log._id}>
												<TableCell className="text-xs font-mono">{formatDate(log.createdAt)}</TableCell>
												<TableCell>
													<div className="flex items-center gap-1.5">
														<span className="text-xs font-medium">{log.actor}</span>
														<Badge variant="outline" className="text-[10px] px-1.5 py-0">
															{log.actorRole}
														</Badge>
													</div>
												</TableCell>
												<TableCell>
													<Badge
														className={`text-[10px] px-1.5 py-0.5 rounded-md ${ACTION_COLORS[log.action] || "bg-slate-100 text-slate-700"}`}>
														{formatActionLabel(log.action)}
													</Badge>
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">{log.targetType || "—"}</TableCell>
												<TableCell className="text-xs font-mono text-muted-foreground max-w-[120px] truncate">{log.targetId || "—"}</TableCell>
												<TableCell className="text-xs font-mono text-muted-foreground">{log.ipAddress || "—"}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							{/* Pagination */}
							{pagination.totalPages > 1 && (
								<div className="flex items-center justify-between px-4 py-3 border-t">
									<p className="text-xs text-muted-foreground">
										Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
										{pagination.total}
									</p>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											disabled={pagination.page <= 1 || loading}
											onClick={() => fetchLogs(pagination.page - 1)}
											className="gap-1">
											<ChevronLeft className="h-3.5 w-3.5" />
											Prev
										</Button>
										<span className="text-xs font-medium tabular-nums">
											{pagination.page} / {pagination.totalPages}
										</span>
										<Button
											variant="outline"
											size="sm"
											disabled={pagination.page >= pagination.totalPages || loading}
											onClick={() => fetchLogs(pagination.page + 1)}
											className="gap-1">
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
		</div>
	);
}
