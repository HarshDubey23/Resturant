"use client";

import { useReducedMotion, useSpring, useScroll, motion } from "motion/react";

/**
 * ScrollProgressBar
 *
 * A thin, fixed-top violet gradient progress bar that visually tracks
 * the user's scroll position through the page. Sits above the navbar
 * (z-[55] so it doesn't conflict with the navbar's z-50).
 *
 * Honors prefers-reduced-motion by short-circuiting the spring.
 */
export default function ScrollProgressBar() {
        const prefersReduced = useReducedMotion();
        const { scrollYProgress } = useScroll();
        const scaleX = useSpring(scrollYProgress, {
                stiffness: 200,
                damping: 30,
                restDelta: 0.001,
        });

        return (
                <motion.div
                        aria-hidden
                        style={prefersReduced ? { scaleX: scrollYProgress } : { scaleX }}
                        className="fixed top-0 left-0 right-0 z-[55] h-1 origin-left bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600"
                >
                        {/* Glow trailing the progress edge */}
                        <div className="absolute right-0 top-0 h-full w-12 -translate-x-1 bg-gradient-to-r from-transparent to-white/60 blur-[2px]" />
                </motion.div>
        );
}
