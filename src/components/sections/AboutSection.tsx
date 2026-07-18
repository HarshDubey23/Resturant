"use client";

import { Quote } from "lucide-react";
import { motion } from "motion/react";

const stats = [
	{ value: "100%", label: "Contactless" },
	{ value: "Zero", label: "Third-party fees" },
	{ value: "Real-time", label: "Kitchen sync" },
];

export default function AboutSection() {
	return (
		<section id="about" className="relative py-24 sm:py-32 bg-muted/30">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
					<motion.div
						initial={{ opacity: 0, x: -24 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.6, ease: "easeOut" }}>
						<h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
							Built for restaurants that want to own their digital presence
						</h2>
						<p className="mt-6 text-muted-foreground leading-relaxed">
							We are a team dedicated to transforming the restaurant industry by going contactless and paperless. OrderWorder bridges the gap between your
							customers and your kitchen — efficiently, affordably, and without intermediaries.
						</p>

						<div className="mt-8 grid grid-cols-3 gap-6">
							{stats.map((stat) => (
								<div key={stat.label}>
									<div className="text-2xl font-semibold text-foreground">{stat.value}</div>
									<div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
								</div>
							))}
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 24 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
						className="relative">
						<div className="rounded-2xl border bg-card p-8 sm:p-10">
							<Quote className="h-8 w-8 text-primary/40 mb-4" />
							<blockquote className="text-lg sm:text-xl text-foreground leading-relaxed font-medium">
								&ldquo;OrderWorder eliminated the friction between our customers and the kitchen. Setup took minutes, and our staff adapted
								immediately.&rdquo;
							</blockquote>
							<div className="mt-6 flex items-center gap-3">
								<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">RK</div>
								<div>
									<div className="text-sm font-medium text-foreground">Restaurant Owner</div>
									<div className="text-xs text-muted-foreground">Beta Tester</div>
								</div>
							</div>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
