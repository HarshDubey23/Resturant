"use client";

import { ArrowUp, Code2, Heart, Sparkles } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

const FOOTER_LINKS: { heading: string; links: { label: string; href: string }[] }[] = [
	{
		heading: "Platform",
		links: [
			{ label: "Live demo", href: "/demo" },
			{ label: "Pricing", href: "/#pricing" },
			{ label: "How it works", href: "/#how-it-works" },
			{ label: "Restaurant signup", href: "/signup" },
		],
	},
	{
		heading: "Compliance",
		links: [
			{ label: "Audit chain", href: "/#page-showcase" },
			{ label: "GST & e-invoice", href: "/#page-showcase" },
			{ label: "Inventory variance", href: "/#page-showcase" },
			{ label: "Privacy", href: "/#features" },
		],
	},
	{
		heading: "Company",
		links: [
			{ label: "About", href: "/#about" },
			{ label: "Testimonials", href: "/#testimonials" },
			{ label: "Platform vision", href: "/#platform-vision" },
			{ label: "Sign in", href: "/#login" },
		],
	},
];

export function DemoFooter() {
	const ref = useRef<HTMLElement>(null);
	const prefersReduced = useReducedMotion();
	const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
	const bgY = useTransform(scrollYProgress, [0, 1], ["0%", prefersReduced ? "0%" : "-25%"]);

	return (
		<footer ref={ref} className="relative mt-10 overflow-hidden">
			<div className="absolute inset-0 -z-10">
				<motion.div style={{ y: bgY }} className="absolute inset-0 -top-1/4 h-[150%]">
					<Image src="/food-images/heroes/restaurant-night.png" alt="Restaurant glowing at night" fill sizes="100vw" className="object-cover" />
				</motion.div>
				<div className="absolute inset-0 bg-background/90" />
				<div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/85 to-background" />
			</div>

			<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-32 sm:pb-28">
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.6 }}
					className="grid lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10">
					<div>
						<div className="flex items-center gap-2">
							<div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
								<Sparkles className="h-5 w-5 text-primary" />
							</div>
							<span className="text-xl font-bold tracking-tight text-foreground">
								Order<span className="text-primary">Worder</span>
							</span>
						</div>
						<p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-sm">
							The restaurant operating system that cannot lie. Tamper-proof bills, theft-detecting inventory and zero-commission direct orders — all in one
							platform.
						</p>
						<Link
							href="/signup"
							className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-soft hover:shadow-soft-hover transition-shadow">
							Start free
							<ArrowUp className="h-4 w-4 -rotate-45" />
						</Link>
					</div>

					{FOOTER_LINKS.map((col) => (
						<div key={col.heading}>
							<h3 className="text-xs uppercase tracking-[0.2em] text-foreground/80 font-semibold">{col.heading}</h3>
							<ul className="mt-4 space-y-2.5">
								{col.links.map((l) => (
									<li key={l.label}>
										<a href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
											{l.label}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</motion.div>

				<div className="mt-14 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
					<p className="text-xs text-muted-foreground">
						© {new Date().getFullYear()} OrderWorder · Built with <Heart className="inline h-3 w-3 text-primary" /> for independent restaurants.
					</p>
					<div className="flex items-center gap-4 text-muted-foreground">
						<a
							href="https://github.com/HarshDubey23/Resturant"
							target="_blank"
							rel="noreferrer"
							className="hover:text-foreground transition-colors"
							aria-label="GitHub repository">
							<Code2 className="h-5 w-5" />
						</a>
						<button
							type="button"
							onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
							className="flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
							aria-label="Back to top">
							<ArrowUp className="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>
		</footer>
	);
}
