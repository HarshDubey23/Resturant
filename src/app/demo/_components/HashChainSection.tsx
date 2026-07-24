"use client";

import { Link2, Lock, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChainNode {
	id: string;
	label: string;
	hash: string;
	amount: string;
}

const NODES: ChainNode[] = [
	{ id: "n1", label: "Bill #1042", hash: "9f2a…c41e", amount: "₹1,240" },
	{ id: "n2", label: "Bill #1043", hash: "7b8d…2af0", amount: "₹860" },
	{ id: "n3", label: "Bill #1044", hash: "3c1e…9bd7", amount: "₹2,150" },
	{ id: "n4", label: "Bill #1045", hash: "e04f…1a6c", amount: "₹430" },
	{ id: "n5", label: "Bill #1046", hash: "6a92…d73b", amount: "₹1,580" },
];

export function HashChainSection() {
	const prefersReduced = useReducedMotion();
	const [active, setActive] = useState(0);

	useEffect(() => {
		if (prefersReduced) {
			setActive(NODES.length - 1);
			return;
		}
		const t = setInterval(() => {
			setActive((i) => (i + 1) % NODES.length);
		}, 1100);
		return () => clearInterval(t);
	}, [prefersReduced]);

	return (
		<section className="relative py-24 sm:py-32 overflow-hidden bg-card">
			{/* Sizzling thali bg */}
			<div className="absolute inset-0 -z-10">
				<Image src="/food-images/heroes/sizzling-thali.png" alt="A sizzling thali platter" fill sizes="100vw" className="object-cover" />
				<div className="absolute inset-0 bg-background/85" />
			</div>

			<div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
					<motion.div
						initial={{ opacity: 0, x: -24 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: "-80px" }}
						transition={{ duration: 0.6 }}
						className="text-foreground">
						<Badge className="mb-5 gap-1.5 bg-primary/15 text-primary border border-primary/30">
							<Lock className="h-3.5 w-3.5" /> Tamper-proof by construction
						</Badge>
						<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
							The POS that <span className="text-gradient">cannot lie</span>
						</h2>
						<p className="mt-6 text-lg text-muted-foreground leading-relaxed">
							Every bill, KOT and refund is SHA-256 hash-chained to the one before it. Edit a single digit after the fact and the chain breaks — visibly,
							instantly, and on a public verify endpoint your auditor can hit anytime.
						</p>
						<ul className="mt-8 space-y-3">
							{[
								"No delete button — refunds are credited, never erased",
								"Hash of the previous bill is embedded in the next",
								"Tamper breaks the chain on the public /api/audit-chain/verify route",
							].map((line) => (
								<li key={line} className="flex items-start gap-3 text-sm text-foreground/90">
									<ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
									<span>{line}</span>
								</li>
							))}
						</ul>
					</motion.div>

					{/* Hash chain viz */}
					<motion.div
						initial={{ opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-80px" }}
						transition={{ duration: 0.6, delay: 0.15 }}
						className="relative rounded-2xl border border-border/60 bg-background/60 backdrop-blur-md p-5 sm:p-6 shadow-soft-hover">
						<div className="flex items-center justify-between mb-5">
							<div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live bill chain</div>
							<div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
								<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
								Chain intact
							</div>
						</div>

						{/* Nodes */}
						<div className="space-y-3">
							{NODES.map((node, i) => {
								const isLit = i <= active;
								const isHead = i === active;
								return (
									<div key={node.id} className="relative">
										<motion.div
											initial={false}
											animate={{
												opacity: isLit ? 1 : 0.4,
												borderColor: isHead ? "rgb(124 58 237 / 0.6)" : isLit ? "rgb(124 58 237 / 0.25)" : "rgb(148 163 184 / 0.15)",
												backgroundColor: isHead ? "rgb(124 58 237 / 0.12)" : isLit ? "rgb(124 58 237 / 0.04)" : "transparent",
											}}
											transition={{ duration: 0.4 }}
											className="relative flex items-center gap-3 rounded-xl border px-3 py-2.5">
											<div
												className={cn(
													"flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
													isHead
														? "border-primary bg-primary text-primary-foreground"
														: isLit
															? "border-primary/40 bg-primary/10 text-primary"
															: "border-border bg-muted text-muted-foreground",
												)}>
												{isHead ? <Lock className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between gap-2">
													<span className="text-sm font-semibold text-foreground">{node.label}</span>
													<span className="text-sm font-bold text-foreground">{node.amount}</span>
												</div>
												<div className="flex items-center gap-1.5 mt-0.5">
													<span className="text-[10px] uppercase tracking-wide text-muted-foreground">sha256</span>
													<code className="text-[11px] font-mono text-primary/80">{node.hash}</code>
												</div>
											</div>
										</motion.div>

										{/* Connector */}
										{i < NODES.length - 1 && (
											<div className="flex justify-center py-1">
												<div className="relative h-5 w-px bg-border overflow-hidden">
													<motion.div
														initial={{ y: "-100%" }}
														animate={i < active ? { y: "100%" } : { y: "-100%" }}
														transition={{
															duration: 0.6,
															ease: "easeInOut",
															repeat: i < active ? Infinity : 0,
															repeatDelay: 0.2,
														}}
														className="absolute inset-x-0 top-0 h-3 bg-primary"
													/>
													<Link2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
												</div>
											</div>
										)}
									</div>
								);
							})}
						</div>

						<div className="mt-5 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs">
							<span className="text-muted-foreground">Verify endpoint</span>
							<code className="font-mono text-foreground/80">/api/audit-chain/verify</code>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
