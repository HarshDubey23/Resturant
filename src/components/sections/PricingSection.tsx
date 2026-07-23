"use client";

import { Check, Sparkles, Zap } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const plans = [
	{
		name: "Starter",
		price: "₹999",
		period: "/month",
		description: "Perfect for small restaurants getting started with QR ordering.",
		features: ["Up to 5 tables", "Basic QR ordering", "Kitchen display", "Razorpay & Stripe", "Digital bills", "Email support"],
		cta: "Start Free Trial",
		popular: false,
		gradient: "from-violet-500/5 to-fuchsia-500/5",
	},
	{
		name: "Pro",
		price: "₹2,999",
		period: "/month",
		description: "For growing restaurants that need analytics and automation.",
		features: ["Up to 20 tables", "Everything in Starter", "AI recommendations", "Advanced analytics", "WhatsApp campaigns", "Loyalty program", "Priority support"],
		cta: "Start Free Trial",
		popular: true,
		gradient: "from-violet-600/5 to-purple-500/5",
	},
	{
		name: "Enterprise",
		price: "Custom",
		period: "",
		description: "For large chains with custom requirements and dedicated support.",
		features: [
			"Unlimited tables",
			"Everything in Pro",
			"Custom integrations",
			"Dedicated account manager",
			"SLA guarantee",
			"On-premise option",
			"24/7 phone support",
		],
		cta: "Contact Sales",
		popular: false,
		gradient: "from-purple-500/5 to-pink-500/5",
	},
];

export default function PricingSection() {
	return (
		<section id="pricing" className="relative py-28 sm:py-36 bg-slate-50">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					className="text-center mb-20">
					<div className="inline-flex items-center gap-2 rounded-full border border-slate-200/50 bg-white/80 px-4 py-1.5 text-sm text-slate-500 mb-6 shadow-soft">
						<Zap className="h-3.5 w-3.5 text-violet-600" />
						Pricing
					</div>
					<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
						Simple, <span className="text-gradient">transparent</span> pricing
					</h2>
					<p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">Start free. No credit card required. Upgrade when you grow.</p>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
					{plans.map((plan, index) => (
						<motion.div
							key={plan.name}
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-50px" }}
							transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
							className={`relative rounded-2xl border bg-white overflow-hidden transition-all duration-200 ease-out ${plan.popular ? "border-violet-600 shadow-soft-hover scale-[1.03] z-10" : "border-slate-100 shadow-soft hover:shadow-soft-hover hover:-translate-y-0.5"}`}>
							{/* Popular badge */}
							{plan.popular && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-500" />}
							{plan.popular && (
								<div className="absolute top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-violet-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-soft">
									<Sparkles className="h-3 w-3" />
									Most Popular
								</div>
							)}

							<div className={`p-6 ${plan.popular ? "pt-14" : ""}`}>
								<h3 className="text-xl font-bold text-slate-900 tracking-tight">{plan.name}</h3>
								<div className="mt-4">
									<span className="text-5xl font-extrabold text-slate-900">{plan.price}</span>
									<span className="text-slate-500 text-sm">{plan.period}</span>
								</div>
								<p className="mt-3 text-sm text-slate-500 leading-relaxed">{plan.description}</p>

								<hr className="my-6 border-slate-100" />

								<ul className="space-y-3 mb-8">
									{plan.features.map((feature) => (
										<li key={feature} className="flex items-start gap-3 text-sm text-slate-500">
											<div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600/10 shrink-0">
												<Check className="h-3 w-3 text-violet-600" />
											</div>
											{feature}
										</li>
									))}
								</ul>

								<Link href={plan.name === "Enterprise" ? "/contact" : "/signup"} className="block">
									<Button
										variant={plan.popular ? "default" : "outline"}
										className={`w-full h-12 rounded-xl text-base font-semibold ${plan.popular ? "shadow-soft" : ""}`}>
										{plan.cta}
									</Button>
								</Link>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
