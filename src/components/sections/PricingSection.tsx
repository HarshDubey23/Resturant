"use client";

import { Check, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const plans = [
        {
                name: "Starter",
                price: "₹999",
                priceAnnual: "₹799",
                period: "/month",
                description: "Perfect for small restaurants getting started with QR ordering.",
                features: ["Up to 5 tables", "Basic QR ordering", "Kitchen display", "Razorpay & Stripe", "Digital bills", "Email support"],
                cta: "Start Free Trial",
                popular: false,
                gradient: "from-violet-500/5 to-fuchsia-500/5",
                bestFor: "Cafes & food trucks",
        },
        {
                name: "Pro",
                price: "₹2,999",
                priceAnnual: "₹2,399",
                period: "/month",
                description: "For growing restaurants that need analytics and automation.",
                features: ["Up to 20 tables", "Everything in Starter", "AI recommendations", "Advanced analytics", "WhatsApp campaigns", "Loyalty program", "Priority support"],
                cta: "Start Free Trial",
                popular: true,
                gradient: "from-violet-600/5 to-purple-500/5",
                bestFor: "Full-service restaurants",
        },
        {
                name: "Enterprise",
                price: "Custom",
                priceAnnual: "Custom",
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
                bestFor: "Multi-location chains",
        },
];

export default function PricingSection() {
        const [annual, setAnnual] = useState(false);

        return (
                <section id="pricing" className="relative py-28 sm:py-36 bg-slate-50 overflow-hidden">
                        {/* Subtle background accents */}
                        <div
                                aria-hidden
                                className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
                                style={{ background: "radial-gradient(circle, hsla(263, 70%, 50%, 0.06) 0%, transparent 70%)" }}
                        />

                        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                                <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-100px" }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        className="text-center mb-12">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/50 bg-white/80 px-4 py-1.5 text-sm text-slate-500 mb-6 shadow-soft">
                                                <Zap className="h-3.5 w-3.5 text-violet-600" />
                                                Pricing
                                        </div>
                                        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                                                Simple, <span className="text-gradient">transparent</span> pricing
                                        </h2>
                                        <p className="mt-6 text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed">
                                                Start free. No credit card required. Upgrade when you grow.
                                        </p>
                                </motion.div>

                                {/* Monthly / Annual toggle */}
                                <motion.div
                                        initial={{ opacity: 0, y: 16 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-80px" }}
                                        transition={{ duration: 0.4, delay: 0.15 }}
                                        className="flex items-center justify-center gap-3 mb-12">
                                        <span className={`text-sm font-medium transition-colors ${!annual ? "text-slate-900" : "text-slate-400"}`}>Monthly</span>
                                        <button
                                                type="button"
                                                onClick={() => setAnnual((v) => !v)}
                                                aria-pressed={annual}
                                                aria-label="Toggle annual billing"
                                                className="relative h-7 w-12 rounded-full bg-violet-100 border border-violet-200 transition-colors">
                                                <span
                                                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-soft transition-all duration-300 ${
                                                                annual ? "left-6" : "left-0.5"
                                                        }`}
                                                />
                                        </button>
                                        <span className={`text-sm font-medium transition-colors ${annual ? "text-slate-900" : "text-slate-400"}`}>Annual</span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                                                Save 20%
                                        </span>
                                </motion.div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
                                        {plans.map((plan, index) => (
                                                <motion.div
                                                        key={plan.name}
                                                        initial={{ opacity: 0, y: 30 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                        viewport={{ once: true, margin: "-50px" }}
                                                        transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                                                        className={`relative rounded-2xl transition-all duration-300 ease-out ${
                                                                plan.popular
                                                                        ? "p-px bg-gradient-to-br from-violet-500 via-fuchsia-500 to-violet-600 md:scale-[1.05] z-10 hover:shadow-soft-hover hover:md:scale-[1.07]"
                                                                        : "p-px bg-transparent hover:-translate-y-2 hover:ring-2 hover:ring-violet-200/60 hover:shadow-soft-hover"
                                                        }`}>
                                                        <div
                                                                className={`relative h-full rounded-2xl border bg-white overflow-hidden transition-all duration-300 ease-out ${
                                                                        plan.popular
                                                                                ? "border-transparent shadow-soft-hover"
                                                                                : "border-slate-200 shadow-soft hover:border-violet-200"
                                                                }`}>
                                                                {/* Subtle gradient background behind popular plan */}
                                                                {plan.popular && (
                                                                        <div
                                                                                aria-hidden
                                                                                className="absolute inset-0 pointer-events-none"
                                                                                style={{
                                                                                        background:
                                                                                                "radial-gradient(80% 60% at 50% 0%, hsla(263, 70%, 50%, 0.06) 0%, transparent 70%)",
                                                                                }}
                                                                        />
                                                                )}
                                                                {/* Popular top bar */}
                                                                {plan.popular && (
                                                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-500" />
                                                                )}
                                                                {plan.popular && (
                                                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-soft">
                                                                                <Sparkles className="h-3 w-3" />
                                                                                Most Popular
                                                                        </div>
                                                                )}

                                                                <div className={`relative p-6 ${plan.popular ? "pt-14" : ""}`}>
                                                                        {/* "Best for" tag */}
                                                                        <div className="mb-3">
                                                                                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-violet-700 border border-violet-100">
                                                                                        Best for {plan.bestFor}
                                                                                </span>
                                                                        </div>

                                                                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">{plan.name}</h3>
                                                                        <div className="mt-4 flex items-baseline gap-1">
                                                                                <span className="text-5xl font-extrabold text-slate-900">
                                                                                        {annual ? plan.priceAnnual : plan.price}
                                                                                </span>
                                                                                <span className="text-slate-500 text-sm">{plan.period}</span>
                                                                        </div>
                                                                        <p className="mt-3 text-sm text-slate-600 leading-relaxed">{plan.description}</p>

                                                                        <hr className="my-6 border-slate-100" />

                                                                        <ul className="space-y-3 mb-8">
                                                                                {plan.features.map((feature) => (
                                                                                        <li key={feature} className="flex items-start gap-3 text-sm text-slate-700">
                                                                                                <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 shrink-0 shadow-soft">
                                                                                                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                                                                                                </div>
                                                                                                {feature}
                                                                                        </li>
                                                                                ))}
                                                                        </ul>

                                                                        <Link href={plan.name === "Enterprise" ? "/contact" : "/signup"} className="block">
                                                                                <Button
                                                                                        variant={plan.popular ? "default" : "outline"}
                                                                                        className={`w-full h-12 rounded-xl text-base font-semibold transition-all duration-300 hover:scale-[1.02] ${
                                                                                                plan.popular
                                                                                                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 shadow-soft hover:shadow-soft-hover"
                                                                                                        : ""
                                                                                        }`}>
                                                                                        {plan.cta}
                                                                                </Button>
                                                                        </Link>
                                                                </div>
                                                        </div>
                                                </motion.div>
                                        ))}
                                </div>

                                {/* Money-back guarantee badge */}
                                <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-80px" }}
                                        transition={{ duration: 0.5, delay: 0.3 }}
                                        className="mt-12 flex justify-center">
                                        <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-soft backdrop-blur-sm">
                                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                                30-day money-back guarantee
                                        </div>
                                </motion.div>
                        </div>
                </section>
        );
}
