"use client";

import { ArrowRight, Play } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
	return (
		<section id="homepage" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
			<div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-background to-background pointer-events-none" />
			<div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl" />
			<div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl" />

			<div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
				<div className="grid lg:grid-cols-2 gap-12 items-center">
					<motion.div
						initial={{ opacity: 0, x: -32 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6, ease: "easeOut" }}
						className="text-center lg:text-left">
						<div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-8">
							<span className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
								<span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
							</span>
							No app needed. Just scan & order
						</div>

						<h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-foreground leading-[1.05]">
							Scan.
							<br />
							<span className="text-primary">Order.</span>
							<br />
							Enjoy.
						</h1>

						<p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
							Restaurant QR ordering made simple. Your customers scan, browse the menu, customize with notes &amp; spice levels, pay online, and get a
							digital bill — all from their table.
						</p>

						<div className="mt-8 flex flex-col sm:flex-row items-center lg:justify-start gap-4">
							<Link href="/signup">
								<Button size="lg" className="gap-2 text-base">
									Start Free Trial
									<ArrowRight className="h-4 w-4" />
								</Button>
							</Link>
							<Button
								variant="outline"
								size="lg"
								className="gap-2 text-base"
								onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
								<Play className="h-4 w-4" />
								Watch Demo
							</Button>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 32 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
						className="relative lg:min-h-[600px] flex items-center justify-center">
						<div className="relative w-full max-w-md mx-auto aspect-[4/5]">
							<motion.div
								animate={{ y: [0, -8, 0] }}
								transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
								className="absolute top-0 left-0 w-56 h-72 md:w-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-orange-100 to-amber-200 border border-orange-200/50 z-10">
								<div className="w-full h-full flex items-center justify-center text-6xl select-none">🧑‍🍳</div>
								<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-3">
									<p className="text-white text-xs font-medium">[placeholder: girl-eating-burger.png]</p>
								</div>
							</motion.div>
							<motion.div
								animate={{ y: [0, 6, 0] }}
								transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
								className="absolute bottom-0 right-0 w-48 h-60 md:w-56 md:h-72 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-amber-100 to-orange-200 border border-amber-200/50 z-20">
								<div className="w-full h-full flex items-center justify-center text-6xl select-none">🧑</div>
								<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-3">
									<p className="text-white text-xs font-medium">[placeholder: boy-eating-pizza.png]</p>
								</div>
							</motion.div>
						</div>
					</motion.div>
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
					className="mt-20 text-center">
					<p className="text-sm text-muted-foreground mb-6 font-medium">Trusted by 500+ restaurants</p>
					<div className="flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="h-8 w-24 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
								Logo {i + 1}
							</div>
						))}
					</div>
				</motion.div>
			</div>
		</section>
	);
}
