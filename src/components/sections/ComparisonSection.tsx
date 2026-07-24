"use client";

import { ArrowRight, Check, Shield, TrendingDown, X, Zap } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Sentiment = "positive" | "negative" | "neutral";

interface ComparisonCell {
        value: string;
        sentiment: Sentiment;
}

interface ComparisonRow {
        feature: string;
        orderWorder: ComparisonCell;
        aggregator: ComparisonCell;
}

const ROWS: ComparisonRow[] = [
        {
                feature: "Commission per order",
                orderWorder: { value: "0%", sentiment: "positive" },
                aggregator: { value: "20–30%", sentiment: "negative" },
        },
        {
                feature: "Customer data ownership",
                orderWorder: { value: "Full ownership", sentiment: "positive" },
                aggregator: { value: "They own it", sentiment: "negative" },
        },
        {
                feature: "Branded ordering page",
                orderWorder: { value: "Yes — your domain", sentiment: "positive" },
                aggregator: { value: "No — their page", sentiment: "negative" },
        },
        {
                feature: "Direct payout",
                orderWorder: { value: "Instant", sentiment: "positive" },
                aggregator: { value: "7–14 days", sentiment: "negative" },
        },
        {
                feature: "WhatsApp marketing",
                orderWorder: { value: "Included", sentiment: "positive" },
                aggregator: { value: "Not available", sentiment: "negative" },
        },
        {
                feature: "GST compliance",
                orderWorder: { value: "Built-in", sentiment: "positive" },
                aggregator: { value: "Manual", sentiment: "negative" },
        },
        {
                feature: "Loyalty program",
                orderWorder: { value: "Included", sentiment: "positive" },
                aggregator: { value: "Limited", sentiment: "neutral" },
        },
        {
                feature: "Analytics dashboard",
                orderWorder: { value: "Full analytics", sentiment: "positive" },
                aggregator: { value: "Limited", sentiment: "neutral" },
        },
];

function OrderWorderCell({ value, sentiment }: ComparisonCell) {
        // OrderWorder column is on a violet gradient bg with white text.
        // Show a white Check for positive cells; for neutral we still render the text in white.
        return (
                <div className="flex items-center justify-center gap-2 text-center">
                        {sentiment === "positive" ? (
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
                                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                                </span>
                        ) : null}
                        <span className="text-sm font-semibold text-white sm:text-base">{value}</span>
                </div>
        );
}

function AggregatorCell({ value, sentiment }: ComparisonCell) {
        // Aggregator column is muted; slate X for negatives (softer, brand-aligned),
        // violet Check for positives, slate text for neutral.
        return (
                <div className="flex items-center justify-center gap-2 text-center">
                        {sentiment === "negative" ? (
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
                                        <X className="h-3 w-3 text-slate-500" strokeWidth={3} />
                                </span>
                        ) : sentiment === "positive" ? (
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 ring-1 ring-violet-200">
                                        <Check className="h-3 w-3 text-violet-600" strokeWidth={3} />
                                </span>
                        ) : null}
                        <span
                                className={`text-sm sm:text-base ${
                                        sentiment === "negative" ? "font-medium text-slate-500" : "font-medium text-slate-700"
                                }`}>
                                {value}
                        </span>
                </div>
        );
}

const rowVariants = (delay: number) => ({
        initial: { opacity: 0, y: 12 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-40px" as const },
        transition: { duration: 0.4, delay, ease: "easeOut" as const },
});

export default function ComparisonSection() {
        const prefersReduced = useReducedMotion();
        const stagger = (i: number) => (prefersReduced ? 0 : i * 0.07);

        return (
                <section id="comparison" className="relative overflow-hidden bg-white py-24 sm:py-32">
                        {/* Subtle violet ambient orbs */}
                        <div
                                aria-hidden
                                className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[640px] -translate-x-1/2 rounded-full opacity-60 blur-[120px]"
                                style={{ background: "radial-gradient(circle, hsla(263, 70%, 50%, 0.08) 0%, transparent 70%)" }}
                        />
                        <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-fuchsia-200/30 blur-3xl" />

                        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                                {/* Header */}
                                <motion.div
                                        initial={{ opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-100px" }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        className="mb-12 text-center sm:mb-16">
                                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200/60 bg-violet-50/80 px-4 py-1.5 text-sm text-violet-700 shadow-soft">
                                                <Shield className="h-3.5 w-3.5" />
                                                The OrderWorder Advantage
                                        </div>
                                        <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                                                Why pay <span className="text-gradient">20–30% commission</span> when you can pay 0%?
                                        </h2>
                                        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-700">
                                                Food aggregators take a cut of every order and own your customer relationship. OrderWorder gives you the
                                                tools to sell direct — keep your margins, your data, and your brand.
                                        </p>
                                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                <span className="inline-flex items-center gap-1.5">
                                                        <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
                                                        Save up to ₹6 lakh / year
                                                </span>
                                                <span aria-hidden className="h-1 w-1 rounded-full bg-slate-300" />
                                                <span className="inline-flex items-center gap-1.5">
                                                        <Zap className="h-3.5 w-3.5 text-violet-500" />
                                                        Instant payouts
                                                </span>
                                        </div>
                                </motion.div>

                                {/* Desktop table (md+): 3-column panel layout so OrderWorder sits as one elevated card */}
                                <div className="hidden items-stretch gap-4 md:grid md:grid-cols-3">
                                        {/* Column 1 — Feature names */}
                                        <div className="flex flex-col">
                                                {/* Header cell */}
                                                <div className="flex h-16 items-end px-2 pb-3">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Feature</span>
                                                </div>
                                                {ROWS.map((row, i) => (
                                                        <motion.div
                                                                key={row.feature}
                                                                {...rowVariants(stagger(i))}
                                                                className="flex min-h-[76px] items-center px-2 py-5 rounded-lg transition-colors duration-150 hover:bg-violet-50/40">
                                                                <span className="text-sm font-bold text-slate-800 sm:text-base">{row.feature}</span>
                                                        </motion.div>
                                                ))}
                                        </div>

                                        {/* Column 2 — OrderWorder (highlighted card) */}
                                        <div className="relative z-10 flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-soft md:scale-[1.02]">
                                                {/* Decorative top glow */}
                                                <div
                                                        aria-hidden
                                                        className="pointer-events-none absolute -top-12 left-1/2 h-32 w-48 -translate-x-1/2 rounded-full bg-white/20 blur-2xl"
                                                />
                                                {/* Header cell */}
                                                <div className="relative flex h-16 items-end justify-center px-4 pb-3">
                                                        <div className="flex items-center gap-2">
                                                                <span className="text-sm font-extrabold uppercase tracking-wider text-white">OrderWorder</span>
                                                                <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-white/30">
                                                                        Recommended
                                                                </span>
                                                        </div>
                                                </div>
                                                {ROWS.map((row, i) => (
                                                        <motion.div
                                                                key={row.feature}
                                                                {...rowVariants(stagger(i))}
                                                                className={`relative flex min-h-[76px] items-center justify-center px-4 py-5 transition-colors duration-150 ${
                                                                        i !== ROWS.length - 1 ? "border-b border-white/15" : ""
                                                                }`}>
                                                                <OrderWorderCell {...row.orderWorder} />
                                                        </motion.div>
                                                ))}
                                        </div>

                                        {/* Column 3 — Aggregator (muted card) */}
                                        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-50">
                                                {/* Header cell */}
                                                <div className="flex h-16 items-end justify-center px-4 pb-3">
                                                        <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Swiggy / Zomato</span>
                                                </div>
                                                {ROWS.map((row, i) => (
                                                        <motion.div
                                                                key={row.feature}
                                                                {...rowVariants(stagger(i))}
                                                                className={`flex min-h-[76px] items-center justify-center px-4 py-5 rounded-lg transition-colors duration-150 hover:bg-slate-100/60 ${
                                                                        i !== ROWS.length - 1 ? "border-b border-slate-200/80" : ""
                                                                }`}>
                                                                <AggregatorCell {...row.aggregator} />
                                                        </motion.div>
                                                ))}
                                        </div>
                                </div>

                                {/* Mobile cards (below md): each feature becomes a card with 3 rows */}
                                <div className="space-y-4 md:hidden">
                                        {ROWS.map((row, i) => (
                                                <motion.div
                                                        key={row.feature}
                                                        initial={{ opacity: 0, y: 16 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                        viewport={{ once: true, margin: "-30px" }}
                                                        transition={{
                                                                duration: 0.4,
                                                                delay: prefersReduced ? 0 : i * 0.07,
                                                                ease: "easeOut",
                                                        }}
                                                        className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-soft">
                                                        {/* Row 1: Feature name */}
                                                        <div className="border-b border-slate-100 px-4 py-3">
                                                                <span className="text-sm font-bold text-slate-900">{row.feature}</span>
                                                        </div>
                                                        {/* Row 2: OrderWorder value */}
                                                        <div className="relative px-4 py-3">
                                                                <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-500" />
                                                                <div className="relative">
                                                                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/70">OrderWorder</div>
                                                                        <OrderWorderCell {...row.orderWorder} />
                                                                </div>
                                                        </div>
                                                        {/* Row 3: Aggregator value */}
                                                        <div className="bg-slate-50 px-4 py-3">
                                                                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Swiggy / Zomato</div>
                                                                <AggregatorCell {...row.aggregator} />
                                                        </div>
                                                </motion.div>
                                        ))}
                                </div>

                                {/* CTA */}
                                <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-80px" }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className="mt-12 flex flex-col items-center gap-4 sm:mt-16">
                                        <Link href="/signup" className="w-full sm:w-auto">
                                                <Button
                                                        size="lg"
                                                        className="h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-8 text-base font-semibold text-white shadow-soft transition-all duration-300 hover:scale-[1.02] hover:shadow-soft-hover sm:w-auto">
                                                        Get started — 0% commission
                                                        <ArrowRight className="h-4 w-4" />
                                                </Button>
                                        </Link>
                                        <p className="text-xs text-slate-500">14-day free trial · No credit card required · Cancel anytime</p>
                                </motion.div>
                        </div>
                </section>
        );
}
