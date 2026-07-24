"use client";

import { ArrowRight, Sparkles, UtensilsCrossed } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { CountUp } from "@/components/base/CountUp";
import { Button } from "@/components/ui/button";

const STATS = [
	{ to: 500, suffix: "+", label: "Restaurants" },
	{ to: 2, suffix: "M+", label: "Orders processed" },
	{ to: 48, prefix: "₹", suffix: "Cr+", label: "GST processed" },
	{ to: 0, label: "Bills deleted" },
];

export function HeroDemo() {
	const ref = useRef<HTMLElement>(null);
	const prefersReduced = useReducedMotion();
	const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
	const bgY = useTransform(scrollYProgress, [0, 1], ["0%", prefersReduced ? "0%" : "22%"]);
	const overlayOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.6]);
	const contentY = useTransform(scrollYProgress, [0, 1], ["0%", prefersReduced ? "0%" : "30%"]);
	const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

	return (
		<section ref={ref} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
			{/* Full-bleed feast-spread with parallax */}
			<motion.div style={{ y: bgY }} className="absolute inset-0 -z-20">
				<Image
					src="/food-images/heroes/feast-spread.png"
					alt="A lavish restaurant feast spread on a long table"
					fill
					priority
					sizes="100vw"
					className="object-cover"
				/>
			</motion.div>
			{/* Dark overlay + brand tint */}
			<motion.div style={{ opacity: overlayOpacity }} className="absolute inset-0 -z-10 bg-gradient-to-b from-background/70 via-background/60 to-background/95" />
			<div className="absolute inset-0 -z-10 bg-primary/10" />

			<motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-28 pb-24 text-center">
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-5 py-2 text-sm text-muted-foreground backdrop-blur-md shadow-soft">
					<Sparkles className="h-4 w-4 text-primary" />
					<span className="font-medium">Live interactive demo · scroll to explore</span>
				</motion.div>

				<motion.h1
					initial={{ opacity: 0, y: 24 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7, delay: 0.1 }}
					className="mt-8 text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.05]">
					OrderWorder — <span className="text-gradient">The Restaurant OS</span>
					<br />
					That <span className="italic underline decoration-primary/40 underline-offset-8">Cannot Lie</span>
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 24 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7, delay: 0.2 }}
					className="mx-auto mt-8 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
					Tamper-proof bills, theft-detecting inventory, zero-commission direct orders and an 11 PM WhatsApp digest of the day. Every screen below is real —
					click, filter, add to cart.
				</motion.p>

				<motion.div
					initial={{ opacity: 0, y: 24 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7, delay: 0.3 }}
					className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
					<Link href="/signup">
						<Button size="lg" className="h-12 gap-2 px-8 text-base rounded-xl">
							Start free — demo creds
							<ArrowRight className="h-4 w-4" />
						</Button>
					</Link>
					<a href="#menu-gallery">
						<Button variant="outline" size="lg" className="h-12 gap-2 px-8 text-base rounded-xl">
							<UtensilsCrossed className="h-4 w-4" />
							Explore the live menu
						</Button>
					</a>
				</motion.div>

				{/* Count-up stats */}
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7, delay: 0.45 }}
					className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
					{STATS.map((s) => (
						<div key={s.label} className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-4 sm:p-6 shadow-soft">
							<div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
								<CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} duration={2.2} />
							</div>
							<div className="mt-2 text-xs sm:text-sm text-muted-foreground">{s.label}</div>
						</div>
					))}
				</motion.div>
			</motion.div>

			{/* Scroll cue */}
			<motion.div
				aria-hidden
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 1 }}
				className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
				<div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-foreground/30 p-1.5">
					<motion.div
						animate={prefersReduced ? undefined : { y: [0, 10, 0] }}
						transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
						className="h-1.5 w-1.5 rounded-full bg-foreground/50"
					/>
				</div>
			</motion.div>
		</section>
	);
}
