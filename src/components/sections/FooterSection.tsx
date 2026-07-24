"use client";

import { ArrowRight, ExternalLink, Github, Heart, Instagram, Linkedin, Loader2, Sparkles, Youtube } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const socials = [
        { label: "X", icon: Sparkles, href: "#" },
        { label: "LinkedIn", icon: Linkedin, href: "#" },
        { label: "Instagram", icon: Instagram, href: "#" },
        { label: "YouTube", icon: Youtube, href: "#" },
        { label: "GitHub", icon: Github, href: "#" },
];

export default function FooterSection() {
        const [email, setEmail] = useState("");
        const [submitted, setSubmitted] = useState(false);
        const [loading, setLoading] = useState(false);

        const handleNewsletter = async (e: React.FormEvent) => {
                e.preventDefault();
                if (!email) return;
                setLoading(true);
                try {
                        const res = await fetch("/api/newsletter", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ email, source: "footer" }),
                        });
                        const data = await res.json();
                        if (data.alreadySubscribed) {
                                toast.info("You're already subscribed!");
                        } else if (res.ok) {
                                setSubmitted(true);
                                toast.success("Subscribed! Welcome to the OrderWorder family.");
                                setEmail("");
                                setTimeout(() => setSubmitted(false), 3500);
                        } else {
                                toast.error(data.error || "Failed to subscribe");
                        }
                } catch {
                        toast.error("Network error. Please try again.");
                } finally {
                        setLoading(false);
                }
        };

        return (
                <footer className="relative border-t border-slate-200 bg-slate-50">
                        {/* Gradient divider at top */}
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-fuchsia-400/40 to-transparent" />

                        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                                        {/* Brand + newsletter */}
                                        <div className="md:col-span-2">
                                                <div className="flex items-center gap-2 mb-4">
                                                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-soft">
                                                                <Sparkles className="h-5 w-5 text-white" />
                                                        </div>
                                                        <span className="text-xl font-bold tracking-tight text-slate-900">
                                                                Order<span className="text-violet-600">Worder</span>
                                                        </span>
                                                </div>
                                                <p className="text-sm text-slate-700 max-w-sm leading-relaxed">
                                                        Contactless restaurant ordering made simple. Scan, order, and enjoy — no app download needed.
                                                </p>

                                                {/* Newsletter mini-form */}
                                                <form onSubmit={handleNewsletter} className="mt-6 max-w-sm">
                                                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-violet-600 mb-2">
                                                                Stay in the loop
                                                        </label>
                                                        <div className="flex items-center gap-2">
                                                                <input
                                                                        type="email"
                                                                        required
                                                                        value={email}
                                                                        onChange={(e) => setEmail(e.target.value)}
                                                                        placeholder="you@restaurant.com"
                                                                        className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 transition-all"
                                                                />
                                                                <button
                                                                        type="submit"
                                                                        disabled={loading}
                                                                        aria-label="Subscribe to newsletter"
                                                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-soft hover:shadow-soft-hover hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100">
                                                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                                                                </button>
                                                        </div>
                                                        {submitted && (
                                                                <p className="mt-2 text-xs font-medium text-emerald-600">
                                                                        Thanks! Check your inbox to confirm.
                                                                </p>
                                                        )}
                                                </form>

                                                {/* Social row */}
                                                <div className="mt-6 flex items-center gap-2">
                                                        {socials.map((s) => {
                                                                const Icon = s.icon;
                                                                return (
                                                                        <a
                                                                                key={s.label}
                                                                                href={s.href}
                                                                                aria-label={s.label}
                                                                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 hover:-translate-y-0.5 transition-all duration-200 ease-out">
                                                                                <Icon className="h-4 w-4" />
                                                                        </a>
                                                                );
                                                        })}
                                                        <a
                                                                href="https://github.com/itzzritik/OrderWorder"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 hover:-translate-y-0.5 transition-all duration-200 ease-out"
                                                                aria-label="View source on GitHub">
                                                                <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                </div>
                                        </div>

                                        {/* Product */}
                                        <div>
                                                <h3 className="text-[11px] font-bold uppercase tracking-wider text-violet-600 mb-4">Product</h3>
                                                <ul className="space-y-3">
                                                        {["Features", "Menu", "Pricing", "FAQ", "Demo"].map((item) => (
                                                                <li key={item}>
                                                                        <button
                                                                                onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: "smooth" })}
                                                                                className="group relative text-sm text-slate-600 hover:text-violet-600 transition-colors duration-200">
                                                                                {item}
                                                                                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-violet-600 transition-all duration-300 group-hover:w-full" />
                                                                        </button>
                                                                </li>
                                                        ))}
                                                </ul>
                                        </div>

                                        {/* Company */}
                                        <div>
                                                <h3 className="text-[11px] font-bold uppercase tracking-wider text-violet-600 mb-4">Company</h3>
                                                <ul className="space-y-3">
                                                        {["About", "Testimonials", "Contact", "Privacy"].map((item) => (
                                                                <li key={item}>
                                                                        <button
                                                                                onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: "smooth" })}
                                                                                className="group relative text-sm text-slate-600 hover:text-violet-600 transition-colors duration-200">
                                                                                {item}
                                                                                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-violet-600 transition-all duration-300 group-hover:w-full" />
                                                                        </button>
                                                                </li>
                                                        ))}
                                                </ul>

                                                {/* Status pill */}
                                                <div className="mt-5">
                                                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                                                <span className="relative flex h-2 w-2">
                                                                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                                                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                                                </span>
                                                                All systems operational
                                                        </div>
                                                </div>
                                        </div>
                                </div>

                                {/* Copyright bar */}
                                <div className="mt-12 pt-6 border-t border-slate-200 bg-slate-100/60 -mx-4 px-4 sm:mx-0 sm:px-0 sm:rounded-xl">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
                                                <div className="text-sm text-slate-600">
                                                        &copy; {new Date().getFullYear()} OrderWorder, Inc. All rights reserved.
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                                        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                                                <span aria-hidden>🇮🇳</span>
                                                                Made in India
                                                        </div>
                                                        <div className="flex items-center gap-1 text-slate-600">
                                                                Made with <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> for restaurants
                                                        </div>
                                                </div>
                                                <button
                                                        onClick={() => document.getElementById("homepage")?.scrollIntoView({ behavior: "smooth" })}
                                                        className="group text-sm text-violet-600 hover:text-violet-700 font-medium transition-all duration-200">
                                                        Back to top
                                                        <span className="inline-block ml-1 transition-transform duration-200 group-hover:-translate-y-0.5">↑</span>
                                                </button>
                                        </div>
                                </div>
                        </div>
                </footer>
        );
}
