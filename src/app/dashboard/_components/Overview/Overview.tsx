"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAdmin } from "#components/context/useContext";
import { formatCurrency } from "#utils/helper/currency";

type OverviewData = {
	todayRevenue: number;
	todayOrders: number;
	activeOrders: number;
	weekRevenue: number;
	monthRevenue: number;
	repeatRate: number;
	avgTicket: number;
	gstCollected: number;
	dailyRevenue: Array<{ date: string; revenue: number }>;
	recentOrders: Array<{
		_id: string;
		table: string;
		orderTotal: number;
		taxTotal: number;
		createdAt: string;
		state: string;
		products: Array<{ name: string; quantity: number }>;
	}>;
};

export default function Overview() {
	const { profile } = useAdmin();
	const [data, setData] = useState<OverviewData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [analyticsRes, ordersRes] = await Promise.all([fetch("/api/admin/analytics?range=7d"), fetch("/api/admin/order")]);
				const analytics = await analyticsRes.json();
				const ordersJson = await ordersRes.json();
				const orders = ordersJson?.orders ?? [];

				setData({
					todayRevenue: analytics?.live?.todayRevenue ?? 0,
					todayOrders: analytics?.live?.todayOrders ?? 0,
					activeOrders: orders.filter((o: { state: string }) => o.state === "active").length,
					weekRevenue: analytics?.live?.weekRevenue ?? 0,
					monthRevenue: analytics?.live?.monthRevenue ?? 0,
					repeatRate: analytics?.live?.repeatRate ?? 0,
					avgTicket: analytics?.live?.avgTicket ?? 0,
					gstCollected: analytics?.live?.gstCollected ?? 0,
					dailyRevenue: analytics?.dailyRevenue ?? [],
					recentOrders: orders.slice(0, 5),
				});
			} catch {
				/* ignore */
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	if (loading) {
		return (
			<div className="flex justify-center py-12">
				<div className="flex items-center gap-3 text-muted-foreground">
					<div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
					<span className="text-sm">Loading dashboard...</span>
				</div>
			</div>
		);
	}

	const currency = profile?.currency || "INR";

	return (
		<div className="space-y-6 max-w-5xl">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Welcome{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""} 👋</h2>
					<p className="text-xs text-muted-foreground mt-0.5">Here&apos;s what&apos;s happening today</p>
				</div>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="rounded-xl border bg-card p-4">
					<p className="text-xs text-muted-foreground mb-1">Today Revenue</p>
					<p className="text-2xl font-bold">{formatCurrency(data?.todayRevenue ?? 0, currency)}</p>
				</motion.div>
				<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border bg-card p-4">
					<p className="text-xs text-muted-foreground mb-1">Today Orders</p>
					<p className="text-2xl font-bold">{data?.todayOrders ?? 0}</p>
				</motion.div>
				<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border bg-card p-4">
					<p className="text-xs text-muted-foreground mb-1">Active Orders</p>
					<p className="text-2xl font-bold text-orange-500">{data?.activeOrders ?? 0}</p>
				</motion.div>
				<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border bg-card p-4">
					<p className="text-xs text-muted-foreground mb-1">Avg Ticket</p>
					<p className="text-2xl font-bold">{formatCurrency(data?.avgTicket ?? 0, currency)}</p>
				</motion.div>
			</div>

			<div className="grid lg:grid-cols-3 gap-4">
				<div className="lg:col-span-2 rounded-xl border bg-card p-4">
					<h3 className="text-sm font-medium mb-4">Revenue (7 days)</h3>
					{data?.dailyRevenue && data.dailyRevenue.length > 0 ? (
						<ResponsiveContainer width="100%" height={200}>
							<BarChart data={data.dailyRevenue}>
								<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
								<XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
								<YAxis
									tick={{ fontSize: 10 }}
									stroke="hsl(var(--muted-foreground))"
									tickFormatter={(v) => `${currency === "INR" ? "₹" : "$"}${(v / 1000).toFixed(0)}k`}
								/>
								<Tooltip
									contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
									formatter={(value) => [formatCurrency(Number(value), currency), "Revenue"]}
								/>
								<Bar dataKey="revenue" fill="#F97316" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
							</BarChart>
						</ResponsiveContainer>
					) : (
						<div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">No data yet</div>
					)}
				</div>

				<div className="rounded-xl border bg-card p-4">
					<h3 className="text-sm font-medium mb-3">Quick Actions</h3>
					<div className="space-y-2">
						<Link
							href="/dashboard?tab=orders&subTab=requests"
							className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
							<span className="text-lg">📋</span>
							<div>
								<p className="font-medium">Order Requests</p>
								<p className="text-[10px] text-muted-foreground">Review new orders</p>
							</div>
						</Link>
						<Link
							href="/dashboard?tab=orders&subTab=active"
							className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
							<span className="text-lg">🍳</span>
							<div>
								<p className="font-medium">Active Orders</p>
								<p className="text-[10px] text-muted-foreground">{data?.activeOrders ?? 0} in progress</p>
							</div>
						</Link>
						<Link href="/dashboard?tab=analytics" className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
							<span className="text-lg">📊</span>
							<div>
								<p className="font-medium">Analytics</p>
								<p className="text-[10px] text-muted-foreground">View reports & insights</p>
							</div>
						</Link>
						<Link
							href="/dashboard?tab=settings&subTab=menu"
							className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
							<span className="text-lg">🍽️</span>
							<div>
								<p className="font-medium">Manage Menu</p>
								<p className="text-[10px] text-muted-foreground">Edit items & categories</p>
							</div>
						</Link>
					</div>
				</div>
			</div>

			<div className="rounded-xl border bg-card p-4">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-sm font-medium">Recent Orders</h3>
					<Link href="/dashboard?tab=orders" className="text-xs text-primary hover:underline">
						View all
					</Link>
				</div>
				{data?.recentOrders && data.recentOrders.length > 0 ? (
					<div className="divide-y divide-border/50">
						{data.recentOrders.map((order) => (
							<div key={order._id} className="flex items-center justify-between py-2.5 text-xs">
								<div className="flex items-center gap-3 min-w-0">
									<span className="font-mono text-muted-foreground shrink-0">#{order._id.slice(-6)}</span>
									<span className="font-medium">Table {order.table}</span>
									<span className="text-muted-foreground">{order.products?.length ?? 0} items</span>
								</div>
								<div className="flex items-center gap-3 shrink-0">
									<span
										className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
											order.state === "active"
												? "bg-green-900/30 text-green-400"
												: order.state === "complete"
													? "bg-blue-900/30 text-blue-400"
													: "bg-muted text-muted-foreground"
										}`}>
										{order.state}
									</span>
									<span className="font-medium">{formatCurrency((order.orderTotal ?? 0) + (order.taxTotal ?? 0), currency)}</span>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-8 text-xs text-muted-foreground">No orders yet</div>
				)}
			</div>
		</div>
	);
}
