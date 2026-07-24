"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Play, X } from "lucide-react";

/**
 * DemoVideoModal
 *
 * Reusable trigger + modal that opens a lightweight "product demo"
 * preview. Uses a styled placeholder (poster image + play button)
 * instead of an actual embedded video so we don't ship a heavy
 * video asset. The modal closes on Escape, backdrop click, or the
 * close button. Honors prefers-reduced-motion.
 *
 * Accessibility:
 *  - Trigger has aria-haspopup="dialog" and aria-expanded
 *  - Modal uses role="dialog" aria-modal="true" with a labelled title
 *  - Focus is trapped visually (close button receives focus on open)
 *  - Escape closes
 */
export default function DemoVideoModal() {
        const prefersReduced = useReducedMotion();
        const [open, setOpen] = useState(false);

        // Lock body scroll while modal is open
        useEffect(() => {
                if (!open) return;
                const prev = document.body.style.overflow;
                document.body.style.overflow = "hidden";
                return () => {
                        document.body.style.overflow = prev;
                };
        }, [open]);

        // Close on Escape
        useEffect(() => {
                if (!open) return;
                const onKey = (e: KeyboardEvent) => {
                        if (e.key === "Escape") setOpen(false);
                };
                window.addEventListener("keydown", onKey);
                return () => window.removeEventListener("keydown", onKey);
        }, [open]);

        return (
                <>
                        <button
                                type="button"
                                onClick={() => setOpen(true)}
                                aria-haspopup="dialog"
                                aria-expanded={open}
                                className="group inline-flex items-center gap-2 text-base h-13 px-6 rounded-xl text-white/80 hover:text-white hover:bg-white/10 hover:ring-1 hover:ring-white/20 transition-all duration-200"
                        >
                                <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
                                        <span className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-60" aria-hidden />
                                        <Play className="h-3.5 w-3.5 text-white" fill="currentColor" />
                                </span>
                                Watch Demo
                        </button>

                        <AnimatePresence>
                                {open && (
                                        <motion.div
                                                key="demo-modal-root"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: prefersReduced ? 0 : 0.2 }}
                                                className="fixed inset-0 z-[70] flex items-center justify-center p-4"
                                                role="dialog"
                                                aria-modal="true"
                                                aria-label="OrderWorder product demo"
                                        >
                                                {/* Backdrop */}
                                                <button
                                                        type="button"
                                                        aria-label="Close demo modal"
                                                        onClick={() => setOpen(false)}
                                                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                                                />

                                                {/* Modal */}
                                                <motion.div
                                                        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 24 }}
                                                        animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                                                        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 24 }}
                                                        transition={{ duration: prefersReduced ? 0 : 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                                                        className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-2xl"
                                                >
                                                        {/* Top accent */}
                                                        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 opacity-80" />

                                                        {/* Close button */}
                                                        <button
                                                                type="button"
                                                                onClick={() => setOpen(false)}
                                                                aria-label="Close demo modal"
                                                                autoFocus
                                                                className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                                                        >
                                                                <X className="h-4 w-4" />
                                                        </button>

                                                        {/* Video poster / placeholder */}
                                                        <div className="relative aspect-video bg-gradient-to-br from-violet-900 via-slate-950 to-fuchsia-950">
                                                                {/* Decorative grid */}
                                                                <div
                                                                        aria-hidden
                                                                        className="absolute inset-0 opacity-30"
                                                                        style={{
                                                                                backgroundImage:
                                                                                        "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                                                                                backgroundSize: "32px 32px",
                                                                        }}
                                                                />
                                                                {/* Floating UI mock preview cards */}
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                                                                        <motion.div
                                                                                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
                                                                                animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                                                                                transition={{ delay: 0.1, duration: 0.5 }}
                                                                                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur-md"
                                                                        >
                                                                                <span className="relative flex h-1.5 w-1.5">
                                                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-75" />
                                                                                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
                                                                                </span>
                                                                                Live demo · 2 min walkthrough
                                                                        </motion.div>

                                                                        <motion.h3
                                                                                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
                                                                                animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                                                                                transition={{ delay: 0.2, duration: 0.5 }}
                                                                                className="text-2xl sm:text-3xl font-extrabold text-white"
                                                                        >
                                                                                See OrderWorder in action
                                                                        </motion.h3>

                                                                        <motion.p
                                                                                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
                                                                                animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                                                                                transition={{ delay: 0.3, duration: 0.5 }}
                                                                                className="max-w-xl text-sm sm:text-base text-white/70 leading-relaxed"
                                                                        >
                                                                                Watch a complete walkthrough — from scanning a QR code at the table, through the
                                                                                kitchen display, to GST-compliant billing and WhatsApp marketing automation.
                                                                        </motion.p>

                                                                        {/* Play button (decorative — modal can be replaced with a real video) */}
                                                                        <motion.button
                                                                                type="button"
                                                                                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                                                                                animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                                                                                transition={{ delay: 0.4, duration: 0.5 }}
                                                                                whileHover={prefersReduced ? undefined : { scale: 1.05 }}
                                                                                whileTap={prefersReduced ? undefined : { scale: 0.96 }}
                                                                                className="group relative mt-2 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-2xl ring-4 ring-white/10 transition-all"
                                                                                aria-label="Play demo (placeholder)"
                                                                        >
                                                                                <span className="absolute inset-0 animate-ping rounded-full bg-violet-500/40" aria-hidden />
                                                                                <Play className="relative h-6 w-6 text-white" fill="currentColor" />
                                                                        </motion.button>
                                                                </div>
                                                        </div>

                                                        {/* Footer hint */}
                                                        <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-slate-950 px-5 py-3 text-xs text-slate-400">
                                                                <span>
                                                                        Want a personalized demo?{" "}
                                                                        <a href="#login" className="font-semibold text-violet-400 hover:text-violet-300">
                                                                                Talk to our team
                                                                        </a>
                                                                </span>
                                                                <span className="hidden sm:inline">Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/80">Esc</kbd> to close</span>
                                                        </div>
                                                </motion.div>
                                        </motion.div>
                                )}
                        </AnimatePresence>
                </>
        );
}
