"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
	{
		name: "Starter",
		price: "₹999",
		period: "/month",
		description: "Perfect for small restaurants getting started with QR ordering.",
		features: ["Up to 5 tables", "Basic QR ordering", "Kitchen display", "Razorpay & Stripe", "Digital bills", "Email support"],
		cta: "Start Free Trial",
		popular: false,
	},
	{
		name: "Pro",
		price: "₹2,999",
		period: "/month",
		description: "For growing restaurants that need analytics and automation.",
		features: ["Up to 20 tables", "Everything in Starter", "AI recommendations", "Advanced analytics", "WhatsApp campaigns", "Loyalty program", "Priority support"],
		cta: "Start Free Trial",
		popular: true,
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
	},
];

export default function PricingSection() {
	return (
		<section id="pricing" className="relative py-24 sm:py-32 bg-muted/30">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.5, ease: "easeOut" }}
					className="text-center mb-16">
					<h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Simple, transparent pricing</h2>
					<p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Start free. No credit card required. Upgrade when you grow.</p>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
					{plans.map((plan, index) => (
						<motion.div
							key={plan.name}
							initial={{ opacity: 0, y: 24 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-50px" }}
							transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}>
							<Card className={`relative h-full ${plan.popular ? "border-primary shadow-lg shadow-primary/10 scale-105" : ""}`}>
								{plan.popular && (
									<div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
										Most Popular
									</div>
								)}
								<CardHeader>
									<CardTitle className="text-xl">{plan.name}</CardTitle>
									<div className="mt-2">
										<span className="text-4xl font-black text-foreground">{plan.price}</span>
										<span className="text-muted-foreground text-sm">{plan.period}</span>
									</div>
									<CardDescription className="mt-2">{plan.description}</CardDescription>
								</CardHeader>
								<CardContent>
									<ul className="space-y-3">
										{plan.features.map((feature) => (
											<li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
												<Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
												{feature}
											</li>
										))}
									</ul>
								</CardContent>
								<CardFooter>
									<Link href={plan.name === "Enterprise" ? "/contact" : "/signup"} className="w-full">
										<Button variant={plan.popular ? "default" : "outline"} className="w-full">
											{plan.cta}
										</Button>
									</Link>
								</CardFooter>
							</Card>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
