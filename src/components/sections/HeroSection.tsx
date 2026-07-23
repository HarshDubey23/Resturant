"use client";

import { ArrowRight, Play, Sparkles, Star } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
        const ref = useRef(null);
        const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
        const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
        const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

        return (
                <section id="homepage" ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
                        {/* Animated gradient mesh background */}
                        <div className="absolute inset-0 bg-mesh" />
                        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-float" />
                        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: "3s" }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-[150px]" />

                        {/* Decorative floating food icons */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                {["🍕", "🍔", "🌮", "🍜", "🧁", "🥗", "🍣", "🥘"].map((emoji, i) => (
                                        <motion.div
                                                key={emoji}
                                                className="absolute text-4xl opacity-10 select-none"
                                                style={{ left: `${10 + i * 12}%`, top: `${15 + (i % 3) * 30}%` }}
                                                animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
                                                transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}>
                                                {emoji}
                                        </motion.div>
                                ))}
                        </div>

                        <motion.div style={{ y, opacity }} className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full pt-24 pb-16">
                                <div className="grid lg:grid-cols-2 gap-16 items-center">
                                        <motion.div
                                                initial={{ opacity: 0, x: -40 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                                                className="text-center lg:text-left">
                                                {/* Badge */}
                                                <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.2 }}
                                                        className="inline-flex items-center gap-2 rounded-full border bg-card/80 backdrop-blur-sm px-5 py-2 text-sm text-muted-foreground mb-8 shadow-sm">
                                                        <Sparkles className="h-4 w-4 text-primary" />
                                                        <span className="font-medium">No app needed. Just scan &amp; order</span>
                                                        <span className="relative flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                                        </span>
                                                </motion.div>

                                                {/* Headline */}
                                                <motion.h1
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.3, duration: 0.6 }}
                                                        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05]">
                                                        <span className="text-foreground">Scan.</span>
                                                        <br />
                                                        <span className="text-gradient">Order.</span>
                                                        <br />
                                                        <span className="text-foreground">Enjoy.</span>
                                                </motion.h1>

                                                {/* Subtitle */}
                                                <motion.p
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.4, duration: 0.6 }}
                                                        className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed mx-auto lg:mx-0">
                                                        The all-in-one operating system for restaurant owners. Your customers scan, browse the menu, customize with notes &amp; spice levels, pay online, and get a
                                                        digital bill — while your kitchen, analytics, loyalty, and WhatsApp marketing all run themselves in the background.
                                                </motion.p>

                                                {/* CTA Buttons */}
                                                <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.5, duration: 0.6 }}
                                                        className="mt-10 flex flex-col sm:flex-row items-center lg:justify-start gap-4">
                                                        <Link href="/signup">
                                                                <Button
                                                                        size="lg"
                                                                        className="gap-2 text-base h-13 px-8 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
                                                                        Start free — register restaurant
                                                                        <ArrowRight className="h-4 w-4" />
                                                                </Button>
                                                        </Link>
                                                        <Button
                                                                variant="outline"
                                                                size="lg"
                                                                className="gap-2 text-base h-13 px-8 rounded-xl border-2 hover:bg-primary/5 transition-all duration-300"
                                                                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
                                                                <Play className="h-4 w-4" />
                                                                Watch Demo
                                                        </Button>
                                                </motion.div>

                                                {/* Social Proof */}
                                                <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: 0.8 }}
                                                        className="mt-10 flex items-center gap-4 lg:justify-start justify-center">
                                                        <div className="flex -space-x-2">
                                                                {["bg-orange-200", "bg-amber-200", "bg-red-200", "bg-yellow-200"].map((color, i) => (
                                                                        <div
                                                                                key={i}
                                                                                className={`w-8 h-8 rounded-full ${color} border-2 border-background flex items-center justify-center text-[10px] font-bold text-foreground/70`}>
                                                                                {["PS", "RV", "MJ", "AR"][i]}
                                                                        </div>
                                                                ))}
                                                        </div>
                                                        <div className="text-sm">
                                                                <div className="flex gap-0.5 mb-0.5">
                                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                                                <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                                                        ))}
                                                                </div>
                                                                <span className="text-muted-foreground">
                                                                        Loved by <strong className="text-foreground">500+</strong> restaurants
                                                                </span>
                                                        </div>
                                                </motion.div>
                                        </motion.div>

                                        {/* Hero Visual - Immersive food imagery */}
                                        <motion.div
                                                initial={{ opacity: 0, x: 40 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                                                className="relative lg:min-h-[600px] flex items-center justify-center">
                                                {/* Main food image */}
                                                <div className="relative w-full max-w-lg mx-auto">
                                                        <motion.div
                                                                animate={{ y: [0, -8, 0] }}
                                                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                                                className="relative rounded-3xl overflow-hidden shadow-2xl glow-primary">
                                                                <div className="aspect-[4/5] relative">
                                                                        <Image
                                                                                src="/food-images/hero-restaurant.png"
                                                                                alt="Fine dining experience at OrderWorder restaurant"
                                                                                fill
                                                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                                                className="object-cover"
                                                                                priority
                                                                        />
                                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                                                        <div className="absolute bottom-6 left-6 right-6">
                                                                                <div className="glass rounded-2xl p-4">
                                                                                        <div className="flex items-center gap-3">
                                                                                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                                                                                        <Sparkles className="h-5 w-5 text-primary" />
                                                                                                </div>
                                                                                                <div>
                                                                                                        <p className="text-sm font-semibold text-foreground">AI-Powered Ordering</p>
                                                                                                        <p className="text-xs text-muted-foreground">Smart recommendations &amp; instant checkout</p>
                                                                                                </div>
                                                                                        </div>
                                                                                </div>
                                                                        </div>
                                                                </div>
                                                        </motion.div>

                                                        {/* Floating card - QR */}
                                                        <motion.div
                                                                animate={{ y: [0, 6, 0], x: [0, 4, 0] }}
                                                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                                                className="absolute -top-4 -right-4 md:-right-8 glass rounded-2xl p-3 shadow-xl z-20">
                                                                <div className="flex items-center gap-2">
                                                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                                <Image src="/food-images/qr-scanning.png" alt="QR Scan" width={32} height={32} className="rounded" />
                                                                        </div>
                                                                        <div>
                                                                                <p className="text-xs font-semibold">Scan to Order</p>
                                                                                <p className="text-[10px] text-muted-foreground">No app needed</p>
                                                                        </div>
                                                                </div>
                                                        </motion.div>

                                                        {/* Floating card - Order Status */}
                                                        <motion.div
                                                                animate={{ y: [0, -6, 0], x: [0, -3, 0] }}
                                                                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                                                                className="absolute -bottom-4 -left-4 md:-left-8 glass rounded-2xl p-3 shadow-xl z-20">
                                                                <div className="flex items-center gap-2">
                                                                        <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                                                                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                                                                        </div>
                                                                        <div>
                                                                                <p className="text-xs font-semibold">Order Confirmed</p>
                                                                                <p className="text-[10px] text-muted-foreground">Preparing your food</p>
                                                                        </div>
                                                                </div>
                                                        </motion.div>
                                                </div>
                                        </motion.div>
                                </div>
                        </motion.div>

                        {/* Bottom fade */}
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
                </section>
        );
}
