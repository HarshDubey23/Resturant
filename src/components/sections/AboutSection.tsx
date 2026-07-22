"use client";

import { Quote, Shield, Zap, Globe } from "lucide-react";
import { motion } from "motion/react";

const stats = [
	{ value: "100%", label: "Contactless", icon: Shield },
	{ value: "Zero", label: "Third-party fees", icon: Zap },
	{ value: "Real-time", label: "Kitchen sync", icon: Globe },
];

export default function AboutSection() {
	return (
		<section id="about" className="relative py-28 sm:py-36 bg-muted/30">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="grid md:grid-cols-2 gap-16 md:gap-20 items-center">
					<motion.div
						initial={{ opacity: 0, x: -30 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.6, ease: "easeOut" }}>
						<div className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground mb-6 shadow-sm">
							About Us
						</div>
						<h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
							Built for restaurants that want to
							<span className="text-gradient"> own their digital presence</span>
						</h2>
						<p className="mt-6 text-lg text-muted-foreground leading-relaxed">
							We are a team dedicated to transforming the restaurant industry by going contactless and paperless. OrderWorder bridges the gap between your customers and your kitchen — efficiently, affordably, and without intermediaries.
						</p>

						<div className="mt-10 grid grid-cols-3 gap-6">
							{stats.map((stat) => {
								const Icon = stat.icon;
								return (
									<div key={stat.label} className="text-center group">
										<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
											<Icon className="h-6 w-6 text-primary" />
										</div>
										<div className="text-2xl font-black text-foreground">{stat.value}</div>
										<div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
									</div>
								);
							})}
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 30 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
						className="relative">
						<div className="rounded-3xl border bg-card/80 backdrop-blur-sm p-10 shadow-xl glow-primary">
							<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary rounded-t-3xl" />
							<Quote className="h-10 w-10 text-primary/30 mb-6" />
							<blockquote className="text-xl sm:text-2xl text-foreground leading-relaxed font-medium">
								&ldquo;OrderWorder eliminated the friction between our customers and the kitchen. Setup took minutes, and our staff adapted immediately.&rdquo;
							</blockquote>
							<div className="mt-8 flex items-center gap-4">
								<div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-sm font-bold text-white shadow-sm">
									RK
								</div>
								<div>
									<div className="text-sm font-semibold text-foreground">Restaurant Owner</div>
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
