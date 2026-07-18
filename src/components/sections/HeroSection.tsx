"use client";

import { ArrowRight, Bot, CookingPot, QrCode } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
	{ icon: QrCode, label: "QR Ordering" },
	{ icon: Bot, label: "AI Assistant" },
	{ icon: CookingPot, label: "Kitchen Display" },
];

export default function HeroSection() {
	return (
		<section id="homepage" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
			<div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />

			<div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
				<motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
					<div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-8">
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
							<span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
						</span>
						Open-source restaurant platform
					</div>
				</motion.div>

				<motion.h1
					initial={{ opacity: 0, y: 24 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
					className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground leading-[1.1]">
					Contactless dining
					<br />
					<span className="text-primary">powered by AI</span>
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 24 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
					className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
					Replace paper menus and third-party platforms with your own branded QR ordering, AI recommendations, and real-time kitchen sync.
				</motion.p>

				<motion.div
					initial={{ opacity: 0, y: 24 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
					className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
					<Link href="/signup">
						<Button size="lg">
							Get started
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</Link>
					<Button variant="outline" size="lg" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
						Learn more
					</Button>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 32 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.65, ease: "easeOut" }}
					className="mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto">
					{features.map(({ icon: Icon, label }) => (
						<div key={label} className="flex flex-col items-center gap-2">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-card">
								<Icon className="h-5 w-5 text-primary" />
							</div>
							<span className="text-xs sm:text-sm text-muted-foreground font-medium">{label}</span>
						</div>
					))}
				</motion.div>
			</div>
		</section>
	);
}
