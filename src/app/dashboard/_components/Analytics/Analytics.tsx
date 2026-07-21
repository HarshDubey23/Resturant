"use client";

import { Bot, DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useAdmin } from "#components/context/useContext";
import { formatCurrency } from "#utils/helper/currency";

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
	aiCommentary: string[];
}

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof DollarSign; label: string; value: string; sub?: string }) {
	return (
		<div className="rounded-lg border p-4">
			<div className="flex items-center gap-2 text-muted-foreground mb-1">
				<Icon className="h-4 w-4" />
				<span className="text-xs">{label}</span>
			</div>
			<p className="text-2xl font-bold">{value}</p>
			{sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
		</div>
	);
}

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
	const pct = max > 0 ? (value / max) * 100 : 0;
	return (
		<div className="flex items-center gap-2 text-xs">
			<span className="w-8 text-right text-muted-foreground">{label}</span>
			<div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
				<div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
			</div>
			<span className="w-8 text-right font-medium">{value}</span>
		</div>
	);
}

export default function Analytics() {
	const [data, setData] = useState<AnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const { profile } = useAdmin();

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch("/api/admin/analytics");
				if (res.ok) setData(await res.json());
			} catch {
				/* ignore */
			} finally {
				setLoading(false);
			}
		};
		fetchData();
		const interval = setInterval(fetchData, 60000);
		return () => clearInterval(interval);
	}, []);

	if (loading) {
		return (
			<div className="flex justify-center py-12">
				<span className="text-muted-foreground">Loading analytics...</span>
			</div>
		);
	}

	if (!data) {
		return <div className="text-center py-12 text-muted-foreground">Unable to load analytics</div>;
	}

	const maxHour = Math.max(...data.peakHours.map((h) => h.count), 1);
	const currency = profile?.currency || "INR";

	return (
		<div className="space-y-6 max-w-4xl">
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<StatCard icon={DollarSign} label="Today Revenue" value={formatCurrency(data.live.todayRevenue, currency)} />
				<StatCard icon={ShoppingCart} label="Today Orders" value={data.live.todayOrders.toString()} sub={`${data.live.completedToday} completed`} />
				<StatCard icon={Users} label="Repeat Rate" value={`${data.live.repeatRate}%`} />
				<StatCard
					icon={TrendingUp}
					label="Avg Ticket"
					value={formatCurrency(data.live.avgTicket, currency)}
					sub={`GST: ${formatCurrency(data.live.gstCollected, currency)}`}
				/>
			</div>

			<div className="grid sm:grid-cols-2 gap-4">
				<div className="rounded-lg border p-4">
					<h3 className="text-sm font-medium mb-3">Revenue</h3>
					<div className="space-y-2">
						<Bar label="Today" value={data.live.todayRevenue} max={data.live.monthRevenue} />
						<Bar label="Week" value={data.live.weekRevenue} max={data.live.monthRevenue} />
						<Bar label="Month" value={data.live.monthRevenue} max={data.live.monthRevenue} />
					</div>
				</div>

				<div className="rounded-lg border p-4">
					<h3 className="text-sm font-medium mb-3">Top Dishes (30d)</h3>
					<div className="space-y-2">
						{data.topDishes.slice(0, 5).map((d) => (
							<Bar key={d.name} label={d.name.length > 12 ? `${d.name.slice(0, 12)}...` : d.name} value={d.count} max={data.topDishes[0]?.count || 1} />
						))}
						{data.topDishes.length === 0 && <p className="text-xs text-muted-foreground">No data yet</p>}
					</div>
				</div>
			</div>

			<div className="grid sm:grid-cols-2 gap-4">
				<div className="rounded-lg border p-4">
					<h3 className="text-sm font-medium mb-3">Peak Hours (30d)</h3>
					<div className="space-y-1">
						{data.peakHours.map((h) => (
							<Bar key={h.hour} label={`${h.hour}:00`} value={h.count} max={maxHour} />
						))}
					</div>
				</div>

				<div className="rounded-lg border p-4">
					<h3 className="text-sm font-medium mb-3">Top Customers (LTV)</h3>
					<div className="space-y-2">
						{data.topCustomers.slice(0, 10).map((c, i) => (
							<div key={i} className="flex items-center justify-between text-xs">
								<span className="truncate flex-1">{c.name}</span>
								<span className="text-muted-foreground mx-2">{c.orders} orders</span>
								<span className="font-medium">{formatCurrency(c.total, currency)}</span>
							</div>
						))}
						{data.topCustomers.length === 0 && <p className="text-xs text-muted-foreground">No data yet</p>}
					</div>
				</div>
			</div>

			{data.aiCommentary.length > 0 && (
				<div className="rounded-lg border p-4 bg-muted/30">
					<div className="flex items-center gap-2 mb-2">
						<Bot className="h-4 w-4 text-muted-foreground" />
						<h3 className="text-sm font-medium">AI Insights</h3>
					</div>
					<ul className="space-y-1">
						{data.aiCommentary.map((c, i) => (
							<li key={i} className="text-xs text-muted-foreground">
								{c}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
