"use client";

import { AlertCircle, Bell, BellOff, Check, CheckCircle2, ChefHat, Clock, Maximize2, Minimize2, Printer, TrendingUp, Utensils, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { formatCurrency } from "@/utils/helper/currency";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ProductData = {
	_id?: string;
	name?: string;
	description?: string;
	quantity: number;
	price: number;
	tax: number;
	veg?: string;
	foodType?: string;
	kitchenStatus: "pending" | "preparing" | "ready" | "served";
	fulfilled: boolean;
	station?: string;
};

type KitchenOrder = {
	_id: string;
	restaurantID: string;
	table: string;
	state: string;
	customer?: { fname?: string; lname?: string; phone?: string };
	products: ProductData[];
	createdAt: string;
	updatedAt?: string;
};

/** Column classification — an order lives in the column of its LEAST-advanced
 * item so each order appears in exactly one column (kanban mental model). */
type ColumnKey = "pending" | "preparing" | "ready" | "served";

const COLUMNS: Array<{
	key: ColumnKey;
	label: string;
	subtitle: string;
	headerClass: string;
	headerActiveClass: string;
	dotClass: string;
	emptyIcon: typeof Bell;
	emptyTitle: string;
	emptySubtitle: string;
}> = [
	{
		key: "pending",
		label: "New Orders",
		subtitle: "Awaiting start",
		headerClass: "bg-red-500/15 text-red-400 border-red-500/30",
		headerActiveClass: "bg-red-500 text-white border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]",
		dotClass: "bg-red-500",
		emptyIcon: Bell,
		emptyTitle: "No new orders",
		emptySubtitle: "All caught up — tickets appear here the moment customers place them.",
	},
	{
		key: "preparing",
		label: "Preparing",
		subtitle: "In the kitchen",
		headerClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
		headerActiveClass: "bg-amber-500 text-white border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.55)]",
		dotClass: "bg-amber-500",
		emptyIcon: ChefHat,
		emptyTitle: "Nothing cooking",
		emptySubtitle: "When a chef hits Start on a ticket, it lands here with a live timer.",
	},
	{
		key: "ready",
		label: "Ready",
		subtitle: "For the server",
		headerClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
		headerActiveClass: "bg-emerald-500 text-white border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.55)]",
		dotClass: "bg-emerald-500",
		emptyIcon: CheckCircle2,
		emptyTitle: "No plates waiting",
		emptySubtitle: "Marked-ready items show here so servers know what to run.",
	},
	{
		key: "served",
		label: "Served",
		subtitle: "Out to table",
		headerClass: "bg-slate-500/15 text-slate-300 border-slate-500/30",
		headerActiveClass: "bg-slate-500 text-white border-slate-500",
		dotClass: "bg-slate-500",
		emptyIcon: Utensils,
		emptyTitle: "No serves yet",
		emptySubtitle: "Completed tickets collect here for the shift.",
	},
];

/**
 * Kitchen stations. Each station sees only the items assigned to it, so a
 * barista at the "bar" station doesn't have to scan past tandoor tickets.
 * "All stations" is the default so the head chef can see everything.
 */
const STATION_FILTERS = [
	{ value: "all", label: "All Stations", icon: "🍳" },
	{ value: "main", label: "Main Kitchen", icon: "🍲" },
	{ value: "grill", label: "Grill / Tandoor", icon: "🔥" },
	{ value: "bar", label: "Bar / Beverages", icon: "🥤" },
	{ value: "pastry", label: "Pastry / Desserts", icon: "🍰" },
] as const;

/** Per-station icon for the inline badge on each product ticket. */
const STATION_ICON: Record<string, string> = {
	main: "🍲",
	grill: "🔥",
	bar: "🥤",
	pastry: "🍰",
};

/** Card border + accent per station so a chef can spot their station's tickets
 * from across the kitchen. */
const STATION_BORDER: Record<string, string> = {
	main: "border-l-violet-500",
	grill: "border-l-amber-500",
	bar: "border-l-sky-500",
	pastry: "border-l-fuchsia-500",
};

const STATION_BADGE: Record<string, string> = {
	main: "bg-violet-500/15 text-violet-300 border-violet-500/30",
	grill: "bg-amber-500/15 text-amber-300 border-amber-500/30",
	bar: "bg-sky-500/15 text-sky-300 border-sky-500/30",
	pastry: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
};

const SPICE_EMOJIS: Record<string, string> = {
	mild: "🟢",
	medium: "🟡",
	hot: "🟠",
	"extra-hot": "🔴",
};

const SPICE_LABELS: Record<string, string> = {
	mild: "Mild",
	medium: "Medium",
	hot: "Hot",
	"extra-hot": "Extra Hot",
};

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
	{ keywords: ["fried rice", "rice", "pulao"], src: "/food-images/dishes/veg-fried-rice.png" },
	{ keywords: ["puri", "pani puri", "golgappa"], src: "/food-images/dishes/pani-puri.png" },
	{ keywords: ["jalebi", "imarti"], src: "/food-images/dishes/jalebi.png" },
];

function getDishImage(name: string): string {
	const n = (name || "").toLowerCase();
	for (const entry of DISH_IMAGE_MAP) {
		if (entry.keywords.some((k) => n.includes(k))) return entry.src;
	}
	return "";
}

function playNewOrderSound() {
	try {
		const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

		const playTone = (freq: number, startTime: number, duration: number) => {
			const osc = audioCtx.createOscillator();
			const gain = audioCtx.createGain();
			osc.connect(gain);
			gain.connect(audioCtx.destination);
			osc.frequency.setValueAtTime(freq, startTime);
			gain.gain.setValueAtTime(0.4, startTime);
			gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
			osc.start(startTime);
			osc.stop(startTime + duration);
		};

		playTone(800, audioCtx.currentTime, 0.3);
		playTone(1000, audioCtx.currentTime + 0.25, 0.3);
		playTone(1200, audioCtx.currentTime + 0.5, 0.4);
	} catch {
		// Audio not available
	}
}

function formatTime(seconds: number) {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTimeLong(seconds: number) {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	if (h > 0) return `${h}h ${m}m ${s}s`;
	return `${m}m ${s}s`;
}

function getUrgency(seconds: number): { color: string; bg: string; pulse: boolean; label: string } {
	if (seconds < 300) return { color: "text-emerald-400", bg: "bg-emerald-500/10", pulse: false, label: "Fresh" };
	if (seconds < 600) return { color: "text-amber-400", bg: "bg-amber-500/10", pulse: false, label: "Working" };
	if (seconds < 900) return { color: "text-orange-400", bg: "bg-orange-500/10", pulse: false, label: "Urgent" };
	return { color: "text-red-400", bg: "bg-red-500/15", pulse: true, label: "Critical" };
}

function classifyOrder(order: KitchenOrder): ColumnKey {
	const statuses = order.products.map((p) => p.kitchenStatus);
	if (statuses.includes("pending")) return "pending";
	if (statuses.includes("preparing")) return "preparing";
	if (statuses.includes("ready")) return "ready";
	return "served";
}

export default function KitchenPage() {
	const { status } = useSession();
	const [orders, setOrders] = useState<KitchenOrder[]>([]);
	const restaurantID = orders[0]?.restaurantID;
	const { data: restaurantData } = useSWR<{ profile?: { currency?: string; name?: string; logoUrl?: string; avatar?: string } }>(
		restaurantID ? `/api/menu?id=${restaurantID}` : null,
		fetcher,
	);
	const currency = restaurantData?.profile?.currency || "INR";
	const restaurantName = restaurantData?.profile?.name || "Kitchen";
	const restaurantLogo = restaurantData?.profile?.logoUrl || restaurantData?.profile?.avatar || "/food-images/ambiance/chef-cooking.png";

	const [stationFilter, setStationFilter] = useState<string>("all");
	const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [audioEnabled, setAudioEnabled] = useState(true);
	const [mobileTab, setMobileTab] = useState<ColumnKey>("pending");
	const [connectionState, setConnectionState] = useState<"connected" | "connecting" | "reconnecting">("connecting");
	const [_tick, setTick] = useState(0);
	const [now, setNow] = useState<Date>(() => new Date());
	const eventSourceRef = useRef<EventSource | null>(null);
	const previousOrderIdsRef = useRef<Set<string>>(new Set());
	const prevOrdersLength = useRef(0);

	// Refs that the SSE effect reads (it only re-mounts on `status`, so any
	// later state change must be visible via a ref to take effect inside it).
	const audioEnabledRef = useRef(audioEnabled);
	audioEnabledRef.current = audioEnabled;

	// Timer tick every second — drives the elapsed timers AND the live clock.
	useEffect(() => {
		const timer = setInterval(() => {
			setTick((t) => t + 1);
			setNow(new Date());
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	// SSE stream with automatic reconnection (exponential backoff, max 30s).
	// Restaurant Wi-Fi is unreliable; previously a dropped connection silently
	// stopped order updates until someone noticed and refreshed. The stream
	// resends a full snapshot on connect, so a reconnect recovers everything.
	useEffect(() => {
		if (status !== "authenticated") return;

		let retryCount = 0;
		let retryTimer: ReturnType<typeof setTimeout> | null = null;
		let disposed = false;

		const connect = () => {
			if (disposed) return;
			const es = new EventSource("/api/order/stream");
			eventSourceRef.current = es;

			es.onopen = () => {
				retryCount = 0;
				setConnectionState("connected");
			};

			es.addEventListener("order", (event) => {
				try {
					const { data } = JSON.parse(event.data) as { data?: { type: string; data: KitchenOrder[] } };
					if (data?.type === "orders" && Array.isArray(data?.data)) {
						const activeOrders = data.data.filter((o) => o.state === "active");
						setOrders(activeOrders);

						const currentIds = new Set(activeOrders.map((o) => o._id));
						if (prevOrdersLength.current > 0 && currentIds.size > previousOrderIdsRef.current.size) {
							if (audioEnabledRef.current) playNewOrderSound();
							const newIds = new Set<string>();
							currentIds.forEach((id) => {
								if (!previousOrderIdsRef.current.has(id)) newIds.add(id);
							});
							setNewOrderIds(newIds);
							setTimeout(() => setNewOrderIds(new Set()), 5000);
						}
						previousOrderIdsRef.current = currentIds;
						prevOrdersLength.current = activeOrders.length;
					}
				} catch {
					// parse error
				}
			});

			es.onerror = () => {
				es.close();
				eventSourceRef.current = null;
				if (disposed) return;
				setConnectionState("reconnecting");
				const delay = Math.min(1000 * 2 ** retryCount, 30000);
				retryCount += 1;
				retryTimer = setTimeout(connect, delay);
			};
		};

		connect();

		return () => {
			disposed = true;
			if (retryTimer) clearTimeout(retryTimer);
			eventSourceRef.current?.close();
			eventSourceRef.current = null;
		};
	}, [status]);

	const handleAction = useCallback(async (orderId: string, productId: string, action: "preparing" | "ready" | "served") => {
		try {
			const res = await fetch("/api/kitchen/action", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderId, productId, action }),
			});
			if (!res.ok) {
				const data = await res.json();
				toast.error(data?.message || "Action failed");
			}
		} catch {
			toast.error("Failed to update order");
		}
	}, []);

	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch(() => {});
			setIsFullscreen(true);
		} else {
			document.exitFullscreen().catch(() => {});
			setIsFullscreen(false);
		}
	};

	const toggleAudio = () => {
		setAudioEnabled((prev) => {
			const next = !prev;
			if (next) {
				// Play a soft confirmation chirp so the operator knows audio is
				// wired up — no surprise during a real dinner rush.
				playNewOrderSound();
			}
			return next;
		});
	};

	// Apply station filter to each order's product list, then drop orders that
	// have zero visible products after the filter.
	const filteredOrders = useMemo(() => {
		return orders
			.map((o) => ({
				...o,
				products: stationFilter === "all" ? o.products : o.products.filter((p) => (p.station || "main") === stationFilter),
			}))
			.filter((o) => o.products.length > 0);
	}, [orders, stationFilter]);

	// Bin orders into the 4 kanban columns.
	const columns = useMemo(() => {
		const bins: Record<ColumnKey, KitchenOrder[]> = { pending: [], preparing: [], ready: [], served: [] };
		for (const o of filteredOrders) {
			bins[classifyOrder(o)].push(o);
		}
		// Sort each column: oldest first (longest-waiting at the top).
		for (const k of Object.keys(bins) as ColumnKey[]) {
			bins[k].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
		}
		return bins;
	}, [filteredOrders]);

	// Live stats footer metrics — all derived from the active order set so they
	// tick alongside the second-hand without an extra fetch.
	const stats = useMemo(() => {
		const nowMs = Date.now();
		const preparingAges = columns.preparing.map((o) => Math.floor((nowMs - new Date(o.createdAt).getTime()) / 1000));
		const avgPrepSec = preparingAges.length > 0 ? Math.floor(preparingAges.reduce((a, b) => a + b, 0) / preparingAges.length) : 0;
		const allAges = filteredOrders.map((o) => Math.floor((nowMs - new Date(o.createdAt).getTime()) / 1000));
		const longestWaitSec = allAges.length > 0 ? Math.max(...allAges) : 0;
		const ordersLastHour = filteredOrders.filter((o) => nowMs - new Date(o.createdAt).getTime() < 3600000).length;
		return { avgPrepSec, longestWaitSec, ordersLastHour, total: filteredOrders.length };
	}, [columns, filteredOrders]);

	// Station summary counts for the header.
	const stationCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		for (const o of orders) {
			for (const p of o.products) {
				if (p.kitchenStatus === "served") continue;
				const s = p.station || "main";
				counts[s] = (counts[s] || 0) + 1;
			}
		}
		return counts;
	}, [orders]);

	// Auto-switch mobile tab to a column that has tickets when the current
	// tab is empty (e.g., the last "preparing" ticket gets marked ready →
	// switch to "ready" so the chef sees what to plate next).
	useEffect(() => {
		if (columns[mobileTab].length > 0) return;
		const nextWithItems = (["pending", "preparing", "ready", "served"] as ColumnKey[]).find((k) => columns[k].length > 0);
		if (nextWithItems) setMobileTab(nextWithItems);
	}, [columns, mobileTab]);

	const flashNew = newOrderIds.size > 0 && columns.pending.length > 0;

	if (status === "loading") {
		return (
			<div className="dark min-h-screen bg-background flex items-center justify-center text-foreground">
				<div className="text-center">
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 0.5 }}
						className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 mb-4">
						<ChefHat className="h-10 w-10 text-primary" />
					</motion.div>
					<p className="text-lg font-semibold">Loading kitchen display…</p>
					<p className="text-xs text-muted-foreground mt-1">Waking up the burners</p>
				</div>
			</div>
		);
	}

	if (status === "unauthenticated") {
		return (
			<div className="dark min-h-screen bg-background flex flex-col items-center justify-center text-foreground gap-4">
				<div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/15">
					<AlertCircle className="h-10 w-10 text-destructive" />
				</div>
				<p className="text-lg font-semibold">Please log in to access the kitchen display.</p>
				<a href="/" className="text-primary hover:underline text-sm">
					Go to Login
				</a>
			</div>
		);
	}

	return (
		<div className="dark min-h-screen bg-background text-foreground flex flex-col">
			{/* Header bar — dark gradient with kitchen-team texture */}
			<header className="sticky top-0 z-30 border-b border-border bg-gradient-to-r from-background via-background to-card/95 backdrop-blur-md">
				<div className="absolute inset-0 pointer-events-none opacity-[0.05]" aria-hidden>
					<Image src="/food-images/ambiance/kitchen-team.png" alt="" fill sizes="100vw" className="object-cover" />
				</div>

				<div className="relative flex items-center justify-between px-4 sm:px-6 h-16 gap-3">
					{/* Left: logo + restaurant name + counts */}
					<div className="flex items-center gap-3 min-w-0">
						<div className="relative shrink-0">
							<div className="relative h-10 w-10 rounded-xl overflow-hidden border border-border bg-card">
								<Image src={restaurantLogo} alt={restaurantName} fill sizes="40px" className="object-cover" unoptimized />
							</div>
							{stats.total > 0 && (
								<span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center border-2 border-background">
									{stats.total}
								</span>
							)}
						</div>
						<div className="min-w-0">
							<h1 className="text-base sm:text-lg font-bold tracking-tight truncate">{restaurantName}</h1>
							<p className="text-[11px] text-muted-foreground">
								Kitchen Display · {columns.pending.length} new · {columns.preparing.length} cooking · {columns.ready.length} ready
							</p>
						</div>
					</div>

					{/* Center: live clock (hidden on small screens) */}
					<div className="hidden md:flex flex-col items-center px-4 py-1 rounded-xl bg-card border border-border">
						<div className="flex items-center gap-2">
							<Clock className="h-3.5 w-3.5 text-primary" />
							<span className="text-lg font-bold tabular-nums tracking-tight">
								{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
							</span>
						</div>
						<span className="text-[10px] text-muted-foreground">{now.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}</span>
					</div>

					{/* Right: connection + audio + fullscreen */}
					<div className="flex items-center gap-2 shrink-0">
						{connectionState === "connected" ? (
							<span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/15" title="Live">
								<span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
								<span className="text-[10px] font-medium text-emerald-400 hidden sm:inline">Live</span>
							</span>
						) : (
							<span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-destructive/15" title="Connection lost — reconnecting">
								<span className="h-2 w-2 rounded-full bg-destructive animate-ping" />
								<span className="text-[10px] font-medium text-destructive hidden sm:inline">Reconnecting…</span>
							</span>
						)}
						<motion.button
							type="button"
							whileTap={{ scale: 0.92 }}
							onClick={toggleAudio}
							className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${
								audioEnabled ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
							}`}
							aria-label={audioEnabled ? "Disable new-order sound" : "Enable new-order sound"}
							aria-pressed={audioEnabled}>
							{audioEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
						</motion.button>
						<motion.button
							type="button"
							whileTap={{ scale: 0.92 }}
							onClick={toggleFullscreen}
							className="h-9 w-9 rounded-lg flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground transition-colors"
							aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
							{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
						</motion.button>
					</div>
				</div>

				{/* Station filter row */}
				<div className="relative flex gap-1.5 px-4 sm:px-6 pb-3 overflow-x-auto scrollbar-hide">
					{STATION_FILTERS.map((s) => {
						const count = s.value === "all" ? null : (stationCounts[s.value] ?? 0);
						const active = stationFilter === s.value;
						return (
							<button
								key={s.value}
								type="button"
								onClick={() => setStationFilter(s.value)}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
									active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground border border-border"
								}`}
								title={s.label}>
								<span>{s.icon}</span>
								<span className="hidden sm:inline">{s.label}</span>
								<span className="sm:hidden">{s.label.split(" ")[0]}</span>
								{count !== null && count > 0 && (
									<span
										className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? "bg-primary-foreground/20" : "bg-primary/20 text-primary"}`}>
										{count}
									</span>
								)}
							</button>
						);
					})}
				</div>

				{/* Mobile tab row — visible only on small screens */}
				<div className="relative flex gap-1 px-4 sm:px-6 pb-3 sm:hidden border-t border-border pt-3">
					{COLUMNS.map((col) => {
						const count = columns[col.key].length;
						const active = mobileTab === col.key;
						return (
							<button
								key={col.key}
								type="button"
								onClick={() => setMobileTab(col.key)}
								className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
									active ? "bg-card text-foreground border border-border" : "text-muted-foreground"
								}`}>
								<span className="flex items-center gap-1">
									<span className={`h-1.5 w-1.5 rounded-full ${col.dotClass}`} />
									{col.label}
								</span>
								<span className="text-[10px] tabular-nums">{count}</span>
							</button>
						);
					})}
				</div>
			</header>

			{/* Main content — 4 columns on desktop, single column with tabs on mobile */}
			<main className="flex-1 p-4 sm:p-6 overflow-hidden">
				<div className="grid gap-4 lg:grid-cols-4 h-full">
					{COLUMNS.map((col) => {
						const colOrders = columns[col.key];
						const isMobileVisible = mobileTab === col.key;
						return (
							<section key={col.key} className={`flex flex-col min-h-0 ${isMobileVisible ? "flex" : "hidden"} lg:flex`}>
								{/* Column header — flashes when a new order lands in New */}
								<motion.div
									animate={
										col.key === "pending" && flashNew
											? { boxShadow: ["0 0 0px rgba(239,68,68,0)", "0 0 30px rgba(239,68,68,0.7)", "0 0 0px rgba(239,68,68,0)"] }
											: { boxShadow: "0 0 0px rgba(0,0,0,0)" }
									}
									transition={col.key === "pending" && flashNew ? { duration: 0.9, repeat: 3 } : { duration: 0.2 }}
									className={`flex items-center justify-between px-3 py-2 rounded-xl border mb-3 ${
										col.key === "pending" && flashNew ? col.headerActiveClass : col.headerClass
									}`}>
									<div className="flex items-center gap-2">
										<span className={`h-2 w-2 rounded-full ${col.dotClass} ${col.key === "pending" && flashNew ? "animate-ping" : ""}`} />
										<div>
											<p className="text-sm font-bold tracking-tight leading-tight">{col.label}</p>
											<p className="text-[10px] opacity-80 leading-tight">{col.subtitle}</p>
										</div>
									</div>
									<span className="text-lg font-bold tabular-nums">{colOrders.length}</span>
								</motion.div>

								{/* Scrollable card list */}
								<div className="flex-1 overflow-y-auto pr-1 -mr-1 kds-scrollbar min-h-0" style={{ scrollbarWidth: "thin" }}>
									{colOrders.length === 0 ? (
										<ColumnEmpty icon={col.emptyIcon} title={col.emptyTitle} subtitle={col.emptySubtitle} />
									) : (
										<AnimatePresence mode="popLayout">
											{colOrders.map((order) => (
												<OrderCard key={order._id} order={order} currency={currency} isNew={newOrderIds.has(order._id)} onAction={handleAction} />
											))}
										</AnimatePresence>
									)}
								</div>
							</section>
						);
					})}
				</div>
			</main>

			{/* Stats footer */}
			<footer className="border-t border-border bg-card/80 backdrop-blur-md">
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 sm:px-6 py-3">
					<StatPill icon={<Clock className="h-3.5 w-3.5" />} label="Avg prep time" value={formatTimeLong(stats.avgPrepSec)} accent="text-amber-400" />
					<StatPill icon={<Zap className="h-3.5 w-3.5" />} label="Orders / hr" value={String(stats.ordersLastHour)} accent="text-sky-400" />
					<StatPill
						icon={<TrendingUp className="h-3.5 w-3.5" />}
						label="Longest wait"
						value={formatTimeLong(stats.longestWaitSec)}
						accent={stats.longestWaitSec >= 900 ? "text-red-400" : "text-emerald-400"}
					/>
					<StatPill icon={<ChefHat className="h-3.5 w-3.5" />} label="Open tickets" value={String(stats.total)} accent="text-primary" />
				</div>
			</footer>
		</div>
	);
}

/* ------------------------------ Sub-components ----------------------------- */

function OrderCard({
	order,
	currency,
	isNew,
	onAction,
}: {
	order: KitchenOrder;
	currency: string;
	isNew: boolean;
	onAction: (orderId: string, productId: string, action: "preparing" | "ready" | "served") => void;
}) {
	const elapsed = Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000));
	const urgency = getUrgency(elapsed);
	const customerName = order.customer?.fname ? `${order.customer.fname} ${order.customer.lname || ""}`.trim() : "";
	// Pick the first product's station as the card's accent. If items span
	// multiple stations, individual product rows still show their own badge.
	const primaryStation = order.products[0]?.station || "main";
	const stationBorder = STATION_BORDER[primaryStation] || "border-l-violet-500";

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: -24, scale: 0.95 }}
			animate={{
				opacity: 1,
				y: 0,
				scale: 1,
			}}
			exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
			transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
			className={`rounded-xl border border-border border-l-4 ${stationBorder} bg-card overflow-hidden mb-3 ${urgency.bg} ${urgency.pulse ? "ring-1 ring-red-500/40" : ""} ${isNew ? "shadow-[0_0_25px_rgba(124,58,237,0.45)]" : "shadow-soft"}`}>
			{/* Card header — table #, order #, elapsed timer */}
			<div className={`flex items-center justify-between p-3 border-b border-border ${isNew ? "bg-primary/10" : "bg-card/60"}`}>
				<div className="min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<span className="text-xl font-bold tracking-tight">Table {order.table}</span>
						<span className="font-mono text-[10px] text-muted-foreground">#{order._id.slice(-6)}</span>
					</div>
					{customerName && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{customerName}</p>}
				</div>
				<div className="flex flex-col items-end shrink-0">
					<div className={`font-mono text-2xl font-bold tabular-nums leading-none ${urgency.color} ${urgency.pulse ? "animate-pulse" : ""}`}>
						{formatTime(elapsed)}
					</div>
					<span className={`text-[9px] uppercase tracking-wider font-semibold mt-0.5 ${urgency.color}`}>{urgency.label}</span>
				</div>
			</div>

			{/* Item list */}
			<div className="divide-y divide-border">
				{order.products.map((product) => {
					const productKey = product._id || `${product.name}-${Math.random()}`;
					const dishImg = getDishImage(product.name || "");
					const productStation = product.station || "main";
					const stationBadgeClass = STATION_BADGE[productStation] || STATION_BADGE.main;
					return (
						<div key={productKey} className="p-3 space-y-2">
							<div className="flex items-start gap-2.5">
								{/* Dish thumbnail (or fallback icon) */}
								<div className="relative h-9 w-9 shrink-0 rounded-lg overflow-hidden border border-border bg-muted">
									{dishImg ? (
										<Image src={dishImg} alt={product.name || "dish"} fill sizes="36px" className="object-cover" />
									) : (
										<div className="flex h-full w-full items-center justify-center">
											<Utensils className="h-4 w-4 text-muted-foreground" />
										</div>
									)}
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-1.5 flex-wrap">
										<span className="text-[10px] shrink-0">{product.veg === "veg" ? "🟢" : product.veg === "non-veg" ? "🔴" : "🟡"}</span>
										<span className="text-sm font-semibold truncate">{product.name || "Item"}</span>
										<span className="text-xs text-muted-foreground shrink-0 tabular-nums">×{product.quantity}</span>
										<span className={`text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 ${stationBadgeClass}`}>
											{STATION_ICON[productStation] ?? "🍳"} {productStation}
										</span>
									</div>
									<div className="flex items-center justify-between mt-0.5">
										{product.foodType && SPICE_EMOJIS[product.foodType] ? (
											<span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
												<span>{SPICE_EMOJIS[product.foodType]}</span>
												<span>{SPICE_LABELS[product.foodType]}</span>
											</span>
										) : (
											<span />
										)}
										<span className="text-[10px] text-muted-foreground tabular-nums">{formatCurrency(product.price, currency)}</span>
									</div>
									{product.description && (
										<p className="text-[11px] text-primary/80 bg-primary/10 rounded px-2 py-1 leading-relaxed mt-1">📝 {product.description}</p>
									)}
								</div>
							</div>

							{/* Action button — large touch target, color-coded */}
							<ProductActionButton product={product} orderId={order._id} productId={productKey} onAction={onAction} />
						</div>
					);
				})}
			</div>

			{/* Card footer — print + arrival time */}
			<div className="px-3 py-2 border-t border-border flex items-center justify-between gap-2 bg-card/40">
				<button
					type="button"
					onClick={() => window.print()}
					className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
					<Printer className="h-3 w-3" /> Print ticket
				</button>
				<span className="text-[10px] text-muted-foreground tabular-nums">
					Arrived {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
				</span>
			</div>
		</motion.div>
	);
}

function ProductActionButton({
	product,
	orderId,
	productId,
	onAction,
}: {
	product: ProductData;
	orderId: string;
	productId: string;
	onAction: (orderId: string, productId: string, action: "preparing" | "ready" | "served") => void;
}) {
	if (product.kitchenStatus === "pending") {
		return (
			<motion.button
				type="button"
				whileTap={{ scale: 0.96 }}
				whileHover={{ scale: 1.01 }}
				onClick={() => onAction(orderId, productId, "preparing")}
				className="w-full px-3 py-2.5 text-sm font-bold rounded-lg bg-amber-500 text-white hover:bg-amber-400 transition-colors min-h-[44px] shadow-[0_4px_14px_rgba(245,158,11,0.35)]">
				▶ Start Cooking
			</motion.button>
		);
	}
	if (product.kitchenStatus === "preparing") {
		return (
			<motion.button
				type="button"
				whileTap={{ scale: 0.96 }}
				whileHover={{ scale: 1.01 }}
				onClick={() => onAction(orderId, productId, "ready")}
				className="w-full px-3 py-2.5 text-sm font-bold rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 transition-colors min-h-[44px] shadow-[0_4px_14px_rgba(16,185,129,0.35)]">
				<Check className="inline h-4 w-4 mr-1" /> Mark Ready
			</motion.button>
		);
	}
	if (product.kitchenStatus === "ready") {
		return (
			<motion.button
				type="button"
				whileTap={{ scale: 0.96 }}
				whileHover={{ scale: 1.01 }}
				onClick={() => onAction(orderId, productId, "served")}
				className="w-full px-3 py-2.5 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px] shadow-[0_4px_14px_rgba(124,58,237,0.35)]">
				<Utensils className="inline h-4 w-4 mr-1" /> Mark Served
			</motion.button>
		);
	}
	return (
		<div className="w-full px-3 py-2.5 text-sm font-bold rounded-lg bg-muted text-muted-foreground text-center min-h-[44px] flex items-center justify-center gap-1">
			<CheckCircle2 className="h-4 w-4" /> Served
		</div>
	);
}

function ColumnEmpty({ icon: Icon, title, subtitle }: { icon: typeof Bell; title: string; subtitle: string }) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			className="flex flex-col items-center justify-center py-10 text-center gap-2 border border-dashed border-border rounded-xl m-1">
			<div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
				<Icon className="h-7 w-7" />
			</div>
			<p className="text-sm font-semibold text-foreground">{title}</p>
			<p className="text-[11px] text-muted-foreground max-w-[200px] leading-relaxed">{subtitle}</p>
		</motion.div>
	);
}

function StatPill({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
	return (
		<div className="flex items-center gap-2">
			<span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-muted ${accent}`}>{icon}</span>
			<div className="min-w-0">
				<p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-tight">{label}</p>
				<p className="text-sm font-bold text-foreground tabular-nums leading-tight truncate">{value}</p>
			</div>
		</div>
	);
}
