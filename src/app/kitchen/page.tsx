"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import type { TOrder, TProduct } from "#utils/database/models/order";

type KitchenOrder = TOrder & {
	customer?: { fname: string; lname: string; phone: string };
	products: (TProduct & { name?: string; description?: string })[];
	createdAt?: string;
	updatedAt?: string;
};

const STATION_COLORS: Record<string, string> = {
	tandoor: "border-l-orange-500",
	"south-indian": "border-l-green-500",
	main: "border-l-blue-500",
	dessert: "border-l-pink-500",
	beverage: "border-l-purple-500",
};

const TIMER_COLORS = ["text-green-600", "text-yellow-600", "text-orange-600", "text-red-600"];

export default function KitchenPage() {
	const { data: session, status } = useSession();
	const [orders, setOrders] = useState<KitchenOrder[]>([]);
	const [stations, setStations] = useState<Set<string>>(new Set(["main"]));
	const [activeStation, setActiveStation] = useState<string>("all");
	const eventSourceRef = useRef<EventSource | null>(null);

	useEffect(() => {
		if (status !== "authenticated") return;

		const es = new EventSource("/api/order/stream");
		eventSourceRef.current = es;

		es.addEventListener("order", (event) => {
			try {
				const { data } = JSON.parse(event.data);
				if (data?.type === "orders" && Array.isArray(data?.data)) {
					const activeOrders = data.data.filter((o: KitchenOrder) => o.state === "active");
					setOrders(activeOrders);

					const allStations = new Set<string>(["main"]);
					for (const order of activeOrders) {
						for (const product of order.products) {
							if (product.station) allStations.add(product.station);
						}
					}
					setStations(allStations);
				}
			} catch {}
		});

		es.onerror = () => {
			es.close();
		};

		return () => {
			es.close();
		};
	}, [status]);

	if (status === "loading") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
				<p className="text-lg">Loading...</p>
			</div>
		);
	}

	if (status === "unauthenticated") {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 gap-4">
				<p className="text-lg text-gray-400">Please log in to access the kitchen display.</p>
				<a href="/" className="text-blue-400 hover:underline">
					Go to Login
				</a>
			</div>
		);
	}

	const filteredOrders = activeStation === "all" ? orders : orders.filter((o) => o.products.some((p) => p.station === activeStation));

	const getElapsed = (createdAt: string) => {
		const elapsed = Date.now() - new Date(createdAt).getTime();
		return Math.floor(elapsed / 1000);
	};

	const getTimerColor = (seconds: number) => {
		if (seconds < 300) return TIMER_COLORS[0];
		if (seconds < 600) return TIMER_COLORS[1];
		if (seconds < 900) return TIMER_COLORS[2];
		return TIMER_COLORS[3];
	};

	const handleKitchenAction = async (orderId: string, productId: string, action: "preparing" | "ready" | "served") => {
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
	};

	return (
		<div className="min-h-screen bg-gray-950 text-white">
			<header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
				<div className="flex items-center justify-between px-4 sm:px-6 h-14">
					<h1 className="text-lg font-bold">Kitchen Display System</h1>
					<div className="flex items-center gap-3">
						<a href="/aggregator-orders" className="text-xs text-gray-400 hover:text-white transition-colors">
							External Orders
						</a>
						<span className="text-sm text-gray-400">{orders.length} active</span>
						<span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
					</div>
				</div>
				<div className="flex gap-1 px-4 sm:px-6 pb-2 overflow-x-auto">
					<button
						type="button"
						onClick={() => setActiveStation("all")}
						className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
							activeStation === "all" ? "bg-white text-gray-950" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
						}`}>
						All
					</button>
					{Array.from(stations).map((station) => (
						<button
							key={station}
							type="button"
							onClick={() => setActiveStation(station)}
							className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors capitalize ${
								activeStation === station ? "bg-white text-gray-950" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
							}`}>
							{station}
						</button>
					))}
				</div>
			</header>

			<main className="p-4 sm:p-6">
				{filteredOrders.length === 0 && (
					<div className="flex flex-col items-center justify-center py-20 text-gray-500">
						<svg className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1}
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
							/>
						</svg>
						<p className="text-lg">No active orders</p>
						<p className="text-sm">Waiting for new orders to arrive...</p>
					</div>
				)}

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{filteredOrders.map((order) => {
						const elapsed = getElapsed(order.createdAt?.toString() || "");
						const minutes = Math.floor(elapsed / 60);
						const seconds = elapsed % 60;

						return (
							<div key={order._id?.toString()} className="rounded-lg border border-gray-800 bg-gray-900 overflow-hidden">
								<div className="flex items-center justify-between p-3 border-b border-gray-800 bg-gray-850">
									<div>
										<span className="text-sm font-medium text-gray-400">Table {order.table}</span>
										{order.customer && (
											<p className="text-xs text-gray-500">
												{order.customer.fname} {order.customer.lname}
											</p>
										)}
									</div>
									<div className={`font-mono text-lg font-bold tabular-nums ${getTimerColor(elapsed)}`}>
										{minutes}:{seconds.toString().padStart(2, "0")}
									</div>
								</div>

								<div className="divide-y divide-gray-800">
									{order.products
										.filter((p) => activeStation === "all" || p.station === activeStation)
										.map((product) => (
											<div
												key={product._id?.toString()}
												className={`p-3 border-l-4 ${STATION_COLORS[product.station || "main"] || "border-l-blue-500"}`}>
												<div className="flex items-center justify-between mb-1">
													<span className="font-medium text-sm">{product.name || "Menu Item"}</span>
													<span className="text-xs text-gray-500">x{product.quantity}</span>
												</div>
												{product.description && <p className="text-xs text-gray-500 mb-2 line-clamp-1">{product.description}</p>}
												<div className="flex gap-1.5 mt-2">
													{product.kitchenStatus === "pending" && (
														<button
															type="button"
															onClick={() => handleKitchenAction(order._id?.toString() || "", product._id?.toString() || "", "preparing")}
															className="flex-1 px-2 py-1 text-xs font-medium rounded bg-yellow-600 hover:bg-yellow-500 transition-colors">
															Start
														</button>
													)}
													{product.kitchenStatus === "preparing" && (
														<button
															type="button"
															onClick={() => handleKitchenAction(order._id?.toString() || "", product._id?.toString() || "", "ready")}
															className="flex-1 px-2 py-1 text-xs font-medium rounded bg-green-600 hover:bg-green-500 transition-colors">
															Ready
														</button>
													)}
													{product.kitchenStatus === "ready" && (
														<span className="flex-1 px-2 py-1 text-xs font-medium rounded bg-green-900 text-green-400 text-center">
															Ready ✓
														</span>
													)}
													{product.kitchenStatus === "served" && (
														<span className="flex-1 px-2 py-1 text-xs font-medium rounded bg-gray-800 text-gray-500 text-center">Served</span>
													)}
												</div>
											</div>
										))}
								</div>
							</div>
						);
					})}
				</div>
			</main>
		</div>
	);
}
