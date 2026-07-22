"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
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

const STATUS_FILTERS = [
	{ value: "all", label: "All", color: "bg-gray-600" },
	{ value: "pending", label: "New", color: "bg-red-500" },
	{ value: "preparing", label: "In Progress", color: "bg-yellow-500" },
	{ value: "ready", label: "Ready", color: "bg-green-500" },
] as const;

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

function getUrgency(seconds: number): { color: string; bg: string; pulse: boolean } {
	if (seconds < 300) return { color: "text-green-400", bg: "bg-green-900/30", pulse: false };
	if (seconds < 600) return { color: "text-yellow-400", bg: "bg-yellow-900/30", pulse: false };
	if (seconds < 900) return { color: "text-orange-400", bg: "bg-orange-900/30", pulse: false };
	return { color: "text-red-400", bg: "bg-red-900/30", pulse: true };
}

export default function KitchenPage() {
	const { status } = useSession();
	const [orders, setOrders] = useState<KitchenOrder[]>([]);
	const restaurantID = orders[0]?.restaurantID;
	const { data: restaurantData } = useSWR<{ profile?: { currency?: string } }>(restaurantID ? `/api/menu?id=${restaurantID}` : null, fetcher);
	const currency = restaurantData?.profile?.currency || "INR";
	const [statusFilter, setStatusFilter] = useState("all");
	const [stationFilter, setStationFilter] = useState<string>("all");
	const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [connectionState, setConnectionState] = useState<"connected" | "connecting" | "reconnecting">("connecting");
	const [_tick, setTick] = useState(0);
	const eventSourceRef = useRef<EventSource | null>(null);
	const previousOrderIdsRef = useRef<Set<string>>(new Set());
	const prevOrdersLength = useRef(0);

	// Timer tick every second
	useEffect(() => {
		const timer = setInterval(() => setTick((t) => t + 1), 1000);
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
							playNewOrderSound();
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

	const activeOrders = orders
		.map((o) => ({
			...o,
			// If a station filter is active, hide products that don't belong to
			// that station — the operator only cares about their own items.
			products: stationFilter === "all" ? o.products : o.products.filter((p) => (p.station || "main") === stationFilter),
		}))
		.filter((o) => {
			// Hide orders that have zero visible products after station filtering.
			if (o.products.length === 0) return false;
			const allStatuses = o.products.map((p) => p.kitchenStatus);
			if (statusFilter === "all") return true;
			return allStatuses.includes(statusFilter as ProductData["kitchenStatus"]);
		});

	// Station summary counts for the header (how many items per station are pending)
	const stationCounts = STATION_FILTERS.reduce(
		(acc, s) => {
			if (s.value === "all") return acc;
			acc[s.value] = orders.reduce((count, o) => count + o.products.filter((p) => (p.station || "main") === s.value && p.kitchenStatus !== "served").length, 0);
			return acc;
		},
		{} as Record<string, number>,
	);

	if (status === "loading") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
				<div className="text-center">
					<div className="text-6xl mb-4 animate-pulse">👨‍🍳</div>
					<p className="text-lg">Loading kitchen display...</p>
				</div>
			</div>
		);
	}

	if (status === "unauthenticated") {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] gap-4">
				<div className="text-6xl mb-2">🔒</div>
				<p className="text-lg text-gray-400">Please log in to access the kitchen display.</p>
				<a href="/" className="text-orange-400 hover:underline text-sm">
					Go to Login
				</a>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#0a0a0a] text-white">
			<header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-sm">
				<div className="flex items-center justify-between px-4 sm:px-6 h-14">
					<div className="flex items-center gap-3">
						<div className="relative">
							<span className="text-2xl">👨‍🍳</span>
							{orders.length > 0 && (
								<span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
									{orders.length}
								</span>
							)}
						</div>
						<div>
							<h1 className="text-base font-bold">Kitchen Display</h1>
							<p className="text-[10px] text-gray-500">
								{orders.filter((o) => o.products.some((p) => p.kitchenStatus === "pending")).length} new •{" "}
								{orders.filter((o) => o.products.some((p) => p.kitchenStatus === "preparing")).length} in progress
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<button onClick={toggleFullscreen} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
							{isFullscreen ? "⛶ Exit" : "⛶ Fullscreen"}
						</button>
						{connectionState === "connected" ? (
							<span className="flex items-center gap-1.5" title="Live">
								<span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
								<span className="text-[10px] text-green-500 hidden sm:inline">Live</span>
							</span>
						) : (
							<span className="flex items-center gap-1.5" title="Connection lost">
								<span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
								<span className="text-[10px] text-red-400 hidden sm:inline">Connection Lost — Reconnecting…</span>
							</span>
						)}
					</div>
				</div>

				<div className="flex gap-1.5 px-4 sm:px-6 pb-3 overflow-x-auto">
					{STATUS_FILTERS.map((f) => (
						<button
							key={f.value}
							onClick={() => setStatusFilter(f.value)}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
								statusFilter === f.value ? "bg-white text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"
							}`}>
							<span className={`w-1.5 h-1.5 rounded-full ${f.color}`} />
							{f.label}
						</button>
					))}
				</div>

				<div className="flex gap-1.5 px-4 sm:px-6 pb-3 overflow-x-auto border-t border-white/5 pt-3">
					{STATION_FILTERS.map((s) => {
						const count = s.value === "all" ? null : (stationCounts[s.value] ?? 0);
						const active = stationFilter === s.value;
						return (
							<button
								key={s.value}
								onClick={() => setStationFilter(s.value)}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
									active ? "bg-orange-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
								}`}
								title={s.label}>
								<span>{s.icon}</span>
								<span className="hidden sm:inline">{s.label}</span>
								<span className="sm:hidden">{s.label.split(" ")[0]}</span>
								{count !== null && count > 0 && (
									<span
										className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
											active ? "bg-white/20" : "bg-orange-500/20 text-orange-400"
										}`}>
										{count}
									</span>
								)}
							</button>
						);
					})}
				</div>
			</header>

			<main className="p-4 sm:p-6">
				{activeOrders.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-gray-600">
						<div className="text-6xl mb-4">🍳</div>
						<p className="text-lg font-medium">No active orders</p>
						<p className="text-sm mt-1">Waiting for new orders to arrive...</p>
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						<AnimatePresence>
							{activeOrders.map((order) => {
								const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000);
								const urgency = getUrgency(elapsed);
								const isNew = newOrderIds.has(order._id);

								return (
									<motion.div
										key={order._id}
										layout
										initial={{ opacity: 0, y: 20, scale: 0.95 }}
										animate={{
											opacity: 1,
											y: 0,
											scale: 1,
											borderColor: isNew ? ["rgb(251 146 60)", "rgb(251 146 60 / 0.5)", "transparent"] : undefined,
										}}
										transition={{ duration: 0.3 }}
										className={`rounded-xl border ${urgency.bg} overflow-hidden ${
											isNew ? "border-orange-500 shadow-lg shadow-orange-500/20" : "border-white/5"
										}`}>
										<div
											className={`flex items-center justify-between p-3 border-b ${isNew ? "border-orange-500/30 bg-orange-500/10" : "border-white/5 bg-white/[0.02]"}`}>
											<div>
												<div className="flex items-center gap-2">
													<span className="text-sm font-bold">Table {order.table}</span>
													{order.products.every((p) => p.kitchenStatus === "served") && (
														<span className="text-[10px] bg-green-900 text-green-400 px-1.5 py-0.5 rounded-full">Served</span>
													)}
												</div>
												{order.customer?.fname && (
													<p className="text-xs text-gray-500 mt-0.5">
														{order.customer.fname} {order.customer.lname}
													</p>
												)}
											</div>
											<div className={`font-mono text-lg font-bold tabular-nums ${urgency.color} ${urgency.pulse ? "animate-pulse" : ""}`}>
												{formatTime(elapsed)}
											</div>
										</div>

										<div className="divide-y divide-white/5">
											{order.products.map((product) => {
												const productKey = product._id || `${product.name}-${Math.random()}`;
												return (
													<div key={productKey} className="p-3 space-y-2">
														<div className="flex items-start justify-between gap-2">
															<div className="flex items-center gap-1.5 min-w-0">
																<span className="text-xs shrink-0">
																	{product.veg === "veg" ? "🟢" : product.veg === "non-veg" ? "🔴" : "🟡"}
																</span>
																<span className="text-sm font-medium truncate">{product.name || "Item"}</span>
																<span className="text-xs text-gray-500 shrink-0">x{product.quantity}</span>
																{stationFilter === "all" && product.station && product.station !== "main" && (
																	<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10 shrink-0">
																		{STATION_ICON[product.station] ?? "🍳"} {product.station}
																	</span>
																)}
															</div>
															<span className="text-xs text-gray-500 shrink-0">{formatCurrency(product.price, currency)}</span>
														</div>

														{product.foodType && SPICE_EMOJIS[product.foodType] && (
															<div className="flex items-center gap-1">
																<span className="text-[10px]">{SPICE_EMOJIS[product.foodType]}</span>
																<span className="text-[10px] text-gray-400">{SPICE_LABELS[product.foodType]}</span>
															</div>
														)}

														{product.description && (
															<p className="text-xs text-orange-300/80 bg-orange-500/10 rounded px-2 py-1 leading-relaxed">
																📝 {product.description}
															</p>
														)}

														<div className="flex gap-1.5 pt-1">
															{product.kitchenStatus === "pending" && (
																<button
																	onClick={() => handleAction(order._id, productKey, "preparing")}
																	className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-yellow-600 hover:bg-yellow-500 transition-colors">
																	▶ Start
																</button>
															)}
															{product.kitchenStatus === "preparing" && (
																<button
																	onClick={() => handleAction(order._id, productKey, "ready")}
																	className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-500 transition-colors">
																	✅ Mark Ready
																</button>
															)}
															{product.kitchenStatus === "ready" && (
																<>
																	<span className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-green-900/50 text-green-400 text-center">
																		Ready ✓
																	</span>
																	<button
																		onClick={() => handleAction(order._id, productKey, "served")}
																		className="px-2 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors">
																		🍽️ Served
																	</button>
																</>
															)}
															{product.kitchenStatus === "served" && (
																<span className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-gray-800 text-gray-500 text-center">
																	Served ✓
																</span>
															)}
														</div>
													</div>
												);
											})}
										</div>

										<div className="px-3 py-2 border-t border-white/5 flex gap-2">
											<button onClick={() => window.print()} className="flex-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
												🖨️ Print Ticket
											</button>
											<span className="text-[10px] text-gray-600">
												{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
											</span>
										</div>
									</motion.div>
								);
							})}
						</AnimatePresence>
					</div>
				)}
			</main>
		</div>
	);
}
