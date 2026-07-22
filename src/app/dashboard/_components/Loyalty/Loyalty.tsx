"use client";

import { Award, Crown, Gem, Loader2, type Star, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface LoyaltyEntry {
	_id: string;
	customer: { fname: string; lname: string; phone: string };
	points: number;
	lifetimePoints: number;
	tier: string;
	visitCount: number;
	lastVisit: string;
}

const TIER_CONFIG: Record<string, { icon: typeof Star; color: string; bg: string }> = {
	platinum: { icon: Crown, color: "text-purple-500", bg: "bg-purple-100" },
	gold: { icon: Gem, color: "text-yellow-500", bg: "bg-yellow-100" },
	silver: { icon: Award, color: "text-gray-500", bg: "bg-gray-100" },
};

export default function Loyalty() {
	const [customers, setCustomers] = useState<LoyaltyEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [sortBy, setSortBy] = useState<"points" | "visits">("points");

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch("/api/loyalty?sort=top");
				if (res.ok) setCustomers(await res.json());
			} catch {
				/* ignore */
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	const sorted = [...customers].sort((a, b) => (sortBy === "points" ? b.lifetimePoints - a.lifetimePoints : b.visitCount - a.visitCount));

	const stats = {
		total: customers.length,
		platinum: customers.filter((c) => c.tier === "platinum").length,
		gold: customers.filter((c) => c.tier === "gold").length,
		silver: customers.filter((c) => c.tier === "silver").length,
	};

	return (
		<div className="space-y-6 max-w-3xl">
			<div className="grid grid-cols-4 gap-3">
				<div className="rounded-lg border p-3 text-center">
					<p className="text-2xl font-bold">{stats.total}</p>
					<p className="text-xs text-muted-foreground">Total</p>
				</div>
				<div className="rounded-lg border p-3 text-center">
					<p className="text-2xl font-bold text-purple-600">{stats.platinum}</p>
					<p className="text-xs text-muted-foreground">Platinum</p>
				</div>
				<div className="rounded-lg border p-3 text-center">
					<p className="text-2xl font-bold text-yellow-600">{stats.gold}</p>
					<p className="text-xs text-muted-foreground">Gold</p>
				</div>
				<div className="rounded-lg border p-3 text-center">
					<p className="text-2xl font-bold text-gray-600">{stats.silver}</p>
					<p className="text-xs text-muted-foreground">Silver</p>
				</div>
			</div>

			<div className="flex items-center gap-2">
				<TrendingUp className="h-4 w-4 text-muted-foreground" />
				<button
					type="button"
					onClick={() => setSortBy("points")}
					className={`text-xs px-2 py-1 rounded ${sortBy === "points" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
					By Points
				</button>
				<button
					type="button"
					onClick={() => setSortBy("visits")}
					className={`text-xs px-2 py-1 rounded ${sortBy === "visits" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
					By Visits
				</button>
			</div>

			{loading ? (
				<div className="flex justify-center py-8">
					<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
				</div>
			) : sorted.length === 0 ? (
				<p className="text-sm text-muted-foreground py-8 text-center">No loyalty data yet</p>
			) : (
				<div className="space-y-2">
					{sorted.map((c, i) => {
						const tier = TIER_CONFIG[c.tier] || TIER_CONFIG.silver;
						const TierIcon = tier.icon;
						return (
							<div key={c._id} className="flex items-center gap-3 rounded-lg border p-3">
								<span className="w-6 text-center text-sm font-bold text-muted-foreground">#{i + 1}</span>
								<div className={`rounded-full p-1.5 ${tier.bg}`}>
									<TierIcon className={`h-4 w-4 ${tier.color}`} />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">
										{c.customer?.fname} {c.customer?.lname}
									</p>
									<p className="text-xs text-muted-foreground">{c.customer?.phone}</p>
								</div>
								<div className="text-right">
									<p className="text-sm font-bold">{c.lifetimePoints.toLocaleString()}</p>
									<p className="text-xs text-muted-foreground">{c.visitCount} visits</p>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
