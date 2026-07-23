"use client";

import { Globe, Quote, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";

const stats = [
	{ value: "100%", label: "Contactless", icon: Shield },
	{ value: "Zero", label: "Third-party fees", icon: Zap },
	{ value: "Real-time", label: "Kitchen sync", icon: Globe },
];

export default function AboutSection() {
	return (
		<section id="about" className="relative py-28 sm:py-36 bg-white">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="grid md:grid-cols-2 gap-16 md:gap-20 items-center">
					<motion.div
						initial={{ opacity: 0, x: -30 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.6, ease: "easeOut" }}>
						<div className="inline-flex items-center gap-2 rounded-full border border-slate-200/50 bg-white/80 px-4 py-1.5 text-sm text-slate-500 mb-6 shadow-soft">
							About Us
						</div>
						<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
							Built for restaurants that want to
							<span className="text-gradient"> own their digital presence</span>
						</h2>
						<p className="mt-6 text-lg text-slate-500 leading-relaxed">
							We are a team dedicated to transforming the restaurant industry by going contactless and paperless. OrderWorder bridges the gap between your
							customers and your kitchen — efficiently, affordably, and without intermediaries.
						</p>

						<div className="mt-10 grid grid-cols-3 gap-6">
							{stats.map((stat) => {
								const Icon = stat.icon;
								return (
									<div key={stat.label} className="text-center group">
										<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/10 group-hover:bg-violet-600/20 transition-all duration-200 ease-out">
											<Icon className="h-6 w-6 text-violet-600" />
										</div>
										<div className="text-2xl font-extrabold text-slate-900">{stat.value}</div>
										<div className="text-sm text-slate-500 mt-1">{stat.label}</div>
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
						<div className="rounded-2xl border border-slate-100 bg-white shadow-soft p-6 transition-all duration-200 ease-out hover:shadow-soft-hover glow-primary">
							<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-500 rounded-t-2xl" />
							<Quote className="h-10 w-10 text-violet-600/30 mb-6" />
							<blockquote className="text-xl sm:text-2xl text-slate-900 leading-relaxed font-medium tracking-tight">
								&ldquo;OrderWorder eliminated the friction between our customers and the kitchen. Setup took minutes, and our staff adapted
								immediately.&rdquo;
							</blockquote>
							<div className="mt-8 flex items-center gap-4">
								<div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center text-sm font-bold text-white shadow-soft">
									RK
								</div>
								<div>
									<div className="text-sm font-semibold text-slate-900">Restaurant Owner</div>
									<div className="text-xs text-slate-500">Beta Tester</div>
								</div>
							</div>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
