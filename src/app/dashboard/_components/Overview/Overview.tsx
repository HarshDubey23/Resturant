"use client";

import {
	Activity,
	ArrowDownRight,
	ArrowUpRight,
	BarChart3,
	ChefHat,
	ClipboardList,
	CreditCard,
	DollarSign,
	Flame,
	Megaphone,
	Package,
	ShoppingBag,
	Sparkles,
	Timer,
	TrendingUp,
	Users,
	Utensils,
	UtensilsCrossed,
	Wallet,
} from "lucide-react";
import { animate, motion, useMotionValue } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAdmin } from "#components/context/useContext";
import { currencySymbol, formatCurrency } from "#utils/helper/currency";
import { captureError } from "#utils/helper/sentryWrapper";

/**
 * Dish-name → thumbnail mapper. Matches common Indian/continental item names
 * to the curated dish image set in /public/food-images/dishes. Falls back to
 * the empty string when no match exists; callers then cycle through the full
 * image set for visual interest on the "Top Dishes" widget (per task spec:
 * "cycle through the dish images for visual interest even if the real menu
 * items differ").
 */
const DISH_IMAGE_MAP: Array<{ keywords: string[]; src: string }> = [
	{ keywords: ["biryani"], src: "/food-images/dishes/biryani.png" },
	{ keywords: ["butter chicken", "makhani", "murgh makhani"], src: "/food-images/dishes/butter-chicken.png" },
	{ keywords: ["paneer"], src: "/food-images/dishes/paneer-masala.png" },
	{ keywords: ["naan", "roti", "paratha", "kulcha"], src: "/food-images/dishes/naan.png" },
	{ keywords: ["dosa"], src: "/food-images/dishes/dosa.png" },
	{ keywords: ["tandoori"], src: "/food-images/dishes/tandoori-chicken.png" },
	{ keywords: ["samosa"], src: "/food-images/dishes/samosa.png" },
	{ keywords: ["gulab", "jamun"], src: "/food-images/dishes/gulab-jamun.png" },
	{ keywords: ["tikka"], src: "/food-images/dishes/chicken-tikka.png" },
	{ keywords: ["pasta"], src: "/food-images/dishes/pasta.png" },
	{ keywords: ["pizza"], src: "/food-images/dishes/pizza.png" },
	{ keywords: ["burger"], src: "/food-images/dishes/burger.png" },
	{ keywords: ["rajma"], src: "/food-images/dishes/rajma-chawal.png" },
	{ keywords: ["chole", "bhature"], src: "/food-images/dishes/chole-bhature.png" },
	{ keywords: ["chai", "tea", "coffee", "latte", "cappuccino"], src: "/food-images/dishes/masala-chai.png" },
	{ keywords: ["fried rice", "rice", "pulao", "biryani rice"], src: "/food-images/dishes/veg-fried-rice.png" },
	{ keywords: ["puri", "pani puri", "golgappa", "gupchup"], src: "/food-images/dishes/pani-puri.png" },
	{ keywords: ["jalebi", "imarti"], src: "/food-images/dishes/jalebi.png" },
];

const DISH_IMAGE_POOL = [
	"/food-images/dishes/biryani.png",
	"/food-images/dishes/butter-chicken.png",
	"/food-images/dishes/paneer-masala.png",
	"/food-images/dishes/naan.png",
	"/food-images/dishes/dosa.png",
	"/food-images/dishes/tandoori-chicken.png",
	"/food-images/dishes/samosa.png",
	"/food-images/dishes/gulab-jamun.png",
	"/food-images/dishes/chicken-tikka.png",
	"/food-images/dishes/pasta.png",
	"/food-images/dishes/pizza.png",
	"/food-images/dishes/burger.png",
	"/food-images/dishes/rajma-chawal.png",
	"/food-images/dishes/chole-bhature.png",
	"/food-images/dishes/masala-chai.png",
	"/food-images/dishes/veg-fried-rice.png",
	"/food-images/dishes/pani-puri.png",
	"/food-images/dishes/jalebi.png",
];

function getDishImage(name: string): string {
	const n = (name || "").toLowerCase();
	for (const entry of DISH_IMAGE_MAP) {
		if (entry.keywords.some((k) => n.includes(k))) return entry.src;
	}
	return "";
}

/** Cycles the dish image pool deterministically by name hash so the same dish
 * always lands on the same fallback image across renders. */
function getCycledDishImage(name: string, index: number): string {
	const direct = getDishImage(name);
	if (direct) return direct;
	const hash = (name || "").split("").reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
	return DISH_IMAGE_POOL[(hash + index) % DISH_IMAGE_POOL.length];
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => `${h.toString().padStart(2, "0")}`);

const PAYMENT_COLORS: Record<string, string> = {
	razorpay: "#7c3aed",
	stripe: "#635bff",
	cash: "#10b981",
	upi: "#f59e0b",
};

const PAYMENT_LABELS: Record<string, string> = {
	razorpay: "Razorpay",
	stripe: "Stripe",
	cash: "Cash",
	upi: "UPI",
};

type RecentOrder = {
	_id: string;
	table: string;
	orderTotal: number;
	taxTotal: number;
	createdAt: string;
	state: string;
	paymentGateway?: string;
	customer?: { fname?: string; lname?: string; phone?: string };
	products: Array<{ name?: string; quantity: number; price: number }>;
};

type OverviewData = {
	todayRevenue: number;
	todayOrders: number;
	yesterdayRevenue: number;
	yesterdayOrders: number;
	activeOrders: number;
	activeTables: number;
	customersToday: number;
	weekRevenue: number;
	monthRevenue: number;
	repeatRate: number;
	avgTicket: number;
	gstCollected: number;
	dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
	recentOrders: RecentOrder[];
	topDishes: Array<{ name: string; count: number }>;
	peakHours: Array<{ hour: number; count: number }>;
	paymentMethods: Array<{ method: string; revenue: number; orders: number }>;
	/** 7x24 grid of order counts derived from real createdAt timestamps. */
	heatmap: number[][];
	/** Per-day sparkline series for KPI cards (last 7 days, oldest first). */
	sparkRevenue: number[];
	sparkOrders: number[];
	sparkAvgTicket: number[];
	sparkCustomers: number[];
	sparkActiveTables: number[];
};

type RangeKey = "7d" | "30d" | "90d";

const RANGE_OPTIONS: Array<{ value: RangeKey; label: string; days: number }> = [
	{ value: "7d", label: "7 days", days: 7 },
	{ value: "30d", label: "30 days", days: 30 },
	{ value: "90d", label: "90 days", days: 90 },
];

/** Returns "5m ago", "2h ago", "just now", "3d ago" for a past ISO timestamp. */
function timeAgo(iso: string): string {
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return "—";
	const diff = Math.max(0, Date.now() - then);
	const min = Math.floor(diff / 60000);
	if (min < 1) return "just now";
	if (min < 60) return `${min}m ago`;
	const hr = Math.floor(min / 60);
	if (hr < 24) return `${hr}h ago`;
	const day = Math.floor(hr / 24);
	return `${day}d ago`;
}

/** Builds the 7x24 heatmap (rows=weekday 0..6, cols=hour 0..23) from real
 * order createdAt timestamps. Returns zeros when no orders exist. */
function buildHeatmap(orders: RecentOrder[]): number[][] {
	const grid: number[][] = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
	for (const o of orders) {
		const d = new Date(o.createdAt);
		if (Number.isNaN(d.getTime())) continue;
		const dow = d.getDay();
		const hr = d.getHours();
		grid[dow][hr] += 1;
	}
	return grid;
}

/** Bins orders by day for the last `days` days and returns per-day metric
 * arrays (oldest first). Used for sparklines so each KPI shows real history. */
function buildSparklineData(orders: RecentOrder[], days = 7) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const buckets: Array<{ date: number; revenue: number; orders: number; customers: Set<string>; tables: Set<string> }> = [];
	for (let i = days - 1; i >= 0; i--) {
		const start = new Date(today.getTime() - i * 86400000).getTime();
		buckets.push({ date: start, revenue: 0, orders: 0, customers: new Set(), tables: new Set() });
	}
	for (const o of orders) {
		const t = new Date(o.createdAt).getTime();
		if (Number.isNaN(t)) continue;
		const bucket = buckets.find((b) => t >= b.date && t < b.date + 86400000);
		if (!bucket) continue;
		bucket.revenue += (o.orderTotal ?? 0) + (o.taxTotal ?? 0);
		bucket.orders += 1;
		const custKey = o.customer?.phone || o.customer?.fname || o._id;
		if (custKey) bucket.customers.add(custKey);
		if (o.table) bucket.tables.add(o.table);
	}
	return {
		revenue: buckets.map((b) => b.revenue),
		orders: buckets.map((b) => b.orders),
		customers: buckets.map((b) => b.customers.size),
		tables: buckets.map((b) => b.tables.size),
		avgTicket: buckets.map((b) => (b.orders > 0 ? b.revenue / b.orders : 0)),
	};
}

function formatTickShort(v: number, currency: string): string {
	if (v >= 100000) return `${currencySymbol(currency)}${(v / 100000).toFixed(1)}L`;
	if (v >= 1000) return `${currencySymbol(currency)}${(v / 1000).toFixed(1)}k`;
	return `${currencySymbol(currency)}${v.toFixed(0)}`;
}

export default function Overview() {
	const { profile } = useAdmin();
	const [data, setData] = useState<OverviewData | null>(null);
	const [loading, setLoading] = useState(true);
	const [range, setRange] = useState<RangeKey>("7d");
	const [syncedAgo, setSyncedAgo] = useState(0);
	const ordersRef = useRef<RecentOrder[]>([]);

	const fetchAnalytics = useCallback(async (selected: RangeKey) => {
		try {
			const [analyticsRes, ordersRes] = await Promise.all([
				fetch(`/api/admin/analytics?range=${selected}`, { cache: "no-store" }),
				fetch("/api/admin/order", { cache: "no-store" }),
			]);
			const analytics = await analyticsRes.json();
			const ordersJson = await ordersRes.json();
			// /api/admin/order returns either an array (no cursor) or
			// { orders: [...] } (with cursor). Handle both shapes defensively.
			const orders: RecentOrder[] = Array.isArray(ordersJson) ? ordersJson : (ordersJson?.orders ?? []);

			ordersRef.current = orders;

			const todayStart = new Date();
			todayStart.setHours(0, 0, 0, 0);
			const yesterdayStart = new Date(todayStart.getTime() - 86400000);

			const todayOrders = orders.filter((o) => new Date(o.createdAt) >= todayStart);
			const yesterdayOrders = orders.filter((o) => {
				const t = new Date(o.createdAt);
				return t >= yesterdayStart && t < todayStart;
			});

			const sumRevenue = (arr: RecentOrder[]) => arr.reduce((acc, o) => acc + (o.orderTotal ?? 0) + (o.taxTotal ?? 0), 0);

			const todayRevenue = analytics?.live?.todayRevenue ?? sumRevenue(todayOrders);
			const yesterdayRevenue = sumRevenue(yesterdayOrders);
			const todayOrderCount = analytics?.live?.todayOrders ?? todayOrders.length;
			const yesterdayOrderCount = yesterdayOrders.length;

			const activeOrdersArr = orders.filter((o) => o.state === "active");
			const activeTables = new Set(activeOrdersArr.map((o) => o.table)).size;
			const customersToday = new Set(todayOrders.map((o) => o.customer?.phone || o.customer?.fname || o._id).filter(Boolean) as string[]).size;

			const sparks = buildSparklineData(orders, 7);

			setData({
				todayRevenue,
				todayOrders: todayOrderCount,
				yesterdayRevenue,
				yesterdayOrders: yesterdayOrderCount,
				activeOrders: activeOrdersArr.length,
				activeTables,
				customersToday,
				weekRevenue: analytics?.live?.weekRevenue ?? 0,
				monthRevenue: analytics?.live?.monthRevenue ?? 0,
				repeatRate: analytics?.live?.repeatRate ?? 0,
				avgTicket: analytics?.live?.avgTicket ?? 0,
				gstCollected: analytics?.live?.gstCollected ?? 0,
				dailyRevenue: analytics?.dailyRevenue ?? [],
				recentOrders: orders.slice(0, 8),
				topDishes: analytics?.topDishes ?? [],
				peakHours: analytics?.peakHours ?? [],
				paymentMethods: analytics?.paymentMethods ?? [],
				heatmap: buildHeatmap(orders),
				sparkRevenue: sparks.revenue,
				sparkOrders: sparks.orders,
				sparkAvgTicket: sparks.avgTicket,
				sparkCustomers: sparks.customers,
				sparkActiveTables: sparks.tables,
			});
		} catch (err) {
			captureError(err, { route: "Overview.fetchAnalytics", range: selected });
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAnalytics(range);
	}, [range, fetchAnalytics]);

	// "synced Xs ago" pulse — ticks every second, resets on each successful fetch.
	// `range` is intentional: switching the range triggers a refetch, and the
	// indicator should reset to 0s so the operator sees fresh data landed.
	// biome-ignore lint/correctness/useExhaustiveDependencies: range intentionally re-triggers reset
	useEffect(() => {
		setSyncedAgo(0);
		const tick = setInterval(() => setSyncedAgo((s) => s + 1), 1000);
		return () => clearInterval(tick);
	}, [range]);

	const currency = profile?.currency || "INR";

	// Hooks must run unconditionally (before the loading early-return) so the
	// hook order is identical on every render. These memoize derived values
	// that are also used by the loading skeleton's empty state siblings.
	const heatmapMax = useMemo(() => {
		if (!data?.heatmap) return 0;
		return Math.max(1, ...data.heatmap.flat());
	}, [data?.heatmap]);
	const paymentTotal = useMemo(() => (data?.paymentMethods ?? []).reduce((acc, p) => acc + (p.revenue ?? 0), 0), [data?.paymentMethods]);

	if (loading) {
		return <OverviewSkeleton />;
	}

	const todayRevenue = data?.todayRevenue ?? 0;
	const yesterdayRevenue = data?.yesterdayRevenue ?? 0;
	const revenueTrend = yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 0;

	const todayOrders = data?.todayOrders ?? 0;
	const yesterdayOrders = data?.yesterdayOrders ?? 0;
	const ordersTrend = yesterdayOrders > 0 ? Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 100) : 0;

	const avgTicket = data?.avgTicket ?? 0;
	const avgTicketTrend =
		todayRevenue > 0 && todayOrders > 0 ? Math.round(((avgTicket - todayRevenue / Math.max(1, todayOrders)) / (todayRevenue / Math.max(1, todayOrders))) * 100) : 0;

	const activeTables = data?.activeTables ?? 0;
	const customersToday = data?.customersToday ?? 0;

	return (
		<div className="space-y-6">
			{/* Header + live status + range toggle */}
			<div className="flex items-end justify-between flex-wrap gap-3">
				<div>
					<h2 className="text-lg font-bold tracking-tight text-foreground">Welcome{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""} 👋</h2>
					<p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Here&apos;s what&apos;s happening at your restaurant today</p>
				</div>
				<div className="flex items-center gap-2 flex-wrap">
					<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
							<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
						</span>
						<span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Live · synced {syncedAgo}s ago</span>
					</div>
					<div className="flex gap-1 bg-muted rounded-lg p-1" role="tablist" aria-label="Revenue range">
						{RANGE_OPTIONS.map((opt) => (
							<button
								key={opt.value}
								type="button"
								role="tab"
								aria-selected={range === opt.value}
								onClick={() => setRange(opt.value)}
								className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors min-h-[36px] ${
									range === opt.value ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
								}`}>
								{opt.label}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Sticky quick actions bar */}
			<QuickActionsBar activeOrders={data?.activeOrders ?? 0} />

			{/* Hero KPI cards with ambiance accent strip */}
			<div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-4 sm:p-6">
				{/* Subtle ambiance background — restaurant interior, low opacity, blended */}
				<div className="absolute inset-0 pointer-events-none opacity-[0.07] dark:opacity-[0.12] mix-blend-luminosity" aria-hidden>
					<Image src="/food-images/ambiance/restaurant-interior.png" alt="" fill sizes="100vw" className="object-cover" />
				</div>
				<div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-card via-card/60 to-transparent" aria-hidden />

				<div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
					<HeroStatCard
						delay={0}
						icon={<DollarSign className="h-4 w-4" />}
						label="Revenue Today"
						value={todayRevenue}
						format={(v) => formatCurrency(v, currency)}
						trend={revenueTrend}
						spark={data?.sparkRevenue ?? []}
						accent="emerald"
					/>
					<HeroStatCard
						delay={0.05}
						icon={<ShoppingBag className="h-4 w-4" />}
						label="Orders Today"
						value={todayOrders}
						format={(v) => Math.round(v).toLocaleString()}
						trend={ordersTrend}
						spark={data?.sparkOrders ?? []}
						accent="violet"
					/>
					<HeroStatCard
						delay={0.1}
						icon={<TrendingUp className="h-4 w-4" />}
						label="Avg Order Value"
						value={avgTicket}
						format={(v) => formatCurrency(v, currency)}
						trend={avgTicketTrend}
						spark={data?.sparkAvgTicket ?? []}
						accent="amber"
					/>
					<HeroStatCard
						delay={0.15}
						icon={<Utensils className="h-4 w-4" />}
						label="Active Tables"
						value={activeTables}
						format={(v) => Math.round(v).toLocaleString()}
						trend={null}
						spark={data?.sparkActiveTables ?? []}
						accent="rose"
					/>
					<HeroStatCard
						delay={0.2}
						icon={<Users className="h-4 w-4" />}
						label="Customers Today"
						value={customersToday}
						format={(v) => Math.round(v).toLocaleString()}
						trend={null}
						spark={data?.sparkCustomers ?? []}
						accent="sky"
					/>
				</div>
			</div>

			{/* Revenue chart + payment donut */}
			<div className="grid lg:grid-cols-3 gap-6">
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-soft p-5">
					<div className="flex items-center justify-between mb-4 flex-wrap gap-2">
						<div>
							<h3 className="text-sm font-semibold text-foreground tracking-tight">Revenue trend · last {range}</h3>
							<p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
								{formatCurrency(data?.weekRevenue ?? 0, currency)} week · {formatCurrency(data?.monthRevenue ?? 0, currency)} month
							</p>
						</div>
						<Link
							href="/dashboard?tab=analytics"
							className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1 transition-all duration-200">
							Analytics <ArrowUpRight className="h-3 w-3" />
						</Link>
					</div>
					{data?.dailyRevenue && data.dailyRevenue.length > 0 ? (
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
							<ResponsiveContainer width="100%" height={240}>
								<AreaChart data={data.dailyRevenue} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
									<defs>
										<linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" stopColor="hsl(263 70% 50%)" stopOpacity={0.45} />
											<stop offset="100%" stopColor="hsl(263 70% 50%)" stopOpacity={0} />
										</linearGradient>
									</defs>
									<Area
										type="monotone"
										dataKey="revenue"
										stroke="hsl(263 70% 50%)"
										strokeWidth={2.5}
										fill="url(#revFill)"
										isAnimationActive
										animationDuration={900}
									/>
									<XAxis
										dataKey="date"
										tick={{ fontSize: 10 }}
										tickFormatter={(v) => (typeof v === "string" ? v.slice(5) : "")}
										stroke="hsl(var(--muted-foreground))"
										axisLine={false}
										tickLine={false}
									/>
									<YAxis
										tick={{ fontSize: 10 }}
										stroke="hsl(var(--muted-foreground))"
										tickFormatter={(v) => formatTickShort(Number(v), currency)}
										axisLine={false}
										tickLine={false}
										width={60}
									/>
									<Tooltip
										contentStyle={{
											background: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "12px",
											fontSize: "12px",
											boxShadow: "var(--shadow-soft)",
										}}
										labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
										itemStyle={{ color: "hsl(var(--foreground))" }}
										formatter={(value) => [formatCurrency(Number(value), currency), "Revenue"]}
									/>
								</AreaChart>
							</ResponsiveContainer>
						</motion.div>
					) : (
						<div className="flex flex-col items-center justify-center h-[240px] text-xs text-muted-foreground gap-2">
							<Activity className="h-8 w-8 opacity-30" />
							No data yet — your chart fills in as orders come in
						</div>
					)}
				</motion.div>

				{/* Payment methods donut */}
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15 }}
					className="rounded-2xl border border-border bg-card shadow-soft p-5">
					<div className="flex items-center gap-2 mb-3">
						<CreditCard className="h-3.5 w-3.5 text-primary" />
						<h3 className="text-sm font-semibold text-foreground tracking-tight">Payment methods</h3>
					</div>
					{data?.paymentMethods && data.paymentMethods.length > 0 ? (
						<>
							<div className="relative">
								<ResponsiveContainer width="100%" height={180}>
									<PieChart>
										<Pie
											data={data.paymentMethods.map((p) => ({
												name: PAYMENT_LABELS[p.method] || p.method || "Other",
												value: p.revenue,
												color: PAYMENT_COLORS[p.method] || "#94a3b8",
											}))}
											dataKey="value"
											nameKey="name"
											cx="50%"
											cy="50%"
											innerRadius={52}
											outerRadius={78}
											paddingAngle={3}
											stroke="hsl(var(--card))"
											strokeWidth={2}
											isAnimationActive
											animationDuration={700}>
											{data.paymentMethods.map((p, i) => (
												<Cell key={`pm-${i}`} fill={PAYMENT_COLORS[p.method] || "#94a3b8"} />
											))}
										</Pie>
										<Tooltip
											contentStyle={{
												background: "hsl(var(--card))",
												border: "1px solid hsl(var(--border))",
												borderRadius: "12px",
												fontSize: "12px",
											}}
											formatter={(value, name) => [formatCurrency(Number(value), currency), name]}
										/>
									</PieChart>
								</ResponsiveContainer>
								<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
									<span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</span>
									<span className="text-base font-bold text-foreground tabular-nums">{formatCurrency(paymentTotal, currency)}</span>
								</div>
							</div>
							<div className="mt-3 space-y-1.5">
								{data.paymentMethods.slice(0, 4).map((p) => {
									const pct = paymentTotal > 0 ? Math.round((p.revenue / paymentTotal) * 100) : 0;
									const color = PAYMENT_COLORS[p.method] || "#94a3b8";
									return (
										<div key={p.method || "other"} className="flex items-center justify-between text-xs">
											<div className="flex items-center gap-2 min-w-0">
												<span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
												<span className="font-medium text-foreground truncate">{PAYMENT_LABELS[p.method] || p.method || "Other"}</span>
											</div>
											<div className="flex items-center gap-2 shrink-0">
												<span className="text-muted-foreground tabular-nums">{pct}%</span>
												<span className="font-semibold text-foreground tabular-nums">{formatCurrency(p.revenue, currency)}</span>
											</div>
										</div>
									);
								})}
							</div>
						</>
					) : (
						<EmptyState
							icon={<CreditCard className="h-7 w-7" />}
							title="No payments yet"
							subtitle="Completed orders will appear here, broken down by gateway."
						/>
					)}
				</motion.div>
			</div>

			{/* Live orders feed + top dishes */}
			<div className="grid lg:grid-cols-3 gap-6">
				{/* Live orders feed */}
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-soft p-5">
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2">
							<Flame className="h-3.5 w-3.5 text-amber-500" />
							<h3 className="text-sm font-semibold text-foreground tracking-tight">Live orders feed</h3>
						</div>
						<Link href="/dashboard?tab=orders" className="text-xs text-primary hover:text-primary/80 transition-all duration-200">
							View all
						</Link>
					</div>
					{data?.recentOrders && data.recentOrders.length > 0 ? (
						<div
							className="max-h-96 overflow-y-auto pr-1 -mr-1 kds-scrollbar"
							style={{
								scrollbarWidth: "thin",
							}}>
							<motion.div
								initial="hidden"
								animate="visible"
								variants={{
									hidden: {},
									visible: { transition: { staggerChildren: 0.05 } },
								}}>
								{data.recentOrders.map((order) => {
									const total = (order.orderTotal ?? 0) + (order.taxTotal ?? 0);
									const items = order.products ?? [];
									const statusColor =
										order.state === "active"
											? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
											: order.state === "complete"
												? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
												: order.state === "cancel" || order.state === "reject"
													? "bg-red-500/15 text-red-600 dark:text-red-400"
													: "bg-muted text-muted-foreground";
									return (
										<motion.div
											key={order._id}
											variants={{
												hidden: { opacity: 0, x: -12 },
												visible: { opacity: 1, x: 0 },
											}}
											whileHover={{ scale: 1.01 }}
											className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0">
											{/* Dish thumbnail cluster — shows up to 3 stacked thumbnails */}
											<div className="relative shrink-0 w-12 h-12">
												{items.slice(0, 3).map((p, i) => {
													const img = getCycledDishImage(p.name || "", i);
													return (
														<div
															key={`${order._id}-${i}`}
															className="absolute rounded-lg overflow-hidden border-2 border-card shadow-soft"
															style={{
																left: i * 8,
																top: i * 4,
																width: 36,
																height: 36,
																zIndex: 3 - i,
															}}>
															<Image src={img} alt={p.name || "dish"} fill sizes="36px" className="object-cover" />
														</div>
													);
												})}
												{items.length === 0 && (
													<div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
														<Utensils className="h-4 w-4 text-muted-foreground" />
													</div>
												)}
											</div>

											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 flex-wrap">
													<span className="font-mono text-[11px] text-muted-foreground">#{order._id.slice(-6)}</span>
													<span className="font-semibold text-sm text-foreground">Table {order.table}</span>
													<span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor}`}>{order.state}</span>
												</div>
												<p className="text-[11px] text-muted-foreground mt-0.5 truncate">
													{items.length > 0
														? items
																.slice(0, 3)
																.map((p) => `${p.quantity}× ${p.name || "Item"}`)
																.join(" · ") + (items.length > 3 ? ` +${items.length - 3} more` : "")
														: "No items"}
												</p>
											</div>

											<div className="flex flex-col items-end shrink-0">
												<span className="font-semibold text-sm text-foreground tabular-nums">{formatCurrency(total, currency)}</span>
												<span className="text-[10px] text-muted-foreground">{timeAgo(order.createdAt)}</span>
											</div>
										</motion.div>
									);
								})}
							</motion.div>
						</div>
					) : (
						<EmptyState
							icon={<Utensils className="h-7 w-7" />}
							title="No orders yet"
							subtitle="Your dashboard comes alive with the first order of the day."
						/>
					)}
				</motion.div>

				{/* Top dishes widget */}
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.25 }}
					className="rounded-2xl border border-border bg-card shadow-soft p-5">
					<div className="flex items-center gap-2 mb-3">
						<Sparkles className="h-3.5 w-3.5 text-primary" />
						<h3 className="text-sm font-semibold text-foreground tracking-tight">Top dishes · this period</h3>
					</div>
					{(() => {
						const top = (data?.topDishes ?? []).slice(0, 5);
						if (top.length === 0) {
							return (
								<EmptyState
									icon={<UtensilsCrossed className="h-7 w-7" />}
									title="No dishes ordered yet"
									subtitle="Top sellers will appear here with thumbnails."
								/>
							);
						}
						const max = top[0]?.count ?? 1;
						const chartData = top.map((d, i) => ({
							name: d.name.length > 14 ? `${d.name.slice(0, 13)}…` : d.name,
							fullName: d.name,
							count: d.count,
							img: getCycledDishImage(d.name, i),
						}));
						return (
							<>
								<div className="mb-3">
									<ResponsiveContainer width="100%" height={100}>
										<BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
											<XAxis type="number" hide />
											<YAxis type="category" dataKey="name" width={0} hide />
											<Bar dataKey="count" radius={[6, 6, 6, 6]} isAnimationActive animationDuration={700}>
												{chartData.map((_d, i) => (
													<Cell key={`bar-${i}`} fill="hsl(263 70% 50%)" />
												))}
											</Bar>
											<Tooltip
												cursor={{ fill: "hsl(var(--muted))" }}
												contentStyle={{
													background: "hsl(var(--card))",
													border: "1px solid hsl(var(--border))",
													borderRadius: "12px",
													fontSize: "12px",
												}}
												formatter={(value) => [`${value} orders`, "Sold"]}
											/>
										</BarChart>
									</ResponsiveContainer>
								</div>
								<div className="space-y-2">
									{top.map((d, i) => (
										<motion.div
											key={d.name + i}
											initial={{ opacity: 0, x: 8 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: 0.3 + i * 0.05 }}
											className="flex items-center gap-3 text-xs">
											<span className="text-[10px] font-bold text-muted-foreground tabular-nums w-4">{i + 1}</span>
											<div className="relative h-8 w-8 rounded-md overflow-hidden shrink-0 border border-border">
												<Image src={getCycledDishImage(d.name, i)} alt={d.name} fill sizes="32px" className="object-cover" />
											</div>
											<div className="flex-1 min-w-0">
												<p className="font-medium text-foreground truncate">{d.name}</p>
												<div className="h-1 rounded-full bg-muted mt-1 overflow-hidden">
													<motion.div
														initial={{ width: 0 }}
														animate={{ width: `${(d.count / max) * 100}%` }}
														transition={{ duration: 0.6, delay: 0.4 + i * 0.05 }}
														className="h-full rounded-full bg-primary"
													/>
												</div>
											</div>
											<span className="font-semibold text-foreground tabular-nums shrink-0">{d.count}×</span>
										</motion.div>
									))}
								</div>
							</>
						);
					})()}
				</motion.div>
			</div>

			{/* Peak hours heatmap (7x24) */}
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
				className="rounded-2xl border border-border bg-card shadow-soft p-5">
				<div className="flex items-center justify-between mb-4 flex-wrap gap-2">
					<div className="flex items-center gap-2">
						<Timer className="h-3.5 w-3.5 text-primary" />
						<h3 className="text-sm font-semibold text-foreground tracking-tight">Peak hours heatmap</h3>
					</div>
					<p className="text-xs text-muted-foreground">Orders by weekday × hour — hover for details</p>
				</div>
				<Heatmap grid={data?.heatmap ?? []} max={heatmapMax} />
			</motion.div>
		</div>
	);
}

/* ------------------------------ Sub-components ----------------------------- */

function HeroStatCard({
	delay,
	icon,
	label,
	value,
	format,
	trend,
	spark,
	accent,
}: {
	delay: number;
	icon: React.ReactNode;
	label: string;
	value: number;
	format: (v: number) => string;
	trend: number | null;
	spark: number[];
	accent: "emerald" | "violet" | "amber" | "rose" | "sky";
}) {
	const accentMap = {
		emerald: {
			iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
			stroke: "#10b981",
			fillFrom: "rgba(16,185,129,0.35)",
			fillTo: "rgba(16,185,129,0)",
		},
		violet: {
			iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
			stroke: "#7c3aed",
			fillFrom: "rgba(124,58,237,0.35)",
			fillTo: "rgba(124,58,237,0)",
		},
		amber: {
			iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
			stroke: "#f59e0b",
			fillFrom: "rgba(245,158,11,0.35)",
			fillTo: "rgba(245,158,11,0)",
		},
		rose: {
			iconBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
			stroke: "#f43f5e",
			fillFrom: "rgba(244,63,94,0.35)",
			fillTo: "rgba(244,63,94,0)",
		},
		sky: {
			iconBg: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
			stroke: "#0ea5e9",
			fillFrom: "rgba(14,165,233,0.35)",
			fillTo: "rgba(14,165,233,0)",
		},
	} as const;
	const a = accentMap[accent];

	return (
		<motion.div
			initial={{ opacity: 0, y: 14, scale: 0.96 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
			whileHover={{ y: -3 }}
			className="relative overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 shadow-soft">
			<div className="flex items-center justify-between mb-2">
				<div className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.iconBg}`}>{icon}</div>
				{trend !== null && (
					<span
						className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5 ${
							trend >= 0 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-red-500/15 text-red-600 dark:text-red-400"
						}`}>
						{trend >= 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
						{Math.abs(trend)}%
					</span>
				)}
			</div>
			<p className="text-[11px] text-muted-foreground mb-0.5 leading-relaxed">{label}</p>
			<p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground tabular-nums">
				<CountUp value={value} format={format} />
			</p>
			<div className="mt-2 h-8">
				<Sparkline data={spark} stroke={a.stroke} fillFrom={a.fillFrom} fillTo={a.fillTo} />
			</div>
		</motion.div>
	);
}

/** Animated count-up using motion's useMotionValue + animate. Renders the
 * formatted value via onUpdate → state (avoids MotionValue-as-child quirks
 * and keeps the displayed string locale-formatted). The formatter is held in
 * a ref so parent re-renders (which recreate the format closure) don't
 * re-trigger the animation — only an actual value change restarts it. */
function CountUp({ value, format }: { value: number; format: (v: number) => string }) {
	const mv = useMotionValue(0);
	const [display, setDisplay] = useState(() => format(0));
	const formatRef = useRef(format);
	formatRef.current = format;
	useEffect(() => {
		const controls = animate(mv, value, {
			duration: 1,
			ease: "easeOut",
			onUpdate: (v) => setDisplay(formatRef.current(v)),
		});
		return () => controls.stop();
	}, [mv, value]);
	return (
		<motion.span className="tabular-nums" suppressHydrationWarning>
			{display}
		</motion.span>
	);
}

/** Inline SVG sparkline — smoother & lighter than a recharts mini-chart and
 * doesn't depend on a ResponsiveContainer (so it can sit inside a 32px-tall
 * strip on a KPI card). */
function Sparkline({ data, stroke, fillFrom, fillTo }: { data: number[]; stroke: string; fillFrom: string; fillTo: string }) {
	const width = 120;
	const height = 32;
	const padding = 2;
	if (!data || data.length === 0) {
		return <div className="h-full w-full" />;
	}
	const min = Math.min(...data);
	const max = Math.max(...data);
	const range = max - min || 1;
	const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
	const points = data.map((v, i) => {
		const x = padding + i * stepX;
		const y = padding + (height - padding * 2) * (1 - (v - min) / range);
		return [x, y] as const;
	});
	const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
	const areaPath = `${linePath} L${points[points.length - 1][0].toFixed(2)},${height - padding} L${points[0][0].toFixed(2)},${height - padding} Z`;
	const gradId = `spark-${stroke.replace(/[^a-z0-9]/gi, "")}`;
	return (
		<svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-full" role="presentation">
			<title>Sparkline trend</title>
			<defs>
				<linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={fillFrom} />
					<stop offset="100%" stopColor={fillTo} />
				</linearGradient>
			</defs>
			<motion.path d={areaPath} fill={`url(#${gradId})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} />
			<motion.path
				d={linePath}
				fill="none"
				stroke={stroke}
				strokeWidth={1.8}
				strokeLinecap="round"
				strokeLinejoin="round"
				initial={{ pathLength: 0 }}
				animate={{ pathLength: 1 }}
				transition={{ duration: 0.9, ease: "easeInOut" }}
			/>
		</svg>
	);
}

function QuickActionsBar({ activeOrders }: { activeOrders: number }) {
	const actions = [
		{
			href: "/dashboard?tab=orders&subTab=requests",
			icon: ClipboardList,
			title: "New Order",
			subtitle: "Review requests",
			accent: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
		},
		{
			href: "/dashboard?tab=cashier",
			icon: Wallet,
			title: "Close Shift",
			subtitle: "Cashier Z-report",
			accent: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
		},
		{
			href: "/dashboard?tab=settings&subTab=inventory",
			icon: Package,
			title: "Add Inventory",
			subtitle: "Stock & suppliers",
			accent: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
		},
		{
			href: "/dashboard?tab=analytics",
			icon: BarChart3,
			title: "View Reports",
			subtitle: "Insights & trends",
			accent: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
		},
		{
			href: "/dashboard?tab=orders&subTab=active",
			icon: ChefHat,
			title: "Active Orders",
			subtitle: `${activeOrders} in progress`,
			accent: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
		},
		{
			href: "/dashboard?tab=campaigns",
			icon: Megaphone,
			title: "Campaign",
			subtitle: "WhatsApp blast",
			accent: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400",
		},
	] as const;
	return (
		<motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-background/80 backdrop-blur-md">
			<div className="flex gap-2 overflow-x-auto scrollbar-hide">
				{actions.map((action) => (
					<motion.div key={action.title} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="shrink-0">
						<Link
							href={action.href}
							className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border bg-card shadow-soft hover:shadow-soft-hover transition-all">
							<span className={`flex h-7 w-7 items-center justify-center rounded-lg ${action.accent}`}>
								<action.icon className="h-3.5 w-3.5" />
							</span>
							<div className="text-left">
								<p className="text-xs font-semibold text-foreground leading-tight">{action.title}</p>
								<p className="text-[10px] text-muted-foreground leading-tight">{action.subtitle}</p>
							</div>
						</Link>
					</motion.div>
				))}
			</div>
		</motion.div>
	);
}

function Heatmap({ grid, max }: { grid: number[][]; max: number }) {
	const [hover, setHover] = useState<{ day: number; hour: number; count: number } | null>(null);
	const colorFor = (count: number) => {
		if (count === 0) return "bg-muted/60";
		const ratio = count / max;
		if (ratio < 0.15) return "bg-violet-500/20";
		if (ratio < 0.35) return "bg-violet-500/40";
		if (ratio < 0.55) return "bg-violet-500/60";
		if (ratio < 0.75) return "bg-violet-500/80";
		return "bg-violet-500";
	};
	return (
		<div className="space-y-1">
			<div className="flex gap-1">
				<div className="w-8 shrink-0" />
				<div className="flex-1 grid gap-[2px]" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
					{HOUR_LABELS.map((h, i) => (
						<div key={h} className="text-[8px] text-muted-foreground text-center tabular-nums">
							{i % 3 === 0 ? h : ""}
						</div>
					))}
				</div>
			</div>
			{grid.map((row, day) => (
				<div key={day} className="flex gap-1 items-center">
					<div className="w-8 shrink-0 text-[10px] font-medium text-muted-foreground text-right pr-1">{WEEKDAY_LABELS[day]}</div>
					<div className="flex-1 grid gap-[2px]" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
						{row.map((count, hour) => (
							<motion.div
								key={`${day}-${hour}`}
								whileHover={{ scale: 1.25, zIndex: 10 }}
								transition={{ duration: 0.15 }}
								onMouseEnter={() => setHover({ day, hour, count })}
								onMouseLeave={() => setHover(null)}
								className={`relative aspect-square rounded-[3px] ${colorFor(count)} cursor-pointer`}
							/>
						))}
					</div>
				</div>
			))}
			<div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
				<div className="flex items-center gap-2 text-[10px] text-muted-foreground">
					<span>Less</span>
					<div className="flex gap-0.5">
						<span className="h-3 w-3 rounded-sm bg-muted/60" />
						<span className="h-3 w-3 rounded-sm bg-violet-500/20" />
						<span className="h-3 w-3 rounded-sm bg-violet-500/40" />
						<span className="h-3 w-3 rounded-sm bg-violet-500/60" />
						<span className="h-3 w-3 rounded-sm bg-violet-500/80" />
						<span className="h-3 w-3 rounded-sm bg-violet-500" />
					</div>
					<span>More</span>
				</div>
				<div className="text-[10px] text-muted-foreground">
					{hover ? (
						<span>
							<span className="font-semibold text-foreground">{hover.count}</span> orders · {WEEKDAY_LABELS[hover.day]} {HOUR_LABELS[hover.hour]}:00–
							{HOUR_LABELS[hover.hour]}:59
						</span>
					) : (
						<span>Hover a cell for details</span>
					)}
				</div>
			</div>
		</div>
	);
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
	return (
		<div className="flex flex-col items-center justify-center py-8 text-center gap-2">
			<div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>
			<p className="text-sm font-semibold text-foreground">{title}</p>
			<p className="text-xs text-muted-foreground max-w-xs">{subtitle}</p>
		</div>
	);
}

function OverviewSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-end justify-between flex-wrap gap-3">
				<div className="space-y-2">
					<div className="h-5 w-48 rounded-md bg-muted animate-pulse" />
					<div className="h-3 w-64 rounded-md bg-muted animate-pulse" />
				</div>
				<div className="h-8 w-40 rounded-full bg-muted animate-pulse" />
			</div>
			<div className="h-12 rounded-xl bg-muted animate-pulse" />
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
				))}
			</div>
			<div className="grid lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 h-72 rounded-2xl bg-muted animate-pulse" />
				<div className="h-72 rounded-2xl bg-muted animate-pulse" />
			</div>
			<div className="grid lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 h-72 rounded-2xl bg-muted animate-pulse" />
				<div className="h-72 rounded-2xl bg-muted animate-pulse" />
			</div>
			<div className="h-56 rounded-2xl bg-muted animate-pulse" />
		</div>
	);
}
