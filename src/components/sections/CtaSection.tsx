"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CtaSection() {
	const prefersReduced = useReducedMotion();
	return (
		<section className="relative py-28 sm:py-36 overflow-hidden">
			{/* Full-bleed restaurant-night background */}
			<div className="absolute inset-0 -z-20">
				<Image src="/food-images/heroes/restaurant-night.png" alt="A restaurant glowing at night" fill priority sizes="100vw" className="object-cover" />
			</div>
			<div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-950/85" />
			<div className="absolute inset-0 -z-10 bg-primary/10" />

			<div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.6, ease: "easeOut" }}>
					<div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1.5 text-sm text-white/90 mb-8">
						<Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
						Get Started Today
					</div>
					<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
						Ready to <span className="bg-gradient-to-r from-fuchsia-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">transform</span> your
						restaurant?
					</h2>
					<p className="mt-6 text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
						Join the restaurants already using OrderWorder. Free to start, no commitment required.
					</p>
					<div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link href="/signup">
							<Button size="lg" className="gap-2 text-base h-13 px-10 rounded-xl shadow-soft hover:shadow-soft-hover transition-all duration-200">
								Get started
								<ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
						<Link href="/demo">
							<Button
								variant="outline"
								size="lg"
								className="gap-2 text-base h-13 px-10 rounded-xl transition-all duration-200 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white">
								Try Live Demo
								<ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
					</div>

					<motion.div
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: prefersReduced ? 0 : 0.3 }}
						className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/70">
						<span className="flex items-center gap-2">
							<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
							No credit card required
						</span>
						<span className="flex items-center gap-2">
							<span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
							5-minute setup
						</span>
						<span className="flex items-center gap-2">
							<span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
							Cancel anytime
						</span>
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
}
