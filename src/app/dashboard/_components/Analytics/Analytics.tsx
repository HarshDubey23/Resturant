"use client";

import { Activity, Bot, Calendar, CreditCard, DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAdmin } from "#components/context/useContext";
import { currencySymbol, formatCurrency } from "#utils/helper/currency";

interface AnalyticsData {
	live: {
		todayRevenue: number;
		todayOrders: number;
		completedToday: number;
		weekRevenue: number;
		monthRevenue: number;
		repeatRate: number;
		avgTicket: number;
		gstCollected: number;
	};
	topDishes: Array<{ name: string; count: number }>;
	peakHours: Array<{ hour: number; count: number }>;
	topCustomers: Array<{ name: string; orders: number; total: number }>;
	churnedCustomers: Array<{ name: string; phone: string }>;
	dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
	paymentMethods: Array<{ method: string; revenue: number; orders: number }>;
	categories: Array<{ category: string; revenue: number; units: number }>;
	orderStatus: Array<{ status: string; count: number }>;
	weekdays: Array<{ day: number; count: number; revenue: number }>;
	aiCommentary: string[];
}

const RANGES = [
	{ value: "7d", label: "7 Days" },
	{ value: "30d", label: "30 Days" },
	{ value: "90d", label: "90 Days" },
] as const;

const CHART_COLORS = ["#F97316", "#DC2626", "#EAB308", "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6", "#A855F7", "#F59E0B"];
const PEAK_HOUR_COLORS = CHART_COLORS;

const PAYMENT_LABELS: Record<string, string> = {
	razorpay: "Razorpay",
	stripe: "Stripe (Card)",
	cash: "Cash / Pay@Table",
};

const WEEKDAY_LABELS = ["", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_LABELS: Record<string, string> = {
	complete: "Completed",
	active: "Active",
	cancel: "Cancelled",
	reject: "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
	complete: "#22C55E",
	active: "#3B82F6",
	cancel: "#EAB308",
	reject: "#DC2626",
};

function StatCard({
	icon: Icon,
	label,
	value,
	sub,
	trend,
}: {
	icon: typeof DollarSign;
	label: string;
	value: string;
	sub?: string;
	trend?: { value: number; positive: boolean };
}) {
	return (
		<div className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow">
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2 text-muted-foreground">
					<Icon className="h-4 w-4" />
					<span className="text-xs font-medium">{label}</span>
				</div>
				{trend && (
					<span className={`text-[10px] font-medium ${trend.positive ? "text-green-600" : "text-red-500"}`}>
						{trend.positive ? "↑" : "↓"} {trend.value}%
					</span>
				)}
			</div>
			<p className="text-2xl font-bold tracking-tight">{value}</p>
			{sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
		</div>
	);
}

export default function Analytics() {
	const [data, setData] = useState<AnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [range, setRange] = useState("30d");
	const { profile } = useAdmin();

	const fetchData = useCallback(async () => {
		try {
			const res = await fetch(`/api/admin/analytics?range=${range}`);
			if (res.ok) setData(await res.json());
		} catch {
			/* ignore */
		} finally {
			setLoading(false);
		}
	}, [range]);

	useEffect(() => {
		setLoading(true);
		fetchData();
		const interval = setInterval(fetchData, 60000);
		return () => clearInterval(interval);
	}, [fetchData]);

	if (loading && !data) {
		return (
			<div className="flex justify-center py-12">
				<div className="flex items-center gap-3 text-muted-foreground">
					<div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
					<span className="text-sm">Loading analytics...</span>
				</div>
			</div>
		);
	}

	if (!data) {
		return <div className="text-center py-12 text-muted-foreground">Unable to load analytics</div>;
	}

	const currency = profile?.currency || "INR";
	const maxDishCount = Math.max(...data.topDishes.map((d) => d.count), 1);

	// Compute trends (week vs month avg per day)
	const weekPerDay = data.live.weekRevenue / 7;
	const monthPerDay = data.live.monthRevenue / 30;
	const revenueTrend = monthPerDay > 0 ? Math.round(((weekPerDay - monthPerDay) / monthPerDay) * 100) : 0;

	// Total revenue for pie chart percentages
	const totalPaymentRevenue = data.paymentMethods.reduce((s, p) => s + p.revenue, 0);
	const totalStatusCount = data.orderStatus.reduce((s, o) => s + o.count, 0);

	// Weekday data formatted with labels
	const weekdayData = data.weekdays.map((w) => ({
		...w,
		label: WEEKDAY_LABELS[w.day] || `Day ${w.day}`,
	}));

	return (
		<div className="space-y-6 max-w-6xl">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Analytics</h2>
					<p className="text-xs text-muted-foreground mt-0.5">Revenue, orders, customers & insights — updated live</p>
				</div>
				<div className="flex gap-1 bg-muted rounded-lg p-1">
					{RANGES.map((r) => (
						<button
							key={r.value}
							onClick={() => setRange(r.value)}
							className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
								range === r.value ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
							}`}>
							{r.label}
						</button>
					))}
				</div>
			</div>

			{/* KPI Stat Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<StatCard
					icon={DollarSign}
					label="Today Revenue"
					value={formatCurrency(data.live.todayRevenue, currency)}
					sub={`${data.live.todayOrders} orders today`}
				/>
				<StatCard
					icon={ShoppingCart}
					label="Month Revenue"
					value={formatCurrency(data.live.monthRevenue, currency)}
					sub={`${data.live.completedToday} completed today`}
					trend={revenueTrend !== 0 ? { value: Math.abs(revenueTrend), positive: revenueTrend >= 0 } : undefined}
				/>
				<StatCard icon={Users} label="Repeat Rate" value={`${data.live.repeatRate}%`} sub="Returning customers" />
				<StatCard
					icon={TrendingUp}
					label="Avg Ticket"
					value={formatCurrency(data.live.avgTicket, currency)}
					sub={`GST: ${formatCurrency(data.live.gstCollected, currency)}`}
				/>
			</div>

			{/* Revenue Trend (Area chart) + Peak Hours (Bar) */}
			<div className="grid lg:grid-cols-2 gap-4">
				<div className="rounded-xl border bg-card p-4">
					<div className="flex items-center gap-2 mb-4">
						<Activity className="h-4 w-4 text-orange-500" />
						<h3 className="text-sm font-medium">Revenue Trend</h3>
					</div>
					{data.dailyRevenue.length > 0 ? (
						<ResponsiveContainer width="100%" height={240}>
							<AreaChart data={data.dailyRevenue}>
								<defs>
									<linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
										<stop offset="95%" stopColor="#F97316" stopOpacity={0.05} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
								<XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
								<YAxis
									tick={{ fontSize: 10 }}
									stroke="hsl(var(--muted-foreground))"
									tickFormatter={(v) => `${currencySymbol(currency)}${(v / 1000).toFixed(0)}k`}
								/>
								<Tooltip
									contentStyle={{
										background: "hsl(var(--card))",
										border: "1px solid hsl(var(--border))",
										borderRadius: "8px",
										fontSize: "12px",
									}}
									formatter={(value) => [formatCurrency(Number(value), currency), "Revenue"]}
								/>
								<Area type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2} fill="url(#revenueGradient)" />
							</AreaChart>
						</ResponsiveContainer>
					) : (
						<div className="flex items-center justify-center h-[240px] text-xs text-muted-foreground">No revenue data for this period</div>
					)}
				</div>

				<div className="rounded-xl border bg-card p-4">
					<div className="flex items-center gap-2 mb-4">
						<Calendar className="h-4 w-4 text-orange-500" />
						<h3 className="text-sm font-medium">Peak Hours (orders by hour)</h3>
					</div>
					{data.peakHours.length > 0 ? (
						<ResponsiveContainer width="100%" height={240}>
							<BarChart data={data.peakHours}>
								<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
								<XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}:00`} stroke="hsl(var(--muted-foreground))" />
								<YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
								<Tooltip
									contentStyle={{
										background: "hsl(var(--card))",
										border: "1px solid hsl(var(--border))",
										borderRadius: "8px",
										fontSize: "12px",
									}}
									formatter={(value) => [Number(value), "Orders"]}
									labelFormatter={(label) => `${label}:00`}
								/>
								<Bar dataKey="count" radius={[4, 4, 0, 0]}>
									{data.peakHours.map((_, i) => (
										<Cell key={i} fill={PEAK_HOUR_COLORS[i % PEAK_HOUR_COLORS.length]} fillOpacity={0.8} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					) : (
						<div className="flex items-center justify-center h-[240px] text-xs text-muted-foreground">No peak hour data yet</div>
					)}
				</div>
			</div>

			{/* Payment Methods Donut + Order Status Donut */}
			<div className="grid lg:grid-cols-2 gap-4">
				<div className="rounded-xl border bg-card p-4">
					<div className="flex items-center gap-2 mb-4">
						<CreditCard className="h-4 w-4 text-orange-500" />
						<h3 className="text-sm font-medium">Revenue by Payment Method</h3>
					</div>
					{data.paymentMethods && data.paymentMethods.length > 0 ? (
						<div className="flex flex-col sm:flex-row items-center gap-4">
							<ResponsiveContainer width="100%" height={220} minWidth={180}>
								<PieChart>
									<Pie
										data={data.paymentMethods.map((p) => ({ ...p, name: PAYMENT_LABELS[p.method] || p.method }))}
										dataKey="revenue"
										nameKey="name"
										cx="50%"
										cy="50%"
										innerRadius={50}
										outerRadius={85}
										paddingAngle={3}>
										{data.paymentMethods.map((_, i) => (
											<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
										))}
									</Pie>
									<Tooltip
										contentStyle={{
											background: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "8px",
											fontSize: "12px",
										}}
										formatter={(value: number, _name, entry) => {
											const pct = totalPaymentRevenue > 0 ? ((value / totalPaymentRevenue) * 100).toFixed(1) : "0";
											return [`${formatCurrency(Number(value), currency)} (${pct}%)`, entry?.payload?.name ?? ""];
										}}
									/>
								</PieChart>
							</ResponsiveContainer>
							<div className="flex-1 space-y-2 w-full">
								{data.paymentMethods.map((p, i) => {
									const pct = totalPaymentRevenue > 0 ? ((p.revenue / totalPaymentRevenue) * 100).toFixed(1) : "0";
									return (
										<div key={p.method} className="flex items-center justify-between text-xs">
											<div className="flex items-center gap-2 min-w-0">
												<span className="w-3 h-3 rounded-sm shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
												<span className="font-medium truncate">{PAYMENT_LABELS[p.method] || p.method}</span>
											</div>
											<div className="flex items-center gap-3 shrink-0">
												<span className="text-muted-foreground">{pct}%</span>
												<span className="text-muted-foreground">{p.orders} ord</span>
												<span className="font-medium w-20 text-right">{formatCurrency(p.revenue, currency)}</span>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					) : (
						<div className="flex items-center justify-center h-[220px] text-xs text-muted-foreground">No payment data yet</div>
					)}
				</div>

				<div className="rounded-xl border bg-card p-4">
					<div className="flex items-center gap-2 mb-4">
						<ShoppingCart className="h-4 w-4 text-orange-500" />
						<h3 className="text-sm font-medium">Order Status Breakdown</h3>
					</div>
					{data.orderStatus && data.orderStatus.length > 0 ? (
						<div className="flex flex-col sm:flex-row items-center gap-4">
							<ResponsiveContainer width="100%" height={220} minWidth={180}>
								<PieChart>
									<Pie
										data={data.orderStatus.map((o) => ({ ...o, name: STATUS_LABELS[o.status] || o.status }))}
										dataKey="count"
										nameKey="name"
										cx="50%"
										cy="50%"
										innerRadius={50}
										outerRadius={85}
										paddingAngle={3}>
										{data.orderStatus.map((o, i) => (
											<Cell key={i} fill={STATUS_COLORS[o.status] || CHART_COLORS[i % CHART_COLORS.length]} />
										))}
									</Pie>
									<Tooltip
										contentStyle={{
											background: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "8px",
											fontSize: "12px",
										}}
										formatter={(value: number, _name, entry) => {
											const pct = totalStatusCount > 0 ? ((value / totalStatusCount) * 100).toFixed(1) : "0";
											return [`${value} orders (${pct}%)`, entry?.payload?.name ?? ""];
										}}
									/>
								</PieChart>
							</ResponsiveContainer>
							<div className="flex-1 space-y-2 w-full">
								{data.orderStatus.map((o) => {
									const pct = totalStatusCount > 0 ? ((o.count / totalStatusCount) * 100).toFixed(1) : "0";
									return (
										<div key={o.status} className="flex items-center justify-between text-xs">
											<div className="flex items-center gap-2 min-w-0">
												<span className="w-3 h-3 rounded-sm shrink-0" style={{ background: STATUS_COLORS[o.status] || "#999" }} />
												<span className="font-medium truncate">{STATUS_LABELS[o.status] || o.status}</span>
											</div>
											<div className="flex items-center gap-3 shrink-0">
												<span className="font-medium">{o.count}</span>
												<span className="text-muted-foreground">({pct}%)</span>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					) : (
						<div className="flex items-center justify-center h-[220px] text-xs text-muted-foreground">No order data yet</div>
					)}
				</div>
			</div>

			{/* Category Breakdown (horizontal bar) + Weekday Breakdown */}
			<div className="grid lg:grid-cols-2 gap-4">
				<div className="rounded-xl border bg-card p-4">
					<div className="flex items-center gap-2 mb-4">
						<TrendingUp className="h-4 w-4 text-orange-500" />
						<h3 className="text-sm font-medium">Revenue by Category</h3>
					</div>
					{data.categories && data.categories.length > 0 ? (
						<ResponsiveContainer width="100%" height={Math.max(220, data.categories.length * 36)}>
							<BarChart data={data.categories} layout="vertical" margin={{ left: 10, right: 20 }}>
								<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
								<XAxis
									type="number"
									tick={{ fontSize: 10 }}
									stroke="hsl(var(--muted-foreground))"
									tickFormatter={(v) => `${currencySymbol(currency)}${(v / 1000).toFixed(0)}k`}
								/>
								<YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={90} />
								<Tooltip
									contentStyle={{
										background: "hsl(var(--card))",
										border: "1px solid hsl(var(--border))",
										borderRadius: "8px",
										fontSize: "12px",
									}}
									formatter={(value, _name, entry) => [`${formatCurrency(Number(value), currency)} (${entry?.payload?.units ?? 0} units)`, "Revenue"]}
								/>
								<Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
									{data.categories.map((_, i) => (
										<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					) : (
						<div className="flex items-center justify-center h-[220px] text-xs text-muted-foreground">No category data yet</div>
					)}
				</div>

				<div className="rounded-xl border bg-card p-4">
					<div className="flex items-center gap-2 mb-4">
						<Calendar className="h-4 w-4 text-orange-500" />
						<h3 className="text-sm font-medium">Orders by Weekday</h3>
					</div>
					{weekdayData.length > 0 ? (
						<ResponsiveContainer width="100%" height={240}>
							<BarChart data={weekdayData}>
								<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
								<XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
								<YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
								<Tooltip
									contentStyle={{
										background: "hsl(var(--card))",
										border: "1px solid hsl(var(--border))",
										borderRadius: "8px",
										fontSize: "12px",
									}}
									formatter={(value: number, name) => {
										if (name === "count") return [`${value} orders`, "Orders"];
										return [formatCurrency(Number(value), currency), "Revenue"];
									}}
								/>
								<Legend wrapperStyle={{ fontSize: 11 }} />
								<Bar dataKey="count" name="Orders" fill="#3B82F6" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
							</BarChart>
						</ResponsiveContainer>
					) : (
						<div className="flex items-center justify-center h-[240px] text-xs text-muted-foreground">No weekday data yet</div>
					)}
				</div>
			</div>

			{/* Top Dishes + Top Customers */}
			<div className="grid lg:grid-cols-2 gap-4">
				<div className="rounded-xl border bg-card p-4">
					<h3 className="text-sm font-medium mb-3">Top Dishes</h3>
					{data.topDishes.length > 0 ? (
						<div className="space-y-2">
							{data.topDishes.slice(0, 7).map((d, i) => (
								<div key={d.name} className="flex items-center gap-3">
									<span className="text-[10px] font-mono text-muted-foreground w-4 text-right">{i + 1}</span>
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between mb-1">
											<span className="text-xs font-medium truncate">{d.name}</span>
											<span className="text-xs text-muted-foreground shrink-0 ml-2">{d.count}</span>
										</div>
										<div className="h-1.5 bg-muted rounded-full overflow-hidden">
											<div
												className="h-full rounded-full transition-all"
												style={{ width: `${(d.count / maxDishCount) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
											/>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="flex items-center justify-center h-32 text-xs text-muted-foreground">No dish data yet</div>
					)}
				</div>

				<div className="rounded-xl border bg-card p-4">
					<h3 className="text-sm font-medium mb-3">Top Customers</h3>
					{data.topCustomers.length > 0 ? (
						<div className="space-y-1">
							{data.topCustomers.map((c, i) => (
								<div key={i} className="flex items-center justify-between py-1.5 text-xs border-b border-border/50 last:border-0">
									<div className="flex items-center gap-2 min-w-0">
										<span className="text-[10px] font-mono text-muted-foreground w-4 text-right shrink-0">{i + 1}</span>
										<span className="truncate font-medium">{c.name}</span>
									</div>
									<div className="flex items-center gap-3 shrink-0">
										<span className="text-muted-foreground">{c.orders} orders</span>
										<span className="font-medium w-20 text-right">{formatCurrency(c.total, currency)}</span>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="flex items-center justify-center h-32 text-xs text-muted-foreground">No customer data yet</div>
					)}
				</div>
			</div>

			{/* Churned Customers */}
			{data.churnedCustomers.length > 0 && (
				<div className="rounded-xl border bg-card p-4">
					<h3 className="text-sm font-medium mb-3 text-red-500">Churned Customers (no orders in 30d)</h3>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
						{data.churnedCustomers.map((c, i) => (
							<div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/30">
								<span className="text-base">😞</span>
								<div className="min-w-0">
									<p className="truncate font-medium">{c.name}</p>
									<p className="text-muted-foreground truncate">{c.phone}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* AI Insights */}
			{data.aiCommentary.length > 0 && (
				<div className="rounded-xl border bg-card p-4 bg-gradient-to-br from-orange-500/5 to-transparent">
					<div className="flex items-center gap-2 mb-3">
						<Bot className="h-4 w-4 text-orange-500" />
						<h3 className="text-sm font-medium">AI Insights</h3>
					</div>
					<ul className="space-y-2">
						{data.aiCommentary.map((c, i) => (
							<li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
								<span className="text-orange-500 mt-0.5 shrink-0">•</span>
								{c}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
