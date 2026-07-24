"use client";

import { motion, useReducedMotion } from "motion/react";
import { ShieldCheck, Lock, FileCheck2, IndianRupee, Wifi, ServerOff } from "lucide-react";

/**
 * TrustBadges — small credibility strip of certifications & guarantees.
 *
 * Sits between PartnersStripSection and FeaturesSection to reinforce
 * trust before the feature pitch. Renders a 3-column (mobile) / 6-column
 * (desktop) row of icon + label + sub-text badges.
 *
 * Honors prefers-reduced-motion by skipping the entrance animation.
 */
const BADGES = [
        {
                icon: ShieldCheck,
                title: "GST Compliant",
                sub: "NIC e-Invoice ready",
                color: "text-emerald-600 bg-emerald-50",
        },
        {
                icon: Lock,
                title: "PCI-DSS L1",
                sub: "Card data secured",
                color: "text-violet-600 bg-violet-50",
        },
        {
                icon: FileCheck2,
                title: "Audit Chain",
                sub: "Tamper-proof bills",
                color: "text-fuchsia-600 bg-fuchsia-50",
        },
        {
                icon: IndianRupee,
                title: "0% Commission",
                sub: "Yours to keep",
                color: "text-amber-600 bg-amber-50",
        },
        {
                icon: Wifi,
                title: "Offline Mode",
                sub: "Orders keep flowing",
                color: "text-sky-600 bg-sky-50",
        },
        {
                icon: ServerOff,
                title: "99.9% Uptime",
                sub: "SLA-backed",
                color: "text-rose-600 bg-rose-50",
        },
] as const;

export default function TrustBadges() {
        const prefersReduced = useReducedMotion();

        return (
                <section
                        aria-label="Compliance and trust badges"
                        className="border-y border-slate-100 bg-white"
                >
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                                <div className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-6">
                                        {BADGES.map((badge, i) => {
                                                const Icon = badge.icon;
                                                return (
                                                        <motion.div
                                                                key={badge.title}
                                                                initial={prefersReduced ? false : { opacity: 0, y: 12 }}
                                                                whileInView={{ opacity: 1, y: 0 }}
                                                                viewport={{ once: true, margin: "-40px" }}
                                                                transition={{
                                                                        duration: prefersReduced ? 0 : 0.4,
                                                                        delay: prefersReduced ? 0 : Math.min(i * 0.05, 0.3),
                                                                        ease: "easeOut",
                                                                }}
                                                                className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 px-2 py-3 text-center transition-all duration-200 hover:border-violet-200 hover:bg-white hover:shadow-soft"
                                                                title={`${badge.title} — ${badge.sub}`}
                                                        >
                                                                <span
                                                                        aria-hidden
                                                                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${badge.color} transition-transform duration-200 group-hover:scale-110`}
                                                                >
                                                                        <Icon className="h-4 w-4" />
                                                                </span>
                                                                <span className="text-xs font-bold text-slate-900 sm:text-sm">
                                                                        {badge.title}
                                                                </span>
                                                                <span className="hidden text-[11px] leading-tight text-slate-500 sm:block">
                                                                        {badge.sub}
                                                                </span>
                                                        </motion.div>
                                                );
                                        })}
                                </div>
                        </div>
                </section>
        );
}
