"use client";

import { Bell, BellOff, Clock, History, RefreshCw, Star, Trophy, Utensils } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const KITCHEN_STATUS_CONFIG: Record<string, { label: string; emoji: string; className: string }> = {
	pending: { label: "Pending", emoji: "⏳", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
	preparing: { label: "Preparing", emoji: "👨‍🍳", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
	ready: { label: "Ready", emoji: "✅", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
	served: { label: "Served", emoji: "🍽️", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
};

export default function TrackPage() {
	const params = useParams<{ restaurant: string; tableId: string }>();
	const router = useRouter();
	const restaurant = params.restaurant;
	const tableId = params.tableId;

	const [activeTab, setActiveTab] = useState<"active" | "past">("active");
	const [pastPage, setPastPage] = useState(1);
	const [reviewOrder, setReviewOrder] = useState<{ _id: string; products?: Array<{ name: string }> } | null>(null);
	const [reviewRating, setReviewRating] = useState(5);
	const [reviewText, setReviewText] = useState("");
	const [submittingReview, setSubmittingReview] = useState(false);

	const { data: activeData, error: activeError, mutate: mutateActive } = useSWR("/api/order/status", fetcher, { refreshInterval: 5000 });

	const { data: pastData, error: pastError, mutate: mutatePast } = useSWR(`/api/order?past=true&page=${pastPage}`, fetcher);

	const { data: loyaltyData } = useSWR("/api/loyalty", fetcher);

	const { data: memoryData, mutate: mutateMemory } = useSWR("/api/customer/memory", fetcher);
	const whatsappOptIn = memoryData?.memory?.whatsappOptIn ?? false;

	const toggleWhatsAppOptIn = useCallback(async () => {
		const newVal = !whatsappOptIn;
		try {
			const res = await fetch("/api/customer/optin", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ whatsappOptIn: newVal }),
			});
			if (res.ok) {
				toast.success(newVal ? "WhatsApp notifications enabled ✅" : "WhatsApp notifications disabled");
				mutateMemory();
			}
		} catch {
			toast.error("Failed to update preference");
		}
	}, [whatsappOptIn, mutateMemory]);

	const markComplete = useCallback(async () => {
		if (!activeData?.order?._id) return;
		try {
			const res = await fetch("/api/order/cancel", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderId: activeData.order._id }),
			});
			if (res.ok) {
				toast.success("Order marked as received");
				mutateActive();
				mutatePast();
			}
		} catch {
			// silent
		}
	}, [activeData, mutateActive, mutatePast]);

	const handleReorder = useCallback(
		async (orderId: string) => {
			try {
				const res = await fetch("/api/order/reorder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) });
				if (!res.ok) throw new Error("Failed to reorder");
				toast.success("Items added to your cart!");
				router.push(`/${restaurant}/table/${tableId}`);
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Could not reorder");
			}
		},
		[restaurant, router, tableId],
	);

	const handleSubmitReview = useCallback(async () => {
		if (!reviewOrder) return;
		setSubmittingReview(true);
		try {
			const res = await fetch("/api/feedback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderId: reviewOrder._id, rating: reviewRating, review: reviewText }),
			});
			if (!res.ok) throw new Error("Failed to submit review");
			toast.success("Thanks for your feedback! 🌟");
			setReviewOrder(null);
			setReviewText("");
			mutatePast();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not submit review");
		} finally {
			setSubmittingReview(false);
		}
	}, [reviewOrder, reviewRating, reviewText, mutatePast]);

	const activeOrder = activeData?.order;
	const hasActiveOrder = activeData?.status === "active" && activeOrder;
	const pastOrders = pastData?.orders || [];
	const pastPagination = pastData?.pagination;
	const loyalty = loyaltyData;

	if (activeError && pastError) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="text-6xl mb-4">📡</div>
					<h2 className="text-xl font-bold">Connection Error</h2>
					<p className="text-muted-foreground mt-2">Please check your connection and try again.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b">
				<div className="max-w-3xl mx-auto px-4 sm:px-6">
					<div className="flex items-center justify-between h-14">
						<div className="flex items-center gap-2">
							<button onClick={() => router.push(`/${restaurant}/table/${tableId}`)} className="text-muted-foreground hover:text-foreground text-sm">
								← Menu
							</button>
							<span className="text-muted-foreground/30">|</span>
							<h1 className="text-sm font-semibold">My Orders</h1>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={() => {
									mutateActive();
									mutatePast();
								}}>
								<RefreshCw className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
				{loyalty && (
					<Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800/30">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Trophy className="h-8 w-8 text-amber-500" />
								<div>
									<p className="text-sm font-semibold capitalize">{loyalty.tier || "Silver"} Member</p>
									<p className="text-xs text-muted-foreground">{loyalty.points || 0} points</p>
								</div>
							</div>
							<Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
								🎯 {loyalty.visitCount || 0} visits
							</Badge>
						</div>
					</Card>
				)}
				<Card className="p-3 border-muted">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-sm">
							{whatsappOptIn ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
							<span>WhatsApp notifications</span>
						</div>
						<button
							onClick={toggleWhatsAppOptIn}
							className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${whatsappOptIn ? "bg-primary" : "bg-muted-foreground/30"}`}>
							<span
								className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${whatsappOptIn ? "translate-x-[18px]" : "translate-x-[3px]"}`}
							/>
						</button>
					</div>
					<p className="text-[10px] text-muted-foreground mt-1">Get order status updates and offers via WhatsApp</p>
				</Card>

				<div className="flex gap-2 border-b pb-3">
					<button
						onClick={() => setActiveTab("active")}
						className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
							activeTab === "active" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground bg-muted/50"
						}`}>
						<Clock className="h-4 w-4" />
						Active {hasActiveOrder ? `(${activeOrder.products?.length || 0})` : ""}
					</button>
					<button
						onClick={() => setActiveTab("past")}
						className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
							activeTab === "past" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground bg-muted/50"
						}`}>
						<History className="h-4 w-4" />
						Past {pastPagination?.total ? `(${pastPagination.total})` : ""}
					</button>
				</div>

				{activeTab === "active" &&
					(!activeData ? (
						<div className="space-y-3">
							{[...Array(3)].map((_, i) => (
								<Skeleton key={i} className="h-24 w-full rounded-xl" />
							))}
						</div>
					) : !hasActiveOrder ? (
						<div className="flex flex-col items-center justify-center py-20 text-center">
							<Utensils className="h-16 w-16 text-muted-foreground/30 mb-4" />
							<h3 className="text-lg font-semibold">No active orders</h3>
							<p className="text-sm text-muted-foreground mt-1 mb-6">Place an order to see its status here</p>
							<Button onClick={() => router.push(`/${restaurant}/table/${tableId}`)}>Browse Menu</Button>
						</div>
					) : (
						<div className="space-y-4">
							<Card className="p-4 space-y-3">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-semibold">Table {activeOrder.table}</p>
										<p className="text-[10px] text-muted-foreground">Order #{String(activeOrder._id).slice(-6).toUpperCase()}</p>
									</div>
									<Badge variant={activeOrder.paymentStatus === "paid" ? "default" : "secondary"} className="text-[10px]">
										{activeOrder.paymentStatus === "paid" ? "Paid ✅" : "Payment Pending"}
									</Badge>
								</div>
								<div className="space-y-2">
									{activeOrder.products?.map(
										(product: { name: string; quantity: number; price: number; kitchenStatus: string; veg: string }, i: number) => {
											const status = KITCHEN_STATUS_CONFIG[product.kitchenStatus] || KITCHEN_STATUS_CONFIG.pending;
											return (
												<div key={i} className="flex items-center justify-between rounded-lg border bg-card/50 p-3">
													<div className="flex items-center gap-2 min-w-0">
														<span className="text-sm">{product.veg === "veg" ? "🟢" : product.veg === "non-veg" ? "🔴" : "🟡"}</span>
														<div className="min-w-0">
															<p className="text-sm font-medium truncate">{product.name}</p>
															<p className="text-xs text-muted-foreground">×{product.quantity}</p>
														</div>
													</div>
													<Badge className={`text-[10px] px-2 py-0.5 h-auto ${status.className}`}>
														{status.emoji} {status.label}
													</Badge>
												</div>
											);
										},
									)}
								</div>
								<div className="flex items-center justify-between pt-2 border-t text-sm">
									<span className="text-muted-foreground">Total</span>
									<span className="font-bold">₹{((activeOrder.orderTotal || 0) + (activeOrder.taxTotal || 0)).toFixed(2)}</span>
								</div>
								<Button variant="outline" size="sm" className="w-full" onClick={markComplete}>
									✅ I&apos;ve received my order
								</Button>
							</Card>
						</div>
					))}

				{activeTab === "past" &&
					(!pastData ? (
						<div className="space-y-3">
							{[...Array(3)].map((_, i) => (
								<Skeleton key={i} className="h-24 w-full rounded-xl" />
							))}
						</div>
					) : pastOrders.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-20 text-center">
							<History className="h-16 w-16 text-muted-foreground/30 mb-4" />
							<h3 className="text-lg font-semibold">No past orders</h3>
							<p className="text-sm text-muted-foreground mt-1">Your order history will appear here</p>
						</div>
					) : (
						<div className="space-y-3">
							{pastOrders.map(
								(order: {
									_id: string;
									table: string;
									state: string;
									orderTotal: number;
									taxTotal: number;
									createdAt: string;
									products: Array<{ name: string; quantity: number; veg: string }>;
								}) => (
									<Card key={order._id} className="p-4 space-y-3">
										<div className="flex items-start justify-between">
											<div>
												<div className="flex items-center gap-2">
													<p className="text-sm font-semibold">Table {order.table}</p>
													<Badge
														variant={order.state === "complete" ? "default" : "secondary"}
														className={`text-[10px] px-1.5 py-0 h-auto capitalize ${
															order.state === "complete" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ""
														}`}>
														{order.state}
													</Badge>
												</div>
												<p className="text-[10px] text-muted-foreground mt-0.5">
													{new Date(order.createdAt).toLocaleDateString("en-IN", {
														day: "numeric",
														month: "short",
														year: "numeric",
														hour: "2-digit",
														minute: "2-digit",
													})}
												</p>
											</div>
											<p className="text-sm font-bold">₹{((order.orderTotal || 0) + (order.taxTotal || 0)).toFixed(2)}</p>
										</div>
										<div className="flex flex-wrap gap-1.5">
											{(order.products || []).slice(0, 5).map((p, i) => (
												<Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 h-auto">
													{p.veg === "veg" ? "🟢" : "🔴"} {p.name} ×{p.quantity}
												</Badge>
											))}
											{(order.products?.length || 0) > 5 && (
												<Badge variant="outline" className="text-[10px] px-1.5 py-0 h-auto">
													+{order.products.length - 5} more
												</Badge>
											)}
										</div>
										<div className="flex gap-2 pt-1">
											<Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleReorder(order._id)}>
												🔄 Re-order
											</Button>
											{order.state === "complete" && (
												<Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={() => setReviewOrder(order)}>
													<Star className="h-3 w-3 mr-1" />
													Review
												</Button>
											)}
										</div>
									</Card>
								),
							)}
							{pastPagination && pastPagination.totalPages > 1 && (
								<div className="flex items-center justify-center gap-2 pt-2">
									<Button variant="outline" size="sm" disabled={pastPage <= 1} onClick={() => setPastPage((p) => p - 1)}>
										← Previous
									</Button>
									<span className="text-xs text-muted-foreground">
										Page {pastPage} of {pastPagination.totalPages}
									</span>
									<Button variant="outline" size="sm" disabled={pastPage >= pastPagination.totalPages} onClick={() => setPastPage((p) => p + 1)}>
										Next →
									</Button>
								</div>
							)}
						</div>
					))}
			</main>

			<Dialog
				open={!!reviewOrder}
				onOpenChange={(open) => {
					if (!open) {
						setReviewOrder(null);
						setReviewText("");
					}
				}}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Rate your experience</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="flex items-center justify-center gap-1">
							{[1, 2, 3, 4, 5].map((star) => (
								<button key={star} onClick={() => setReviewRating(star)} className="p-1 transition-transform hover:scale-110">
									<Star className={`h-8 w-8 ${star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
								</button>
							))}
						</div>
						<textarea
							placeholder="Tell us about your experience... (optional)"
							value={reviewText}
							onChange={(e) => setReviewText(e.target.value)}
							className="w-full min-h-[100px] rounded-lg border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
						/>
						<Button className="w-full" onClick={handleSubmitReview} disabled={submittingReview}>
							{submittingReview ? "Submitting..." : "Submit Review 🌟"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
