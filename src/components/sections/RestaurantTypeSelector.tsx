"use client";

import { motion, useReducedMotion } from "motion/react";
import {
	ArrowRight,
	Building2,
	Coffee,
	Flame,
	Store,
	UtensilsCrossed,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RestaurantType {
	id: string;
	label: string;
	icon: typeof Coffee;
	description: string;
	avgOrders: string;
	avgAOV: string;
	recommendedPlan: string;
	planPrice: string;
	planFeatures: string[];
	gradient: string;
	iconBg: string;
}

const TYPES: RestaurantType[] = [
	{
		id: "cafe",
		label: "Café & Bakery",
		icon: Coffee,
		description: "Small menu, high repeat customers. Perfect for loyalty-driven growth.",
		avgOrders: "200/month",
		avgAOV: "₹250",
		recommendedPlan: "Starter",
		planPrice: "₹999/mo",
		planFeatures: ["5 tables", "QR ordering", "Digital bills", "Razorpay & Stripe"],
		gradient: "from-violet-500/15 to-fuchsia-500/15",
		iconBg: "bg-violet-500/10",
	},
	{
		id: "qsr",
		label: "Quick Service",
		icon: Flame,
		description: "Fast turnover, high volume. Kitchen display and speed matter most.",
		avgOrders: "2,000/month",
		avgAOV: "₹180",
		recommendedPlan: "Pro",
		planPrice: "₹2,999/mo",
		planFeatures: ["20 tables", "Kitchen display", "AI recommendations", "WhatsApp campaigns"],
		gradient: "from-fuchsia-500/15 to-purple-500/15",
		iconBg: "bg-fuchsia-500/10",
	},
	{
		id: "full-service",
		label: "Full-Service Restaurant",
		icon: UtensilsCrossed,
		description: "Large menu, dine-in experience. Need analytics, reservations, and loyalty.",
		avgOrders: "800/month",
		avgAOV: "₹500",
		recommendedPlan: "Pro",
		planPrice: "₹2,999/mo",
		planFeatures: ["20 tables", "Full analytics", "Loyalty program", "Reservation system"],
		gradient: "from-purple-500/15 to-violet-500/15",
		iconBg: "bg-purple-500/10",
	},
	{
		id: "chain",
		label: "Multi-Location Chain",
		icon: Building2,
		description: "Centralized menu, consistent branding across all outlets.",
		avgOrders: "5,000+/month",
		avgAOV: "₹350",
		recommendedPlan: "Enterprise",
		planPrice: "Custom",
		planFeatures: ["Unlimited tables", "Dedicated manager", "Custom integrations", "SLA guarantee"],
		gradient: "from-violet-600/15 to-fuchsia-600/15",
		iconBg: "bg-violet-600/10",
	},
	{
		id: "foodtruck",
		label: "Food Truck / Stall",
		icon: Store,
		description: "Mobile ordering, quick setup, minimal overhead. Start free, grow fast.",
		avgOrders: "100/month",
		avgAOV: "₹150",
		recommendedPlan: "Starter",
		planPrice: "₹999/mo",
		planFeatures: ["5 tables", "QR ordering", "Digital bills", "Offline mode"],
		gradient: "from-fuchsia-400/15 to-violet-400/15",
		iconBg: "bg-fuchsia-400/10",
	},
];

export default function RestaurantTypeSelector() {
	const prefersReduced = useReducedMotion();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const selectedType = TYPES.find((t) => t.id === selectedId);

	return (
		<section id="restaurant-type" className="relative py-28 sm:py-36 bg-white overflow-hidden">
			{/* Ambient glow */}
			<div
				aria-hidden
				className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-50 blur-[120px]"
				style={{ background: "radial-gradient(circle, hsla(263, 70%, 50%, 0.06) 0%, transparent 70%)" }}
			/>

			<div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
				 viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					className="text-center mb-12 sm:mb-16">
					<div className="inline-flex items-center gap-2 rounded-full border border-violet-200/60 bg-violet-50/80 px-4 py-1.5 text-sm text-violet-700 mb-6 shadow-soft">
						<Zap className="h-3.5 w-3.5" />
						Find Your Plan
					</div>
					<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
						What kind of <span className="text-gradient">restaurant</span> do you run?
					</h2>
					<p className="mt-6 text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed">
						Tell us your setup and we&apos;ll recommend the perfect plan — with real numbers for your business.
					</p>
				</motion.div>

				{/* Restaurant type cards */}
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
					{TYPES.map((type, i) => {
						const Icon = type.icon;
						const isSelected = selectedId === type.id;
						return (
							<motion.button
								key={type.id}
								type="button"
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
							 viewport={{ once: true, margin: "-40px" }}
								transition={{
									duration: 0.4,
									delay: prefersReduced ? 0 : i * 0.08,
									ease: "easeOut",
								}}
								onClick={() => setSelectedId(isSelected ? null : type.id)}
								className={`group relative flex flex-col items-center gap-3 rounded-2xl p-5 transition-all duration-300 ease-out ${
									isSelected
										? "bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-soft-hover scale-[1.05] ring-2 ring-violet-400/30"
										: "bg-white border border-slate-200 shadow-soft hover:border-violet-200 hover:-translate-y-1 hover:shadow-soft-hover hover:ring-2 hover:ring-violet-200/40"
								}`}>
								{/* Icon */}
								<div
									className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
										isSelected
											? "bg-white/20 ring-1 ring-white/30"
											: "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-soft"
									}`}>
									<Icon className={`h-6 w-6 ${isSelected ? "text-white" : "text-white"}`} />
								</div>
								{/* Label */}
								<span
									className={`text-sm font-semibold leading-snug text-center ${
										isSelected ? "text-white" : "text-slate-900"
									}`}>
									{type.label}
								</span>
								{/* Avg orders hint */}
								<span
									className={`text-xs font-medium ${
										isSelected ? "text-white/70" : "text-slate-500"
									}`}>
									~{type.avgOrders}
								</span>
								{/* Selection indicator dot */}
								{isSelected && (
									<motion.div
										layoutId="type-indicator"
										className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-soft"
										transition={{ type: "spring", stiffness: 300, damping: 25 }}>
										<Zap className="h-3 w-3 text-violet-600" />
									</motion.div>
								)}
							</motion.button>
						);
					})}
				</div>

				{/* Recommended plan card (appears when type selected) */}
				{selectedType && (
					<motion.div
						key={selectedType.id}
						initial={{ opacity: 0, y: 20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						transition={{ duration: 0.4, ease: "easeOut" }}
						className="mt-10 relative overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/40 shadow-soft-hover">
						{/* Decorative corner glow */}
						<div
							aria-hidden
							className="pointer-events-none absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-60 blur-2xl"
							style={{ background: "radial-gradient(circle, hsla(263, 70%, 50%, 0.15) 0%, transparent 70%)" }}
						/>

						<div className="relative p-6 sm:p-8">
							<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
								{/* Plan badge */}
								<div className="flex items-center gap-3">
									<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-soft">
										<Zap className="h-6 w-6 text-white" />
									</div>
									<div>
										<div className="text-xs font-bold uppercase tracking-wider text-violet-600">
											Recommended for {selectedType.label}
										</div>
										<div className="text-xl font-bold text-slate-900">
											{selectedType.recommendedPlan} — {selectedType.planPrice}
										</div>
									</div>
								</div>

								{/* Quick stats */}
								<div className="flex items-center gap-4 sm:ml-auto">
									<div className="text-center">
										<div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg orders</div>
										<div className="text-sm font-bold text-slate-900">{selectedType.avgOrders}</div>
									</div>
									<div className="h-8 w-px bg-slate-200" aria-hidden />
									<div className="text-center">
										<div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg AOV</div>
										<div className="text-sm font-bold text-slate-900">{selectedType.avgAOV}</div>
									</div>
								</div>
							</div>

							{/* Features list */}
							<div className="mt-5 flex flex-wrap gap-3">
								{selectedType.planFeatures.map((feature) => (
									<span
										key={feature}
										className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 border border-violet-100 px-3 py-1.5 text-sm font-medium text-violet-700 shadow-soft">
										<ArrowRight className="h-3 w-3" />
										{feature}
									</span>
								))}
							</div>

							{/* CTA */}
							<div className="mt-6 flex flex-col sm:flex-row gap-3">
								<Link href="/signup" className="w-full sm:w-auto">
									<Button
										size="lg"
										className="h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-8 text-base font-semibold text-white shadow-soft transition-all duration-300 hover:scale-[1.02] hover:shadow-soft-hover sm:w-auto">
										Start with {selectedType.recommendedPlan}
										<ArrowRight className="h-4 w-4" />
									</Button>
								</Link>
								<p className="text-xs text-slate-500">
									14-day free trial · No credit card · Cancel anytime
								</p>
							</div>

							{/* Savings estimate */}
							<p className="mt-4 text-sm text-slate-700 leading-relaxed">
								{selectedType.description} With OrderWorder&apos;s 0% commission, you save up to ₹{selectedType.id === "chain" ? "12 lakh" : selectedType.id === "qsr" ? "6 lakh" : selectedType.id === "full-service" ? "4 lakh" : "1.5 lakh"} per year compared to aggregators taking 20–30% per order.
							</p>
						</div>
					</motion.div>
				)}
			</div>
		</section>
	);
}
