"use client";

import { ArrowRight, Play, Sparkles, Star, UtensilsCrossed } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { CountUp } from "@/components/base/CountUp";
import { Button } from "@/components/ui/button";

const HERO_STATS = [
	{ to: 500, suffix: "+", label: "Restaurants" },
	{ to: 2, suffix: "M+", label: "Orders" },
	{ to: 48, prefix: "₹", suffix: "Cr+", label: "GST filed" },
	{ to: 0, label: "Bills deleted" },
];

const FLOATING_DISHES = [
	{ src: "/food-images/dishes/butter-chicken.png", alt: "Butter chicken", className: "top-[8%] -left-[6%] sm:left-[2%] w-28 sm:w-36", delay: 0 },
	{ src: "/food-images/dishes/biryani.png", alt: "Biryani", className: "bottom-[10%] -left-[4%] sm:left-[6%] w-24 sm:w-32", delay: 0.6 },
	{ src: "/food-images/dishes/pizza.png", alt: "Margherita pizza", className: "top-[6%] -right-[4%] sm:right-[2%] w-28 sm:w-36", delay: 0.3 },
	{ src: "/food-images/dishes/masala-chai.png", alt: "Masala chai", className: "bottom-[8%] -right-[2%] sm:right-[8%] w-24 sm:w-32", delay: 0.9 },
];

export default function HeroSection() {
	const ref = useRef<HTMLElement>(null);
	const prefersReduced = useReducedMotion();
	const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
	const bgY = useTransform(scrollYProgress, [0, 1], ["0%", prefersReduced ? "0%" : "25%"]);
	const contentY = useTransform(scrollYProgress, [0, 1], ["0%", prefersReduced ? "0%" : "30%"]);
	const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
	const dishY1 = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : -80]);
	const dishY2 = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : 60]);
	const dishY3 = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : -120]);
	const dishY4 = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : 90]);
	const dishTransforms = [dishY1, dishY2, dishY3, dishY4];

	return (
		<section id="homepage" ref={ref} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
			{/* Full-bleed feast-spread with parallax */}
			<motion.div style={{ y: bgY }} className="absolute inset-0 -z-20">
				<Image
					src="/food-images/heroes/feast-spread.png"
					alt="A lavish restaurant feast spread across a long table"
					fill
					priority
					sizes="100vw"
					className="object-cover"
				/>
			</motion.div>
			{/* Dark gradient overlay — keeps the photo visible while ensuring text contrast */}
			<div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/70 via-slate-950/55 to-slate-950/85" />
			<div className="absolute inset-0 -z-10 bg-primary/10" />

			{/* Floating dish cards with parallax */}
			<div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none hidden sm:block">
				{FLOATING_DISHES.map((d, i) => (
					<motion.div
						key={d.src}
						style={{ y: dishTransforms[i] }}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.8, delay: d.delay + 0.4 }}
						className={`absolute ${d.className}`}>
						<motion.div
							animate={prefersReduced ? undefined : { y: [0, -10, 0] }}
							transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
							className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl ring-1 ring-black/5">
							<div className="relative aspect-square">
								<Image src={d.src} alt={d.alt} fill sizes="144px" className="object-cover" />
							</div>
						</motion.div>
					</motion.div>
				))}
			</div>

			<motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full pt-28 pb-20">
				<div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
					<motion.div
						initial={{ opacity: 0, x: -40 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
						className="text-center lg:text-left">
						{/* Badge */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
							className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2 text-sm text-white/90 mb-8">
							<Sparkles className="h-4 w-4 text-fuchsia-300" />
							<span className="font-medium">No app needed. Just scan &amp; order</span>
							<span className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75" />
								<span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-400" />
							</span>
						</motion.div>

						{/* Headline */}
						<motion.h1
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3, duration: 0.6 }}
							className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white leading-[1.05]">
							<span>Scan.</span>
							<br />
							<span className="bg-gradient-to-r from-fuchsia-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">Order.</span>
							<br />
							<span>Enjoy.</span>
						</motion.h1>

						{/* Subtitle */}
						<motion.p
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4, duration: 0.6 }}
							className="mt-8 text-lg sm:text-xl text-white/80 max-w-xl leading-relaxed mx-auto lg:mx-0">
							The all-in-one operating system for restaurant owners. Your customers scan, browse the menu, customize with notes &amp; spice levels, pay
							online, and get a digital bill — while your kitchen, analytics, loyalty, and WhatsApp marketing all run themselves in the background.
						</motion.p>

						{/* CTA Buttons */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.5, duration: 0.6 }}
							className="mt-10 flex flex-col sm:flex-row items-center lg:justify-start gap-4">
							<Link href="/signup">
								<Button size="lg" className="gap-2 text-base h-13 px-8 rounded-xl shadow-soft hover:shadow-soft-hover transition-all duration-200">
									Start free — register restaurant
									<ArrowRight className="h-4 w-4" />
								</Button>
							</Link>
							<Link href="/demo">
								<Button
									variant="outline"
									size="lg"
									className="gap-2 text-base h-13 px-8 rounded-xl transition-all duration-200 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white">
									<UtensilsCrossed className="h-4 w-4" />
									See the live demo
									<ArrowRight className="h-4 w-4" />
								</Button>
							</Link>
							<Button
								variant="ghost"
								size="lg"
								className="gap-2 text-base h-13 px-6 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
								onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
								<Play className="h-4 w-4" />
								Watch Demo
							</Button>
						</motion.div>

						{/* Count-up stats */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.65, duration: 0.6 }}
							className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto lg:mx-0">
							{HERO_STATS.map((s) => (
								<div key={s.label} className="rounded-xl border border-white/15 bg-white/10 backdrop-blur-md px-3 py-3 text-center lg:text-left">
									<div className="text-2xl sm:text-3xl font-extrabold text-white">
										<CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} duration={2.2} />
									</div>
									<div className="text-[11px] sm:text-xs text-white/70 mt-0.5">{s.label}</div>
								</div>
							))}
						</motion.div>

						{/* Social Proof */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.8 }}
							className="mt-10 flex items-center gap-4 lg:justify-start justify-center">
							<div className="flex -space-x-2">
								{["bg-violet-300", "bg-fuchsia-300", "bg-purple-300", "bg-indigo-300"].map((color, i) => (
									<div
										key={color}
										className={`w-8 h-8 rounded-full ${color} border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-800`}>
										{["PS", "RV", "MJ", "AR"][i]}
									</div>
								))}
							</div>
							<div className="text-sm">
								<div className="flex gap-0.5 mb-0.5">
									{[1, 2, 3, 4, 5].map((s) => (
										<Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
									))}
								</div>
								<span className="text-white/80">
									Loved by <strong className="text-white">500+</strong> restaurants
								</span>
							</div>
						</motion.div>
					</motion.div>

					{/* Hero Visual — main food image with floating UI cards */}
					<motion.div
						initial={{ opacity: 0, x: 40 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
						className="relative lg:min-h-[600px] flex items-center justify-center">
						<div className="relative w-full max-w-lg mx-auto">
							<motion.div
								animate={prefersReduced ? undefined : { y: [0, -8, 0] }}
								transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
								className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20">
								<div className="aspect-[4/5] relative">
									<Image
										src="/food-images/hero-restaurant.png"
										alt="Fine dining experience at an OrderWorder restaurant"
										fill
										sizes="(max-width: 768px) 100vw, 50vw"
										className="object-cover"
										priority
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
									<div className="absolute bottom-6 left-6 right-6">
										<div className="rounded-2xl border border-white/20 bg-white/15 backdrop-blur-md p-4">
											<div className="flex items-center gap-3">
												<div className="h-10 w-10 rounded-full bg-fuchsia-500/30 flex items-center justify-center">
													<Sparkles className="h-5 w-5 text-white" />
												</div>
												<div>
													<p className="text-sm font-semibold text-white">AI-Powered Ordering</p>
													<p className="text-xs text-white/70">Smart recommendations &amp; instant checkout</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							</motion.div>

							{/* Floating card - QR */}
							<motion.div
								animate={prefersReduced ? undefined : { y: [0, 6, 0], x: [0, 4, 0] }}
								transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
								className="absolute -top-4 -right-4 md:-right-8 rounded-2xl border border-white/20 bg-white/15 backdrop-blur-md p-3 shadow-soft-hover z-20">
								<div className="flex items-center gap-2">
									<div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center overflow-hidden">
										<Image src="/food-images/qr-scanning.png" alt="QR scan" width={32} height={32} className="rounded" />
									</div>
									<div>
										<p className="text-xs font-semibold text-white">Scan to Order</p>
										<p className="text-[10px] text-white/70">No app needed</p>
									</div>
								</div>
							</motion.div>

							{/* Floating card - Order Status */}
							<motion.div
								animate={prefersReduced ? undefined : { y: [0, -6, 0], x: [0, -3, 0] }}
								transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
								className="absolute -bottom-4 -left-4 md:-left-8 rounded-2xl border border-white/20 bg-white/15 backdrop-blur-md p-3 shadow-soft-hover z-20">
								<div className="flex items-center gap-2">
									<div className="h-8 w-8 rounded-full bg-emerald-500/30 flex items-center justify-center">
										<div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
									</div>
									<div>
										<p className="text-xs font-semibold text-white">Order Confirmed</p>
										<p className="text-[10px] text-white/70">Preparing your food</p>
									</div>
								</div>
							</motion.div>
						</div>
					</motion.div>
				</div>
			</motion.div>

			{/* Bottom fade into the rest of the page */}
			<div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />
		</section>
	);
}
