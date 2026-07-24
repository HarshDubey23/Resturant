"use client";

import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FEATURE_TILES } from "../_data/features";

export function FeatureTiles() {
	const prefersReduced = useReducedMotion();
	return (
		<section id="features" className="relative py-24 sm:py-32 bg-muted/30">
			<div className="absolute inset-0 bg-mesh pointer-events-none opacity-50" />
			<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.6 }}
					className="text-center mb-14">
					<Badge variant="secondary" className="mb-4">
						Why owners switch
					</Badge>
					<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
						Six reasons it is <span className="text-gradient">not just another POS</span>
					</h2>
					<p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
						Every tile below is a feature restaurants usually pay three different vendors for — bundled into one tamper-proof system.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
					{FEATURE_TILES.map((tile, i) => {
						const Icon = tile.icon;
						return (
							<motion.div
								key={tile.id}
								initial={{ opacity: 0, y: 28 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, margin: "-50px" }}
								transition={{
									duration: 0.5,
									delay: prefersReduced ? 0 : Math.min(i * 0.07, 0.5),
									ease: [0.16, 1, 0.3, 1],
								}}
								whileHover={prefersReduced ? undefined : { y: -6 }}
								className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-soft-hover transition-shadow duration-300">
								<div
									className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", tile.gradient)}
								/>
								<div className="relative z-10">
									<div
										className={cn(
											"flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 group-hover:scale-110 transition-transform duration-300",
											tile.iconBg,
										)}>
										<Icon className={cn("h-7 w-7", tile.iconColor)} />
									</div>
									<h3 className="mt-5 text-xl font-bold text-foreground tracking-tight">{tile.title}</h3>
									<p className="mt-2 text-sm text-muted-foreground leading-relaxed">{tile.pitch}</p>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
