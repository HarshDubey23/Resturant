"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CtaSection() {
	return (
		<section className="relative py-28 sm:py-36 overflow-hidden">
			{/* Background effects */}
			<div className="absolute inset-0 bg-mesh pointer-events-none" />
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />

			<div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.6, ease: "easeOut" }}>
					<div className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground mb-8 shadow-sm">
						<Sparkles className="h-3.5 w-3.5 text-primary" />
						Get Started Today
					</div>
					<h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
						Ready to <span className="text-gradient">transform</span> your restaurant?
					</h2>
					<p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
						Join the restaurants already using OrderWorder. Free to start, no commitment required.
					</p>
					<div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link href="/signup">
							<Button size="lg" className="gap-2 text-base h-13 px-10 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
								Get started
								<ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
						<Link href="/demo">
							<Button variant="outline" size="lg" className="gap-2 text-base h-13 px-10 rounded-xl border-2 hover:bg-primary/5 transition-all duration-300">
								Try Live Demo
							</Button>
						</Link>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
