"use client";

import { ArrowRight, CalendarClock } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function StickyCTA() {
	const prefersReduced = useReducedMotion();
	return (
		<motion.div
			initial={{ y: 80, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.5, delay: prefersReduced ? 0 : 0.6, ease: "easeOut" }}
			className="fixed bottom-0 inset-x-0 z-30">
			<div className="mx-auto max-w-3xl px-4 pb-3 sm:pb-4">
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 rounded-2xl border border-border bg-card/95 backdrop-blur-md px-3 py-2.5 shadow-soft-hover">
					<div className="flex-1 px-2 py-1 sm:py-0">
						<div className="text-sm font-semibold text-foreground">Try every screen yourself</div>
						<div className="text-xs text-muted-foreground">Demo creds prefilled · no card required</div>
					</div>
					<div className="flex items-center gap-2">
						<Link href="/signup" className="flex-1 sm:flex-initial">
							<Button size="sm" className="h-11 w-full sm:w-auto gap-2 px-5 rounded-xl">
								Start free
								<ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
						<a href="#page-showcase" className="flex-1 sm:flex-initial">
							<Button variant="outline" size="sm" className="h-11 w-full sm:w-auto gap-2 px-5 rounded-xl">
								<CalendarClock className="h-4 w-4" />
								Book a demo
							</Button>
						</a>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
