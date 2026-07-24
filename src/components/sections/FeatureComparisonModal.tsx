"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
	ArrowRight,
	Check,
	Layers,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface FeatureDetail {
	name: string;
	starter: boolean | string;
	pro: boolean | string;
	enterprise: boolean | string;
	category: string;
}

const FEATURES: FeatureDetail[] = [
	{ name: "QR table ordering", starter: true, pro: true, enterprise: true, category: "Core" },
	{ name: "Kitchen display system", starter: true, pro: true, enterprise: true, category: "Core" },
	{ name: "Digital bill PDF", starter: true, pro: true, enterprise: true, category: "Core" },
	{ name: "Razorpay & Stripe", starter: true, pro: true, enterprise: true, category: "Payments" },
	{ name: "Table limit", starter: "5", pro: "20", enterprise: "Unlimited", category: "Limits" },
	{ name: "Menu items limit", starter: "50", pro: "200", enterprise: "Unlimited", category: "Limits" },
	{ name: "AI recommendations", starter: false, pro: true, enterprise: true, category: "AI" },
	{ name: "Advanced analytics", starter: false, pro: true, enterprise: true, category: "Analytics" },
	{ name: "WhatsApp campaigns", starter: false, pro: true, enterprise: true, category: "Marketing" },
	{ name: "Loyalty program", starter: false, pro: true, enterprise: true, category: "Retention" },
	{ name: "Reservation system", starter: false, pro: true, enterprise: true, category: "Operations" },
	{ name: "GST e-invoicing", starter: true, pro: true, enterprise: true, category: "Compliance" },
	{ name: "Audit chain logging", starter: true, pro: true, enterprise: true, category: "Security" },
	{ name: "Offline mode", starter: true, pro: true, enterprise: true, category: "Reliability" },
	{ name: "Custom integrations", starter: false, pro: false, enterprise: true, category: "Enterprise" },
	{ name: "Dedicated account manager", starter: false, pro: false, enterprise: true, category: "Enterprise" },
	{ name: "SLA guarantee", starter: false, pro: false, enterprise: true, category: "Enterprise" },
	{ name: "On-premise option", starter: false, pro: false, enterprise: true, category: "Enterprise" },
	{ name: "24/7 phone support", starter: false, pro: "Priority", enterprise: true, category: "Support" },
	{ name: "Multi-location dashboard", starter: false, pro: false, enterprise: true, category: "Enterprise" },
];

const CATEGORIES = ["Core", "Payments", "Limits", "AI", "Analytics", "Marketing", "Retention", "Operations", "Compliance", "Security", "Reliability", "Enterprise", "Support"];

function renderValue(val: boolean | string) {
	if (typeof val === "boolean") {
		return val ? (
			<span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 ring-1 ring-violet-200">
				<Check className="h-3 w-3 text-violet-600" strokeWidth={3} />
			</span>
		) : (
			<span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
				<X className="h-3 w-3 text-slate-400" strokeWidth={3} />
			</span>
		);
	}
	return <span className="text-sm font-semibold text-slate-800">{val}</span>;
}

export default function FeatureComparisonModal() {
	const prefersReduced = useReducedMotion();
	const [open, setOpen] = useState(false);
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	const filteredFeatures = activeCategory
		? FEATURES.filter((f) => f.category === activeCategory)
		: FEATURES;

	return (
		<>
			{/* Trigger button */}
			<Button
				variant="outline"
				size="sm"
				onClick={() => setOpen(true)}
				className="gap-2 rounded-xl border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
				aria-haspopup="dialog"
			>
				<Layers className="h-4 w-4" />
				Compare all features
			</Button>

			{/* Modal */}
			<AnimatePresence>
				{open && (
					<>
						{/* Backdrop */}
						<motion.div
							key="feature-modal-backdrop"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: prefersReduced ? 0 : 0.2 }}
							className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
							onClick={() => setOpen(false)}
						/>
						{/* Dialog */}
						<motion.div
							key="feature-modal-content"
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							transition={{ duration: prefersReduced ? 0 : 0.3, ease: "easeOut" }}
							role="dialog"
							aria-modal="true"
							aria-label="Feature comparison across all plans"
							className="fixed inset-x-4 top-[5%] bottom-[5%] z-50 mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col"
						>
							{/* Header */}
							<div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-soft">
										<Layers className="h-5 w-5 text-white" />
									</div>
									<div>
										<h3 className="text-lg font-bold text-slate-900">Feature Comparison</h3>
										<p className="text-sm text-slate-500">See what&apos;s included in each plan</p>
									</div>
								</div>
								<button
									type="button"
									onClick={() => setOpen(false)}
									aria-label="Close feature comparison"
									className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
								>
									<X className="h-4 w-4" />
								</button>
							</div>

							{/* Category filter */}
							<div className="flex gap-2 px-6 py-3 border-b border-slate-100 overflow-x-auto max-w-full">
								<button
									type="button"
									onClick={() => setActiveCategory(null)}
									className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
										activeCategory === null
											? "bg-violet-600 text-white shadow-soft"
											: "bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-600"
									}`}>
									All
								</button>
								{CATEGORIES.map((cat) => (
									<button
										key={cat}
										type="button"
										onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
										className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
											activeCategory === cat
												? "bg-violet-600 text-white shadow-soft"
												: "bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-600"
										}`}>
										{cat}
									</button>
								))}
							</div>

							{/* Table */}
							<div className="flex-1 overflow-y-auto px-6 py-4">
								<table className="w-full">
									<thead>
										<tr className="border-b border-slate-200">
											<th className="pb-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Feature</th>
											<th className="pb-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
												<span className="inline-flex items-center gap-1">
													<span className="text-violet-600">Starter</span>
													<span className="text-slate-300">₹999</span>
												</span>
											</th>
											<th className="pb-3 text-center text-xs font-bold uppercase tracking-wider">
												<span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-2 py-0.5 text-[10px] text-white font-bold">
													Pro · ₹2,999
												</span>
											</th>
											<th className="pb-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
												<span>Enterprise</span>
											</th>
										</tr>
									</thead>
									<tbody>
										{filteredFeatures.map((feature, i) => (
											<tr
												key={feature.name}
												className={`border-b border-slate-100 transition-colors hover:bg-violet-50/30 ${
													i % 2 === 0 ? "bg-slate-50/50" : ""
												}`}>
												<td className="py-3 text-sm font-semibold text-slate-800">
													{feature.name}
													<span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
														{feature.category}
													</span>
												</td>
												<td className="py-3 text-center">{renderValue(feature.starter)}</td>
												<td className="py-3 text-center bg-violet-50/20">{renderValue(feature.pro)}</td>
												<td className="py-3 text-center">{renderValue(feature.enterprise)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Footer */}
							<div className="flex items-center justify-between gap-4 border-t border-slate-200 px-6 py-4">
								<p className="text-xs text-slate-500">
									All plans include 14-day free trial · No credit card required
								</p>
								<Link href="/signup">
									<Button
										size="sm"
										className="gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 text-white font-semibold shadow-soft hover:shadow-soft-hover hover:scale-[1.02] transition-all duration-200">
										Get started
										<ArrowRight className="h-3.5 w-3.5" />
									</Button>
								</Link>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</>
	);
}
