"use client";

import { ArrowRight, BarChart3, Building2, CreditCard, Loader2, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KpiData {
	totalTenants: number;
	mrr: number;
	ordersThisMonth: number;
	aiSpend: number;
	whatsappSpend: number;
	planBreakdown: { free: number; pro: number; enterprise: number };
}

export default function PlatformPage() {
	const [kpi, setKpi] = useState<KpiData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetch("/api/platform/kpi")
			.then((r) => r.json())
			.then((data) => {
				setKpi(data);
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message || "Failed to load KPIs");
				setLoading(false);
			});
	}, []);

	if (loading) {
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

	if (!kpi) {
		return (
			<div className="flex items-center justify-center py-24">
				<p className="text-sm text-slate-500">No data available</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-bold text-slate-900">Platform Overview</h1>
				<Badge className="bg-amber-500 text-white hover:bg-amber-600">Super Admin</Badge>
			</div>

			{/* KPI cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<div className="flex items-center gap-2">
							<Building2 className="h-4 w-4 text-violet-600" />
							<CardTitle className="text-sm font-semibold">Total Tenants</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-slate-900">{kpi.totalTenants}</p>
						<div className="flex gap-2 mt-2">
							<Badge variant="outline" className="text-xs">
								Free: {kpi.planBreakdown.free}
							</Badge>
							<Badge variant="outline" className="text-xs text-violet-600 border-violet-200">
								Pro: {kpi.planBreakdown.pro}
							</Badge>
							<Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
								Ent: {kpi.planBreakdown.enterprise}
							</Badge>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<div className="flex items-center gap-2">
							<CreditCard className="h-4 w-4 text-emerald-600" />
							<CardTitle className="text-sm font-semibold">MRR</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-slate-900">₹{kpi.mrr.toLocaleString()}</p>
						<p className="text-xs text-slate-500 mt-1">Monthly recurring revenue from active subscriptions</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<div className="flex items-center gap-2">
							<ShoppingBag className="h-4 w-4 text-sky-600" />
							<CardTitle className="text-sm font-semibold">Orders This Month</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-slate-900">{kpi.ordersThisMonth}</p>
						<p className="text-xs text-slate-500 mt-1">Total orders across all tenants</p>
					</CardContent>
				</Card>
			</div>

			{/* Additional stats */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<div className="flex items-center gap-2">
							<BarChart3 className="h-4 w-4 text-orange-600" />
							<CardTitle className="text-sm font-semibold">AI Spend</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-slate-900">₹{kpi.aiSpend.toLocaleString()}</p>
						<p className="text-xs text-slate-500 mt-1">Aggregate AI provider costs this month</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<div className="flex items-center gap-2">
							<BarChart3 className="h-4 w-4 text-green-600" />
							<CardTitle className="text-sm font-semibold">WhatsApp Spend</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-slate-900">₹{kpi.whatsappSpend.toLocaleString()}</p>
						<p className="text-xs text-slate-500 mt-1">Aggregate WhatsApp API costs this month</p>
					</CardContent>
				</Card>
			</div>

			{/* Quick links */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-3">
						<a
							href="/platform/tenants"
							className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium px-2.5 h-8 gap-1.5 hover:bg-slate-50 hover:-translate-y-0.5 shadow-soft hover:shadow-soft-hover transition-all duration-200">
							Manage Tenants <ArrowRight className="h-4 w-4 ml-1" />
						</a>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
