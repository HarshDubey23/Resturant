"use client";

import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export interface CountUpProps {
        /** Final value to count up to. */
        to: number;
        /** Optional starting value (defaults to 0). */
        from?: number;
        /** Duration in seconds. */
        duration?: number;
        /** Number of decimal places to display. */
        decimals?: number;
        /** Prefix string (e.g. "₹"). */
        prefix?: string;
        /** Suffix string (e.g. "+"). */
        suffix?: string;
        /** Separator for thousands (e.g. ","). Empty string disables grouping. */
        separator?: string;
        className?: string;
}

/**
 * Count-up number that animates the first time it scrolls into view.
 * Respects `prefers-reduced-motion` (renders the final value immediately).
 * Uses a manual IntersectionObserver with a synchronous mount check for
 * maximum reliability across SSR / headless / real-browser environments.
 */
export function CountUp({ to, from = 0, duration = 2, decimals = 0, prefix = "", suffix = "", separator = ",", className }: CountUpProps) {
        const prefersReduced = useReducedMotion();
        const ref = useRef<HTMLSpanElement>(null);
        const [inView, setInView] = useState(false);
        // Initialize to the final value when reduced motion is preferred so we
        // never need to call setState synchronously inside the effect.
        const [display, setDisplay] = useState(() => (prefersReduced ? to : from));
        const motionValue = useMotionValue(from);

        // Synchronous mount check + IntersectionObserver fallback.
        useEffect(() => {
                if (prefersReduced) return;
                const el = ref.current;
                if (!el) return;

                const checkInView = () => {
                        const rect = el.getBoundingClientRect();
                        const vh = window.innerHeight || document.documentElement.clientHeight;
                        const vw = window.innerWidth || document.documentElement.clientWidth;
                        // Element is "in view" if any part of it is within the viewport
                        // (with a small 10% bottom margin so it triggers just before fully visible).
                        const isVisible =
                                rect.top < vh * 0.95 &&
                                rect.bottom > vh * 0.05 &&
                                rect.left < vw &&
                                rect.right > 0;
                        if (isVisible) setInView(true);
                };

                // Check immediately on mount (catches above-the-fold elements).
                checkInView();

                // Fallback: observe for scroll-triggered elements below the fold.
                const observer = new IntersectionObserver(
                        (entries) => {
                                for (const entry of entries) {
                                        if (entry.isIntersecting) {
                                                setInView(true);
                                                observer.disconnect();
                                        }
                                }
                        },
                        { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
                );
                observer.observe(el);

                return () => observer.disconnect();
        }, [prefersReduced]);

        useEffect(() => {
                if (prefersReduced || !inView) return;
                const controls = animate(motionValue, to, {
                        duration,
                        ease: [0.16, 1, 0.3, 1],
                        onUpdate: (v) => setDisplay(v),
                });
                return () => controls.stop();
        }, [inView, to, duration, motionValue, prefersReduced]);

        // When reduced motion is preferred, always show the final value
        // (overrides any stale display state from the initial null render).
        const effectiveDisplay = prefersReduced ? to : display;

        const formatted = effectiveDisplay.toLocaleString("en-IN", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
                useGrouping: separator !== "",
        });

        return (
                <span ref={ref} className={className}>
                        {prefix}
                        {formatted}
                        {suffix}
                </span>
        );
}
