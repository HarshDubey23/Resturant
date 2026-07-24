"use client";

import { Activity, MapPin, Receipt, ShoppingCart, Store, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { CountUp } from "@/components/base/CountUp";

interface StatItem {
        to: number;
        prefix?: string;
        suffix?: string;
        label: string;
        icon: LucideIcon;
}

const STATS: StatItem[] = [
        { to: 500, suffix: "+", label: "Restaurants Powered", icon: Store },
        { to: 2, suffix: "M+", label: "Orders Processed", icon: ShoppingCart },
        { to: 48, prefix: "₹", suffix: "Cr+", label: "GST Filed", icon: Receipt },
        { to: 99, suffix: ".9%", label: "Uptime SLA", icon: Activity },
];

export default function StatsBarSection() {
        const prefersReduced = useReducedMotion();

        return (
                <section id="stats-bar" className="relative overflow-hidden bg-slate-950 py-12 sm:py-16">
                        {/* Subtle violet gradient mesh overlay */}
                        <div
                                aria-hidden
                                className="pointer-events-none absolute inset-0 opacity-70"
                                style={{
                                        backgroundImage:
                                                "radial-gradient(60% 120% at 0% 0%, hsla(263, 70%, 50%, 0.18) 0%, transparent 55%), radial-gradient(50% 100% at 100% 0%, hsla(295, 65%, 55%, 0.14) 0%, transparent 55%), radial-gradient(70% 120% at 50% 120%, hsla(280, 60%, 50%, 0.12) 0%, transparent 60%)",
                                }}
                        />
                        {/* Top hairline gradient divider */}
                        <div
                                aria-hidden
                                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"
                        />
                        {/* Bottom hairline gradient divider */}
                        <div
                                aria-hidden
                                className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent"
                        />
                        {/* Soft floating orbs for depth */}
                        <div aria-hidden className="pointer-events-none absolute -top-16 left-1/4 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl" />
                        <div aria-hidden className="pointer-events-none absolute -bottom-20 right-1/4 h-44 w-44 rounded-full bg-fuchsia-600/10 blur-3xl" />

                        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                                {/* Trusted badge */}
                                <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-40px" }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="mb-8 flex justify-center sm:mb-10">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
                                                <MapPin className="h-3.5 w-3.5 text-violet-400" />
                                                <span>Trusted across India</span>
                                                <span aria-hidden className="h-1 w-1 rounded-full bg-emerald-400" />
                                        </div>
                                </motion.div>

                                <div className="grid grid-cols-2 gap-y-10 sm:gap-y-12 md:grid-cols-4 md:gap-y-0">
                                        {STATS.map((stat, index) => {
                                                const Icon = stat.icon;
                                                return (
                                                        <motion.div
                                                                key={stat.label}
                                                                initial={{ opacity: 0, y: 16 }}
                                                                whileInView={{ opacity: 1, y: 0 }}
                                                                viewport={{ once: true, margin: "-40px" }}
                                                                transition={{
                                                                        duration: 0.5,
                                                                        delay: prefersReduced ? 0 : index * 0.1,
                                                                        ease: "easeOut",
                                                                }}
                                                                className={`relative flex flex-col items-center px-4 text-center ${
                                                                        index !== 0 ? "md:border-l md:border-white/10" : ""
                                                                }`}>
                                                                {/* Violet gradient icon circle */}
                                                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-soft ring-1 ring-white/15">
                                                                        <Icon className="h-5 w-5 text-white" />
                                                                </div>
                                                                {/* Large CountUp number */}
                                                                <div className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                                                                        <CountUp
                                                                                to={stat.to}
                                                                                prefix={stat.prefix}
                                                                                suffix={stat.suffix}
                                                                                duration={2}
                                                                                separator=""
                                                                        />
                                                                </div>
                                                                {/* Small uppercase label */}
                                                                <div className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-300 sm:text-xs">
                                                                        {stat.label}
                                                                </div>
                                                        </motion.div>
                                                );
                                        })}
                                </div>
                        </div>
                </section>
        );
}
