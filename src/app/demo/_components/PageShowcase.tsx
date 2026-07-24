"use client";

import { ArrowUpRight, Check } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DEMO_PAGES, type DemoPage } from "../_data/pages";

const CATEGORY_STYLE: Record<DemoPage["category"], string> = {
	Owner: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
	Customer: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
	Kitchen: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
	Compliance: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export function PageShowcase() {
	return (
		<section id="page-showcase" className="relative py-24 sm:py-32 bg-background">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.6 }}
					className="text-center mb-14">
					<Badge variant="secondary" className="mb-4">
						Every screen, one platform
					</Badge>
					<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
						16 pages that <span className="text-gradient">run a restaurant</span>
					</h2>
					<p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
						From the owner dashboard to the diner&apos;s phone to the auditor&apos;s verify endpoint — every screen below is part of the same tamper-proof
						chain.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{DEMO_PAGES.map((page, idx) => (
						<TiltCard key={page.id} page={page} index={idx} />
					))}
				</div>
			</div>
		</section>
	);
}

function TiltCard({ page, index }: { page: DemoPage; index: number }) {
	const prefersReduced = useReducedMotion();
	const ref = useRef<HTMLDivElement>(null);
	const rx = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
	const ry = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
	const glareX = useMotionValue(50);
	const glareY = useMotionValue(50);

	const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (prefersReduced || !ref.current) return;
		const rect = ref.current.getBoundingClientRect();
		const px = (e.clientX - rect.left) / rect.width;
		const py = (e.clientY - rect.top) / rect.height;
		ry.set((px - 0.5) * 10);
		rx.set(-(py - 0.5) * 10);
		glareX.set(px * 100);
		glareY.set(py * 100);
	};

	const handleLeave = () => {
		rx.set(0);
		ry.set(0);
	};

	const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgb(255 255 255 / 0.18), transparent 60%)`;

	return (
		<motion.div
			initial={{ opacity: 0, y: 28 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-50px" }}
			transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.5), ease: [0.16, 1, 0.3, 1] }}
			style={{ perspective: 1000 }}>
			<motion.div
				ref={ref}
				onMouseMove={handleMove}
				onMouseLeave={handleLeave}
				style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
				className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card shadow-soft hover:shadow-soft-hover transition-shadow duration-300">
				{/* Screenshot */}
				<div className="relative aspect-[16/10] overflow-hidden border-b border-border">
					<div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", page.accent)} />
					<Image
						src={page.screenshot}
						alt={`${page.title} screenshot`}
						fill
						sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
						className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
					<div className="absolute top-3 left-3">
						<span
							className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm", CATEGORY_STYLE[page.category])}>
							{page.category}
						</span>
					</div>
					<div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 backdrop-blur-md border border-border text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
						<ArrowUpRight className="h-4 w-4" />
					</div>
				</div>

				{/* Body */}
				<div className="p-5" style={{ transform: "translateZ(40px)" }}>
					<div className="flex items-baseline justify-between gap-2">
						<h3 className="text-lg font-bold text-foreground tracking-tight">{page.title}</h3>
						<span className="text-xs text-muted-foreground">{page.tagline}</span>
					</div>
					<p className="mt-2 text-sm text-muted-foreground leading-relaxed">{page.description}</p>
					<ul className="mt-4 space-y-1.5">
						{page.bullets.map((b) => (
							<li key={b} className="flex items-start gap-2 text-sm text-foreground/80">
								<Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
								<span>{b}</span>
							</li>
						))}
					</ul>
				</div>

				{/* Glare overlay */}
				<motion.div
					aria-hidden
					style={{ background: glare }}
					className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
				/>
			</motion.div>
		</motion.div>
	);
}
