"use client";

import { AlertTriangle, ArrowRight, Crown, MessageSquare, Sparkles, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "#components/context/useContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const PLAN_DETAILS: Record<string, { label: string; maxTables: number; maxMenuItems: number; price: string; features: string[] }> = {
	free: {
		label: "Free",
		maxTables: 5,
		maxMenuItems: 20,
		price: "₹0",
		features: ["Basic ordering", "5 tables", "20 menu items"],
	},
	pro: {
		label: "Pro",
		maxTables: 20,
		maxMenuItems: 200,
		price: "₹999/mo",
		features: ["AI chat (Jarvis)", "WhatsApp notifications", "20 tables", "200 menu items", "Analytics"],
	},
	enterprise: {
		label: "Enterprise",
		maxTables: 999999,
		maxMenuItems: 999999,
		price: "₹4999/mo",
		features: ["Per-tenant AI keys", "Unlimited WhatsApp", "Unlimited tables & menu items", "Priority support"],
	},
};

export default function SettingsBilling() {
	const { profile, tables, menus } = useAdmin();
	const session = useSession();
	const [loadingAction, setLoadingAction] = useState<string | null>(null);

	const accountPlan = ((session.data as Record<string, unknown>)?.plan as string) ?? "free";
	const subscriptionActive = ((session.data as Record<string, unknown>)?.subscriptionActive as boolean) ?? false;

	const currentPlan = PLAN_DETAILS[accountPlan] ?? PLAN_DETAILS.free;
	const currentTableCount = tables?.length ?? 0;
	const currentMenuItemCount = menus?.length ?? 0;
	const tableLimit = accountPlan === "enterprise" ? currentTableCount + 1 : currentPlan.maxTables;
	const menuItemLimit = accountPlan === "enterprise" ? currentMenuItemCount + 1 : currentPlan.maxMenuItems;

	const handleCheckout = async (plan: "pro" | "enterprise") => {
		setLoadingAction(`checkout-${plan}`);
		try {
			const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1] ?? "";
			const res = await fetch("/api/billing/checkout", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-CSRF-Token": csrfToken,
				},
				body: JSON.stringify({ plan, interval: "month" }),
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.message ?? "Failed to create checkout session");
			}
			const { url } = await res.json();
			if (url) {
				window.location.href = url;
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Checkout failed");
		} finally {
			setLoadingAction(null);
		}
	};

	const handlePortal = async () => {
		setLoadingAction("portal");
		try {
			const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1] ?? "";
			const res = await fetch("/api/billing/portal", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-CSRF-Token": csrfToken,
				},
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.message ?? "Failed to open billing portal");
			}
			const { url } = await res.json();
			if (url) {
				window.location.href = url;
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Portal failed");
		} finally {
			setLoadingAction(null);
		}
	};

	if (session.status === "loading" || !profile) {
		return (
			<div className="max-w-lg mx-auto space-y-4">
				<Skeleton className="h-24 w-full rounded-lg" />
				<Skeleton className="h-40 w-full rounded-lg" />
				<Skeleton className="h-32 w-full rounded-lg" />
			</div>
		);
	}

	return (
		<div className="max-w-lg mx-auto space-y-6">
			{/* ── Subscription expired warning ── */}
			{!subscriptionActive && accountPlan !== "free" && (
				<Card className="border-amber-200 bg-amber-50">
					<CardContent className="p-4">
						<div className="flex items-start gap-3">
							<AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
							<div className="flex-1">
								<h3 className="text-sm font-semibold text-amber-800">Subscription Ended</h3>
								<p className="text-xs text-amber-700 mt-1">Some features are limited. Renew your subscription or downgrade to Free.</p>
								<div className="flex gap-2 mt-3">
									<Button
										size="sm"
										onClick={() => handleCheckout(accountPlan === "enterprise" ? "enterprise" : "pro")}
										loading={loadingAction === `checkout-${accountPlan === "enterprise" ? "enterprise" : "pro"}`}
										className="bg-amber-600 hover:bg-amber-700 text-white">
										Renew
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={handlePortal}
										loading={loadingAction === "portal"}
										className="border-amber-300 text-amber-700 hover:bg-amber-100">
										Downgrade to Free
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* ── Current plan card ── */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Crown className="h-4 w-4" />
							Current Plan
						</CardTitle>
						<Badge variant={accountPlan === "free" ? "outline" : "default"}>{currentPlan.label}</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Status</span>
						<span className={subscriptionActive ? "text-emerald-600" : "text-slate-500"}>
							{accountPlan === "free" ? "Active" : subscriptionActive ? "Active" : "Expired"}
						</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Price</span>
						<span className="font-medium">{currentPlan.price}</span>
					</div>
					<Separator />
					<div className="space-y-3">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground flex items-center gap-1.5">
								<MessageSquare className="h-3.5 w-3.5" />
								Tables
							</span>
							<span>
								<span className="font-medium">{currentTableCount}</span>
								<span className="text-muted-foreground"> / {accountPlan === "enterprise" ? "∞" : tableLimit}</span>
							</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground flex items-center gap-1.5">
								<Sparkles className="h-3.5 w-3.5" />
								Menu Items
							</span>
							<span>
								<span className="font-medium">{currentMenuItemCount}</span>
								<span className="text-muted-foreground"> / {accountPlan === "enterprise" ? "∞" : menuItemLimit}</span>
							</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">WhatsApp</span>
							<span>
								{accountPlan === "free" ? (
									<Badge variant="outline" className="text-xs">
										Disabled
									</Badge>
								) : accountPlan === "pro" ? (
									<span className="font-medium">1,000/mo</span>
								) : (
									<Badge variant="default" className="text-xs">
										Unlimited
									</Badge>
								)}
							</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">AI Chat</span>
							<span>
								{accountPlan === "free" ? (
									<Badge variant="outline" className="text-xs">
										Pro only
									</Badge>
								) : (
									<Badge variant="default" className="text-xs">
										Enabled
									</Badge>
								)}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* ── Upgrade cards ── */}
			{accountPlan !== "enterprise" && (
				<Card>
					<CardHeader>
						<CardTitle>Upgrade Plan</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{accountPlan === "free" && (
							<div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
								<div className="flex-1">
									<h4 className="text-sm font-semibold flex items-center gap-1.5">
										<Sparkles className="h-3.5 w-3.5 text-violet-600" />
										Pro
									</h4>
									<p className="text-xs text-muted-foreground mt-0.5">₹999/mo — 20 tables, 200 items, AI, WhatsApp</p>
								</div>
								<Button size="sm" onClick={() => handleCheckout("pro")} loading={loadingAction === "checkout-pro"} disabled={loadingAction !== null}>
									Upgrade <ArrowRight className="h-3.5 w-3.5" />
								</Button>
							</div>
						)}
						<div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
							<div className="flex-1">
								<h4 className="text-sm font-semibold flex items-center gap-1.5">
									<Crown className="h-3.5 w-3.5 text-amber-600" />
									Enterprise
								</h4>
								<p className="text-xs text-muted-foreground mt-0.5">₹4999/mo — Unlimited everything, priority support</p>
							</div>
							<Button
								size="sm"
								onClick={() => handleCheckout("enterprise")}
								loading={loadingAction === "checkout-enterprise"}
								disabled={loadingAction !== null}>
								Upgrade <ArrowRight className="h-3.5 w-3.5" />
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* ── Manage billing ── */}
			{accountPlan !== "free" && (
				<Card>
					<CardContent className="p-4 flex flex-col gap-2">
						<Button variant="outline" onClick={handlePortal} loading={loadingAction === "portal"} disabled={loadingAction !== null} className="w-full">
							Manage Billing
						</Button>
						<p className="text-xs text-muted-foreground text-center">View invoices, update payment methods, or cancel your subscription.</p>
					</CardContent>
				</Card>
			)}

			{/* ── Plan comparison ── */}
			<Card>
				<CardHeader>
					<CardTitle>Plan Comparison</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full text-xs">
							<thead>
								<tr className="border-b border-slate-200">
									<th className="py-2 text-left text-muted-foreground">Feature</th>
									<th className="py-2 text-center text-muted-foreground">Free</th>
									<th className="py-2 text-center text-muted-foreground">Pro</th>
									<th className="py-2 text-center text-muted-foreground">Enterprise</th>
								</tr>
							</thead>
							<tbody>
								<tr className="border-b border-slate-100">
									<td className="py-2">Tables</td>
									<td className="py-2 text-center">5</td>
									<td className="py-2 text-center">20</td>
									<td className="py-2 text-center">∞</td>
								</tr>
								<tr className="border-b border-slate-100">
									<td className="py-2">Menu Items</td>
									<td className="py-2 text-center">20</td>
									<td className="py-2 text-center">200</td>
									<td className="py-2 text-center">∞</td>
								</tr>
								<tr className="border-b border-slate-100">
									<td className="py-2">AI Chat</td>
									<td className="py-2 text-center">
										<X className="h-3 w-3 text-slate-400 inline" />
									</td>
									<td className="py-2 text-center">
										<Sparkles className="h-3 w-3 text-emerald-500 inline" />
									</td>
									<td className="py-2 text-center">
										<Sparkles className="h-3 w-3 text-emerald-500 inline" />
									</td>
								</tr>
								<tr className="border-b border-slate-100">
									<td className="py-2">WhatsApp</td>
									<td className="py-2 text-center">
										<X className="h-3 w-3 text-slate-400 inline" />
									</td>
									<td className="py-2 text-center">1k/mo</td>
									<td className="py-2 text-center">∞</td>
								</tr>
								<tr>
									<td className="py-2 font-medium">Price</td>
									<td className="py-2 text-center">₹0</td>
									<td className="py-2 text-center font-semibold">₹999/mo</td>
									<td className="py-2 text-center font-semibold">₹4999/mo</td>
								</tr>
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
