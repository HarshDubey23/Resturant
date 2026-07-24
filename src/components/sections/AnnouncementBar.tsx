"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Gift, Sparkles, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function AnnouncementBar() {
	const [dismissed, setDismissed] = useState(false);

	return (
		<AnimatePresence>
			{!dismissed && (
				<motion.div
					key="announcement-bar"
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: "auto", opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					transition={{ duration: 0.3, ease: "easeOut" }}
					className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600">
					{/* Animated shimmer overlay */}
					<div
						aria-hidden
						className="absolute inset-0 pointer-events-none opacity-30"
						style={{
							backgroundImage:
								"linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
							backgroundSize: "200% 100%",
							animation: "shimmer 3s linear infinite",
						}}
					/>

					<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-center gap-3 py-2.5">
							<Gift className="h-4 w-4 text-white/80 shrink-0" aria-hidden />
							<p className="text-xs sm:text-sm font-semibold text-white text-center">
								🎉{" "}
								<span className="hidden sm:inline">
									Launch Special — First 100 restaurants get 3 months free!{" "}
								</span>
								<span className="sm:hidden">
									3 months free for first 100 restaurants!{" "}
								</span>
								<Link
									href="/signup"
									className="inline-flex items-center gap-1 text-white underline underline-offset-2 hover:no-underline font-bold transition-all">
									Claim offer
									<ArrowRight className="h-3 w-3" />
								</Link>
							</p>
							<Sparkles className="h-3.5 w-3.5 text-fuchsia-200 shrink-0" aria-hidden />
							<button
								type="button"
								onClick={() => setDismissed(true)}
								aria-label="Dismiss announcement"
								className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all">
								<X className="h-3.5 w-3.5" />
							</button>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
