"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, IndianRupee, TrendingDown, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * SavingsCalculator — interactive ROI widget.
 *
 * Lets the visitor drag a slider to set their monthly order volume and
 * average order value, then instantly shows:
 *  - Estimated monthly commission they'd pay Swiggy/Zomato (~25%)
 *  - Estimated OrderWorder cost (flat subscription)
 *  - Net annual savings
 *
 * The goal is to make the value prop concrete and personal. Sits
 * between ComparisonSection and FAQSection.
 */

const ORDERWORDER_PRO_MONTHLY = 2999;
const AGGREGATOR_COMMISSION_PCT = 0.25;

const VOLUME_PRESETS = [
        { label: "Cafe", orders: 500, aov: 350 },
        { label: "QSR", orders: 1500, aov: 450 },
        { label: "Full-service", orders: 3000, aov: 800 },
        { label: "Chain", orders: 8000, aov: 650 },
];

function formatINR(n: number): string {
        if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
        if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
        if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
        return `₹${Math.round(n)}`;
}

export default function SavingsCalculator() {
        const prefersReduced = useReducedMotion();
        const [orders, setOrders] = useState(1500);
        const [aov, setAov] = useState(450);

        const calc = useMemo(() => {
                const monthlyRevenue = orders * aov;
                const aggregatorMonthly = monthlyRevenue * AGGREGATOR_COMMISSION_PCT;
                const orderWorderMonthly = ORDERWORDER_PRO_MONTHLY;
                const monthlySavings = aggregatorMonthly - orderWorderMonthly;
                const annualSavings = monthlySavings * 12;
                return {
                        monthlyRevenue,
                        aggregatorMonthly,
                        orderWorderMonthly,
                        monthlySavings,
                        annualSavings,
                        savingsPct: aggregatorMonthly > 0 ? (monthlySavings / aggregatorMonthly) * 100 : 0,
                };
        }, [orders, aov]);

        const applyPreset = (preset: { orders: number; aov: number }) => {
                setOrders(preset.orders);
                setAov(preset.aov);
        };

        return (
                <section
                        aria-label="Savings calculator"
                        className="relative py-20 sm:py-28 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 overflow-hidden"
                >
                        {/* Decorative blurred blobs */}
                        <div
                                aria-hidden
                                className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-300/20 blur-3xl"
                        />
                        <div
                                aria-hidden
                                className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-fuchsia-300/20 blur-3xl"
                        />

                        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                                <motion.div
                                        initial={prefersReduced ? false : { opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-80px" }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                        className="text-center mb-10"
                                >
                                        <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
                                                <Zap className="h-3.5 w-3.5" /> Savings Calculator
                                        </span>
                                        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                                                See how much you&apos;ll save
                                        </h2>
                                        <p className="mt-4 text-base text-slate-700 sm:text-lg max-w-2xl mx-auto">
                                                Drag the sliders to match your restaurant. We&apos;ll show the commission you&apos;d pay food-delivery apps vs. OrderWorder.
                                        </p>
                                </motion.div>

                                <motion.div
                                        initial={prefersReduced ? false : { opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-60px" }}
                                        transition={{ duration: 0.5, delay: prefersReduced ? 0 : 0.1, ease: "easeOut" }}
                                        className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-stretch"
                                >
                                        {/* Inputs */}
                                        <div className="lg:col-span-3 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-soft">
                                                {/* Presets */}
                                                <div className="mb-6">
                                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                                Quick presets
                                                        </span>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                                {VOLUME_PRESETS.map((p) => (
                                                                        <button
                                                                                key={p.label}
                                                                                type="button"
                                                                                onClick={() => applyPreset(p)}
                                                                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                                                                        >
                                                                                {p.label}
                                                                        </button>
                                                                ))}
                                                        </div>
                                                </div>

                                                {/* Orders / month slider */}
                                                <div className="mb-6">
                                                        <div className="flex items-baseline justify-between mb-2">
                                                                <label htmlFor="orders-slider" className="text-sm font-semibold text-slate-700">
                                                                        Monthly orders
                                                                </label>
                                                                <span className="text-2xl font-extrabold text-violet-600 tabular-nums">
                                                                        {orders.toLocaleString("en-IN")}
                                                                </span>
                                                        </div>
                                                        <input
                                                                id="orders-slider"
                                                                type="range"
                                                                min={100}
                                                                max={10000}
                                                                step={100}
                                                                value={orders}
                                                                onChange={(e) => setOrders(Number(e.target.value))}
                                                                className="w-full accent-violet-600 cursor-pointer"
                                                                aria-valuemin={100}
                                                                aria-valuemax={10000}
                                                                aria-valuenow={orders}
                                                        />
                                                        <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                                                                <span>100</span>
                                                                <span>10,000</span>
                                                        </div>
                                                </div>

                                                {/* AOV slider */}
                                                <div className="mb-2">
                                                        <div className="flex items-baseline justify-between mb-2">
                                                                <label htmlFor="aov-slider" className="text-sm font-semibold text-slate-700">
                                                                        Average order value
                                                                </label>
                                                                <span className="text-2xl font-extrabold text-violet-600 tabular-nums inline-flex items-center">
                                                                        <IndianRupee className="h-5 w-5" />
                                                                        {aov.toLocaleString("en-IN")}
                                                                </span>
                                                        </div>
                                                        <input
                                                                id="aov-slider"
                                                                type="range"
                                                                min={100}
                                                                max={2000}
                                                                step={50}
                                                                value={aov}
                                                                onChange={(e) => setAov(Number(e.target.value))}
                                                                className="w-full accent-violet-600 cursor-pointer"
                                                                aria-valuemin={100}
                                                                aria-valuemax={2000}
                                                                aria-valuenow={aov}
                                                        />
                                                        <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                                                                <span>₹100</span>
                                                                <span>₹2,000</span>
                                                        </div>
                                                </div>
                                        </div>

                                        {/* Results */}
                                        <div className="lg:col-span-2 flex flex-col gap-3">
                                                {/* Aggregator cost */}
                                                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5">
                                                        <div className="flex items-center gap-2 text-rose-700">
                                                                <TrendingDown className="h-4 w-4" />
                                                                <span className="text-xs font-bold uppercase tracking-wider">
                                                                        Aggregator commission (25%)
                                                                </span>
                                                        </div>
                                                        <div className="mt-2 text-3xl font-extrabold text-rose-700 tabular-nums">
                                                                {formatINR(calc.aggregatorMonthly)}
                                                                <span className="ml-1 text-sm font-medium text-rose-500">/mo</span>
                                                        </div>
                                                        <p className="mt-1 text-xs text-rose-600/80">
                                                                ~{formatINR(calc.aggregatorMonthly * 12)} / year lost to commission
                                                        </p>
                                                </div>

                                                {/* OrderWorder cost */}
                                                <div className="rounded-2xl border border-violet-300 bg-violet-50/80 p-5">
                                                        <div className="flex items-center gap-2 text-violet-700">
                                                                <Wallet className="h-4 w-4" />
                                                                <span className="text-xs font-bold uppercase tracking-wider">
                                                                        OrderWorder Pro
                                                                </span>
                                                        </div>
                                                        <div className="mt-2 text-3xl font-extrabold text-violet-700 tabular-nums">
                                                                {formatINR(calc.orderWorderMonthly)}
                                                                <span className="ml-1 text-sm font-medium text-violet-500">/mo</span>
                                                        </div>
                                                        <p className="mt-1 text-xs text-violet-600/80">
                                                                Flat subscription. 0% commission forever.
                                                        </p>
                                                </div>

                                                {/* Savings */}
                                                <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-soft">
                                                        <div className="flex items-center gap-2 text-emerald-100">
                                                                <ArrowRight className="h-4 w-4" />
                                                                <span className="text-xs font-bold uppercase tracking-wider">
                                                                        Your annual savings
                                                                </span>
                                                        </div>
                                                        <div className="mt-2 text-4xl font-extrabold tabular-nums">
                                                                {formatINR(Math.max(0, calc.annualSavings))}
                                                        </div>
                                                        <p className="mt-1 text-xs text-emerald-100/90">
                                                                vs. paying 25% commission to aggregators
                                                        </p>
                                                </div>
                                        </div>
                                </motion.div>

                                {/* CTA row */}
                                <motion.div
                                        initial={prefersReduced ? false : { opacity: 0, y: 16 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-40px" }}
                                        transition={{ duration: 0.4, delay: prefersReduced ? 0 : 0.2 }}
                                        className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
                                >
                                        <Link href="/signup">
                                                <Button size="lg" className="gap-2 rounded-xl px-7 h-12 bg-gradient-to-r from-violet-600 to-fuchsia-500 shadow-soft hover:shadow-soft-hover hover:scale-[1.02] transition-all">
                                                        Start saving today
                                                        <ArrowRight className="h-4 w-4" />
                                                </Button>
                                        </Link>
                                        <span className="text-xs text-slate-500">
                                                30-day money-back guarantee · No credit card required
                                        </span>
                                </motion.div>
                        </div>
                </section>
        );
}
