"use client";

import { ArrowRight, Sparkles, Star, TrendingUp, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const stats = [
        { icon: Users, value: "500+", label: "restaurants" },
        { icon: TrendingUp, value: "2M+", label: "orders" },
        { icon: Star, value: "4.9★", label: "rating" },
];

export default function CtaSection() {
        const prefersReduced = useReducedMotion();
        return (
                <section className="relative py-28 sm:py-36 overflow-hidden">
                        {/* Full-bleed restaurant-night background */}
                        <div className="absolute inset-0 -z-20">
                                <Image src="/food-images/heroes/restaurant-night.png" alt="A restaurant glowing at night" fill priority sizes="100vw" className="object-cover" />
                        </div>
                        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-950/85" />
                        <div className="absolute inset-0 -z-10 bg-primary/10" />

                        {/* Animated gradient overlay */}
                        <motion.div
                                aria-hidden
                                className="absolute inset-0 -z-10 pointer-events-none opacity-40"
                                style={{
                                        background:
                                                "linear-gradient(120deg, hsla(263, 70%, 50%, 0.25) 0%, hsla(280, 65%, 55%, 0.18) 25%, hsla(300, 60%, 48%, 0.18) 50%, hsla(280, 65%, 55%, 0.18) 75%, hsla(263, 70%, 50%, 0.25) 100%)",
                                        backgroundSize: "300% 100%",
                                }}
                                animate={prefersReduced ? {} : { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                                transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                        />

                        {/* Subtle dotted pattern overlay */}
                        <div
                                aria-hidden
                                className="absolute inset-0 -z-10 pointer-events-none opacity-20"
                                style={{
                                        backgroundImage:
                                                "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
                                        backgroundSize: "28px 28px",
                                        maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, black 0%, transparent 80%)",
                                }}
                        />

                        {/* Floating particles / sparkles */}
                        {[
                                { top: "15%", left: "10%", size: 6, delay: 0 },
                                { top: "25%", left: "85%", size: 4, delay: 0.4 },
                                { top: "60%", left: "8%", size: 5, delay: 0.8 },
                                { top: "70%", left: "90%", size: 4, delay: 1.2 },
                                { top: "40%", left: "92%", size: 3, delay: 0.6 },
                                { top: "80%", left: "20%", size: 5, delay: 1.6 },
                                { top: "12%", left: "60%", size: 3, delay: 2 },
                                { top: "55%", left: "70%", size: 4, delay: 1 },
                        ].map((p, i) => (
                                <motion.div
                                        key={i}
                                        aria-hidden
                                        className="absolute rounded-full bg-white/40 pointer-events-none"
                                        style={{ top: p.top, left: p.left, width: p.size, height: p.size }}
                                        animate={prefersReduced ? {} : { y: [0, -20, 0], opacity: [0.2, 0.8, 0.2] }}
                                        transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
                                />
                        ))}

                        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                                <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-100px" }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}>
                                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1.5 text-sm text-white/90 mb-8">
                                                <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
                                                Get Started Today
                                        </div>
                                        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                                                Ready to{" "}
                                                <span className="bg-gradient-to-r from-fuchsia-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                                                        transform
                                                </span>{" "}
                                                your restaurant?
                                        </h2>
                                        <p className="mt-6 text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
                                                Join the restaurants already using OrderWorder. Free to start, no commitment required.
                                        </p>
                                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                                                <Link href="/signup">
                                                        <Button
                                                                size="lg"
                                                                className="gap-2 text-base h-13 px-10 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 shadow-soft hover:shadow-soft-hover hover:scale-105 transition-all duration-300">
                                                                Get started
                                                                <ArrowRight className="h-4 w-4" />
                                                        </Button>
                                                </Link>
                                                <Link href="/demo">
                                                        <Button
                                                                variant="outline"
                                                                size="lg"
                                                                className="gap-2 text-base h-13 px-10 rounded-xl transition-all duration-300 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white hover:scale-105">
                                                                Try Live Demo
                                                                <ArrowRight className="h-4 w-4" />
                                                        </Button>
                                                </Link>
                                        </div>

                                        {/* "No credit card required" pill */}
                                        <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.5, delay: prefersReduced ? 0 : 0.25 }}
                                                className="mt-8 flex justify-center">
                                                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-300 backdrop-blur-sm">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                        No credit card required
                                                </div>
                                        </motion.div>

                                        {/* Stats row */}
                                        <motion.div
                                                initial={{ opacity: 0 }}
                                                whileInView={{ opacity: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.6, delay: prefersReduced ? 0 : 0.3 }}
                                                className="mt-14 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
                                                {stats.map((stat, idx) => {
                                                        const Icon = stat.icon;
                                                        return (
                                                                <div key={stat.label} className="flex items-center gap-3">
                                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm">
                                                                                <Icon className="h-5 w-5 text-fuchsia-300" />
                                                                        </div>
                                                                        <div className="text-left">
                                                                                <div className="text-2xl font-extrabold text-white leading-none">{stat.value}</div>
                                                                                <div className="text-xs text-white/60 mt-1 uppercase tracking-wider">{stat.label}</div>
                                                                        </div>
                                                                        {idx < stats.length - 1 && (
                                                                                <div className="hidden sm:block w-px h-10 bg-white/15 ml-9" aria-hidden />
                                                                        )}
                                                                </div>
                                                        );
                                                })}
                                        </motion.div>
                                </motion.div>
                        </div>
                </section>
        );
}
