"use client";

import { Building2, Eye, Loader2, Search, Shield, ShieldOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { captureError } from "#utils/helper/sentryWrapper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface Tenant {
	_id: string;
	username: string;
	email: string;
	accountActive: boolean;
	subscriptionActive: boolean;
	plan: string;
	platformAdmin: boolean;
	createdAt: string;
	profile?: { name?: string; avatar?: string } | null;
}

interface TenantsData {
	tenants: Tenant[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export default function PlatformTenantsPage() {
	const [data, setData] = useState<TenantsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [impersonating, setImpersonating] = useState<string | null>(null);
	const [suspending, setSuspending] = useState<string | null>(null);

	const fetchTenants = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({ page: String(page), limit: "20", search });
			const res = await fetch(`/api/platform/tenants?${params}`);
			if (!res.ok) throw new Error("Failed to load tenants");
			const json = await res.json();
			setData(json);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setLoading(false);
		}
	}, [page, search]);

	useEffect(() => {
		fetchTenants();
	}, [fetchTenants]);

	const handleImpersonate = async (accountId: string) => {
		setImpersonating(accountId);
		try {
			const res = await fetch("/api/platform/impersonate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ accountId }),
			});
			// FIX (audit F2): previously this redirected to /dashboard
			// unconditionally — even when the impersonate API returned a 4xx
			// or 5xx — landing the operator on a dashboard they had no
			// impersonation context for. Now we only redirect on res.ok;
			// on failure we surface the error and stay on the tenants page.
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				const message = (body as { message?: string } | null)?.message ?? `Impersonation failed (HTTP ${res.status})`;
				toast.error(message);
				return;
			}
			window.location.href = "/dashboard";
		} catch (err) {
			captureError(err, { route: "/platform/tenants", context: "impersonate" });
			toast.error("Network error — could not start impersonation. Please retry.");
		} finally {
			setImpersonating(null);
		}
	};

	const handleSuspend = async (accountId: string, suspended: boolean) => {
		setSuspending(accountId);
		try {
			const res = await fetch("/api/platform/tenants", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ accountId, suspended }),
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				const message = (body as { message?: string } | null)?.message ?? `Suspend/unsuspend failed (HTTP ${res.status})`;
				toast.error(message);
				return;
			}
			await fetchTenants();
		} catch (err) {
			captureError(err, { route: "/platform/tenants", context: "suspend" });
			toast.error("Network error — could not update tenant status. Please retry.");
		} finally {
			setSuspending(null);
		}
	};

	if (loading && !data) {
		return (
			<div className="flex items-center justify-center py-24">
				<Loader2 className="h-8 w-8 animate-spin text-violet-600" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center py-24">
				<div className="text-center space-y-3">
					<p className="text-sm text-red-600">{error}</p>
					<Button variant="outline" onClick={() => window.location.reload()}>
						Retry
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Building2 className="h-5 w-5 text-violet-600" />
					<h1 className="text-xl font-bold text-slate-900">Tenant Management</h1>
					{data && (
						<Badge variant="outline" className="text-xs">
							{data.total} total
						</Badge>
					)}
				</div>
			</div>

			{/* Search */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<Input
						placeholder="Search by username or email..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="pl-9"
					/>
				</div>
			</div>

			{/* Tenants table */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm font-semibold">All Tenants</CardTitle>
				</CardHeader>
				<CardContent>
					{!data || data.tenants.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-sm text-slate-500">No tenants found</p>
						</div>
					) : (
						<div className="space-y-3">
							{data.tenants.map((tenant) => {
								const name = tenant.profile?.name || tenant.username;
								const initials = name.charAt(0).toUpperCase();
								return (
									<div key={tenant._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
										<div className="flex items-center gap-3 min-w-0">
											<Avatar className="h-9 w-9 rounded-lg">
												{tenant.profile?.avatar ? <AvatarImage src={tenant.profile.avatar} alt={name} /> : null}
												<AvatarFallback className="rounded-lg bg-violet-100 text-violet-700 text-xs font-bold">{initials}</AvatarFallback>
											</Avatar>
											<div className="min-w-0">
												<p className="text-sm font-medium text-slate-900 truncate">{name}</p>
												<p className="text-xs text-slate-500 truncate">{tenant.email}</p>
											</div>
										</div>

										<div className="flex items-center gap-2 flex-wrap">
											<Badge
												variant="outline"
												className={
													tenant.plan === "enterprise"
														? "text-amber-600 border-amber-200"
														: tenant.plan === "pro"
															? "text-violet-600 border-violet-200"
															: "text-slate-500"
												}>
												{tenant.plan}
											</Badge>
											{tenant.accountActive ? (
												<Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Active</Badge>
											) : (
												<Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Suspended</Badge>
											)}
											{tenant.platformAdmin && <Badge className="bg-amber-500 text-white text-xs">Super Admin</Badge>}

											<Separator orientation="vertical" className="h-5 mx-1" />

											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleImpersonate(tenant._id)}
												disabled={impersonating === tenant._id}
												className="text-xs gap-1">
												{impersonating === tenant._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
												Impersonate
											</Button>

											{tenant.accountActive ? (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleSuspend(tenant._id, true)}
													disabled={suspending === tenant._id}
													className="text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">
													{suspending === tenant._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldOff className="h-3 w-3" />}
													Suspend
												</Button>
											) : (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleSuspend(tenant._id, false)}
													disabled={suspending === tenant._id}
													className="text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
													{suspending === tenant._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
													Unsuspend
												</Button>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}

					{/* Pagination */}
					{data && data.totalPages > 1 && (
						<div className="flex items-center justify-between mt-4 pt-4 border-t">
							<p className="text-xs text-slate-500">
								Page {data.page} of {data.totalPages}
							</p>
							<div className="flex gap-2">
								<Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="text-xs">
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setPage(Math.min(data.totalPages, page + 1))}
									disabled={page >= data.totalPages}
									className="text-xs">
									Next
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
