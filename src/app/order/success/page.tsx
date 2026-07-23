"use client";

import { CheckCircle2, ChefHat, Clock, Download, Loader2, Package, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/utils/helper/currency";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const KITCHEN_STATUS_FLOW: Array<{ key: string; label: string }> = [
	{ key: "pending", label: "Received" },
	{ key: "preparing", label: "Preparing" },
	{ key: "ready", label: "Ready" },
	{ key: "served", label: "Served" },
];

function SuccessContent() {
	const searchParams = useSearchParams();
	const orderId = searchParams.get("order_id");
	const paymentId = searchParams.get("payment_id");
	const [downloading, setDownloading] = useState(false);

	// Poll for the active order (and its kitchen status) so we can show live progress.
	const { data: orderData } = useSWR(orderId ? "/api/order/status" : null, fetcher, {
		refreshInterval: 4000,
	});
	const order = orderData?.order as
		| {
				_id: string;
				table?: string;
				products?: Array<{ name: string; quantity: number; price: number; kitchenStatus?: string }>;
				orderTotal?: number;
				taxTotal?: number;
				paymentStatus?: string;
				createdAt?: string;
		  }
		| undefined;

	// Fetch the restaurant currency via the menu endpoint (cheap, cached server-side).
	const restaurantSlug = typeof window !== "undefined" ? window.location.pathname.split("/")[1] : "";
	const { data: restaurantData } = useSWR(restaurantSlug ? `/api/menu?id=${restaurantSlug}` : null, fetcher);
	const currency = restaurantData?.profile?.currency || "INR";

	const total = (order?.orderTotal ?? 0) + (order?.taxTotal ?? 0);

	// Detect current step for the progress stepper.
	const currentStepIndex = (() => {
		if (!order?.products?.length) return 0;
		const statuses = order.products.map((p) => p.kitchenStatus ?? "pending");
		if (statuses.some((s) => s === "served")) return 3;
		if (statuses.some((s) => s === "ready")) return 2;
		if (statuses.some((s) => s === "preparing")) return 1;
		return 0;
	})();

	const handleDownloadInvoice = async () => {
		if (!order?._id) {
			return;
		}
		setDownloading(true);
		try {
			// Find the invoice for this order
			const res = await fetch(`/api/invoice?orderId=${order._id}`);
			const data = await res.json();
			const invoiceId = Array.isArray(data) ? data[0]?._id : data?.invoice?._id;
			if (!invoiceId) throw new Error("Invoice not ready yet — try again in a few seconds");
			// Download the PDF
			const pdfRes = await fetch(`/api/invoice/${invoiceId}/pdf`);
			if (!pdfRes.ok) throw new Error("PDF download failed");
			const blob = await pdfRes.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `invoice-${order._id.toString().slice(-8)}.pdf`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			// Fallback: open print dialog
			window.print();
			console.warn("Invoice download fallback:", err);
		} finally {
			setDownloading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background flex items-center justify-center p-4">
			<div className="max-w-md w-full space-y-6">
				{/* Hero success card */}
				<Card className="text-center p-8 border-emerald-200/60 shadow-lg">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
						<CheckCircle2 className="h-9 w-9 text-emerald-600" />
					</div>
					<h1 className="text-2xl font-bold text-foreground">Order placed!</h1>
					<p className="text-muted-foreground text-sm mt-1">
						{order ? "The kitchen has been notified. Sit back and relax." : "Your payment was successful. The kitchen is being notified."}
					</p>

					{/* Order ID chip */}
					{(orderId || order?._id) && (
						<div className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs">
							<Package className="h-3 w-3 text-muted-foreground" />
							<span className="font-mono text-muted-foreground">#{(orderId || order?._id || "").toString().slice(-8).toUpperCase()}</span>
						</div>
					)}

					{/* Live kitchen status stepper */}
					{order?.products?.length ? (
						<div className="mt-6">
							<div className="flex items-center justify-between">
								{KITCHEN_STATUS_FLOW.map((step, i) => {
									const done = i <= currentStepIndex;
									const active = i === currentStepIndex;
									return (
										<div key={step.key} className="flex flex-1 flex-col items-center gap-1.5">
											<div
												className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
													done
														? "bg-emerald-500 text-white"
														: active
															? "bg-primary text-primary-foreground ring-4 ring-primary/20"
															: "bg-muted text-muted-foreground"
												}`}>
												{i < currentStepIndex ? "✓" : i + 1}
											</div>
											<span className={`text-[10px] ${done || active ? "font-medium text-foreground" : "text-muted-foreground"}`}>
												{step.label}
											</span>
										</div>
									);
								})}
							</div>
							<div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
								<Clock className="h-3 w-3" />
								Est. ready in 12–18 minutes
							</div>
						</div>
					) : null}
				</Card>

				{/* Order summary */}
				{order?.products?.length ? (
					<Card className="p-4 space-y-3">
						<div className="flex items-center gap-2 text-sm font-semibold">
							<ChefHat className="h-4 w-4 text-primary" />
							Your order
							{order.table && <span className="text-muted-foreground font-normal">· Table {order.table}</span>}
						</div>
						<div className="space-y-2">
							{order.products.map((p, i) => (
								<div key={`${p.name}-${i}`} className="flex justify-between text-sm">
									<span className="text-foreground">
										<span className="text-muted-foreground">{p.quantity}×</span> {p.name}
									</span>
									<span className="text-muted-foreground tabular-nums">{formatCurrency(p.price * p.quantity, currency)}</span>
								</div>
							))}
						</div>
						<div className="border-t pt-2 flex justify-between text-sm font-semibold">
							<span>Total</span>
							<span className="tabular-nums">{formatCurrency(total, currency)}</span>
						</div>
					</Card>
				) : null}

				{/* Actions */}
				<div className="space-y-2">
					{order?._id && (
						<Button onClick={handleDownloadInvoice} variant="outline" className="w-full gap-2" loading={downloading}>
							<Download className="h-4 w-4" />
							Download Invoice (PDF)
						</Button>
					)}
					{restaurantSlug && order?.table && (
						<Link href={`/${restaurantSlug}/table/${order.table}/track`}>
							<Button className="w-full gap-2">
								<Sparkles className="h-4 w-4" />
								Track my order
							</Button>
						</Link>
					)}
					<Link href={`/${restaurantSlug}`} className="block">
						<Button variant="ghost" className="w-full">
							Back to menu
						</Button>
					</Link>
				</div>

				{/* Payment ID footer */}
				{paymentId && <p className="text-center text-[10px] text-muted-foreground font-mono">Payment ref: {paymentId.slice(-16)}</p>}
			</div>
		</div>
	);
}

export default function SuccessPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-background flex items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			}>
			<SuccessContent />
		</Suspense>
	);
}
