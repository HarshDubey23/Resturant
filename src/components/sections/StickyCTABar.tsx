"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Sparkles, X } from "lucide-react";
import Link from "next/link";

/**
 * Sticky bottom CTA bar.
 *
 * Appears after the user has scrolled past the hero (≈ 80% of one
 * viewport height) to keep a primary conversion action always visible.
 * Dismissible for the session (state held in memory only). Hidden on
 * small screens (< 640px) to avoid stacking with the cookie banner,
 * CartFab, BackToTopButton, etc. — those mobile surfaces already
 * provide strong CTAs.
 *
 * Honors prefers-reduced-motion by short-circuiting the spring.
 */
const DISMISS_KEY = "ow_sticky_cta_dismissed";

// Lazy initializer so we don't call setState inside an effect
// (which would trigger the react-hooks/set-state-in-effect rule).
function initDismissed(): boolean {
        if (typeof window === "undefined") return false;
        try {
                return sessionStorage.getItem(DISMISS_KEY) === "1";
        } catch {
                return false;
        }
}

export default function StickyCTABar() {
        const prefersReduced = useReducedMotion();
        const [visible, setVisible] = useState(false);
        const [dismissed, setDismissed] = useState(initDismissed);

        useEffect(() => {
                if (dismissed) return;
                const onScroll = () => {
                        const threshold = Math.max(window.innerHeight * 0.8, 600);
                        setVisible(window.scrollY > threshold);
                };
                onScroll();
                window.addEventListener("scroll", onScroll, { passive: true });
                return () => window.removeEventListener("scroll", onScroll);
        }, [dismissed]);

        const handleDismiss = () => {
                setDismissed(true);
                setVisible(false);
                try {
                        sessionStorage.setItem(DISMISS_KEY, "1");
                } catch {
                        // ignore
                }
        };

        const shouldShow = visible && !dismissed;

        return (
                <AnimatePresence>
                        {shouldShow && (
                                <motion.div
                                        key="sticky-cta"
                                        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 60 }}
                                        animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                                        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 60 }}
                                        transition={{
                                                duration: prefersReduced ? 0 : 0.35,
                                                ease: [0.25, 0.46, 0.45, 0.94],
                                        }}
                                        className="fixed bottom-6 left-1/2 z-40 hidden -translate-x-1/2 sm:block"
                                        role="region"
                                        aria-label="Quick sign up"
                                >
                                        <div className="relative flex items-center gap-3 rounded-full border border-violet-200 bg-white/95 px-3 py-2 pl-5 shadow-soft-hover backdrop-blur-md">
                                                {/* Subtle gradient glow */}
                                                <div
                                                        aria-hidden
                                                        className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-violet-500/10 blur-md"
                                                />
                                                {/* Pulse dot */}
                                                <span aria-hidden className="relative flex h-2 w-2 shrink-0">
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-600" />
                                                </span>
                                                <div className="hidden flex-col leading-tight md:flex">
                                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-600">
                                                                Limited time
                                                        </span>
                                                        <span className="text-sm font-semibold text-slate-900">
                                                                3 months free for first 100 restaurants
                                                        </span>
                                                </div>
                                                <span className="text-sm font-semibold text-slate-900 md:hidden">
                                                        3 months free
                                                </span>
                                                <Link
                                                        href="/signup"
                                                        className="group inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-soft transition-all hover:shadow-soft-hover hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/40"
                                                >
                                                        <Sparkles className="h-3.5 w-3.5" />
                                                        Get started
                                                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                                                </Link>
                                                <button
                                                        type="button"
                                                        onClick={handleDismiss}
                                                        aria-label="Dismiss quick sign up bar"
                                                        className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-slate-300 opacity-70 transition-all hover:bg-slate-100 hover:text-slate-700 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                                                >
                                                        <X className="h-3 w-3" />
                                                </button>
                                        </div>
                                </motion.div>
                        )}
                </AnimatePresence>
        );
}
