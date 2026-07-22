"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CancelContent() {
	const searchParams = useSearchParams();
	const error = searchParams.get("error");

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-6">
				<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="text-7xl">
					❌
				</motion.div>

				<div className="space-y-2">
					<h1 className="text-2xl font-bold text-foreground">Payment Cancelled</h1>
					<p className="text-muted-foreground text-sm">{error || "Your payment was not completed. You can try again."}</p>
				</div>

				<div className="flex flex-col gap-3">
					<Link
						href="/"
						className="w-full px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-center">
						Try Again
					</Link>
				</div>
			</motion.div>
		</div>
	);
}

export default function CancelPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-background flex items-center justify-center">
					<div className="text-4xl animate-pulse">⏳</div>
				</div>
			}>
			<CancelContent />
		</Suspense>
	);
}
