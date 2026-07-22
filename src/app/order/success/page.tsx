"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
	const searchParams = useSearchParams();
	const orderId = searchParams.get("order_id");
	const paymentId = searchParams.get("payment_id");

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5 }}
				className="max-w-md w-full text-center space-y-6">
				<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="text-7xl">
					✅
				</motion.div>

				<div className="space-y-2">
					<h1 className="text-2xl font-bold text-foreground">Payment Successful!</h1>
					<p className="text-muted-foreground text-sm">Your order has been placed and will be prepared shortly.</p>
				</div>

				<div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm">
					{orderId && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Order ID</span>
							<span className="font-mono text-foreground font-medium">{orderId.slice(-12)}</span>
						</div>
					)}
					{paymentId && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Payment ID</span>
							<span className="font-mono text-foreground font-medium">{paymentId.slice(-12)}</span>
						</div>
					)}
				</div>

				<div className="flex flex-col gap-3">
					<Link
						href="/"
						className="w-full px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-center">
						Back to Home
					</Link>
				</div>
			</motion.div>
		</div>
	);
}

export default function SuccessPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-background flex items-center justify-center">
					<div className="text-4xl animate-pulse">⏳</div>
				</div>
			}>
			<SuccessContent />
		</Suspense>
	);
}
