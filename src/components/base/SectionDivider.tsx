"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Decorative section divider — a soft gradient wave that visually
 * separates content blocks. Variants:
 *
 *  - "wave" — a flowing SVG wave (default)
 *  - "gradient" — a thin gradient line
 *  - "dots" — three pulsing dots
 *
 * Honors prefers-reduced-motion by rendering static.
 */
type Variant = "wave" | "gradient" | "dots";

interface SectionDividerProps {
        variant?: Variant;
        className?: string;
        invert?: boolean;
}

export default function SectionDivider({
        variant = "wave",
        className = "",
        invert = false,
}: SectionDividerProps) {
        const prefersReduced = useReducedMotion();
        const fillColor = invert ? "fill-white" : "fill-violet-50/60";

        if (variant === "gradient") {
                return (
                        <div
                                aria-hidden
                                className={`mx-auto h-px w-full max-w-5xl bg-gradient-to-r from-transparent via-violet-300/40 to-transparent ${className}`}
                        />
                );
        }

        if (variant === "dots") {
                return (
                        <div
                                aria-hidden
                                className={`flex items-center justify-center gap-2 ${className}`}
                        >
                                {[0, 1, 2].map((i) => (
                                        <motion.span
                                                key={i}
                                                className="h-1.5 w-1.5 rounded-full bg-violet-400"
                                                animate={
                                                        prefersReduced
                                                                ? undefined
                                                                : { opacity: [0.3, 1, 0.3], scale: [1, 1.4, 1] }
                                                }
                                                transition={{
                                                        duration: 1.6,
                                                        repeat: Infinity,
                                                        delay: i * 0.2,
                                                        ease: "easeInOut",
                                                }}
                                        />
                                ))}
                        </div>
                );
        }

        // Wave variant
        return (
                <div
                        aria-hidden
                        className={`pointer-events-none overflow-hidden ${className}`}
                >
                        <svg
                                viewBox="0 0 1440 80"
                                className={`h-12 w-full ${fillColor}`}
                                preserveAspectRatio="none"
                        >
                                <path d="M0,32 C240,80 480,0 720,32 C960,64 1200,16 1440,48 L1440,80 L0,80 Z" />
                                {!prefersReduced && (
                                        <motion.path
                                                d="M0,40 C240,72 480,16 720,40 C960,64 1200,24 1440,48 L1440,80 L0,80 Z"
                                                className="fill-violet-200/30"
                                                animate={{ d: [
                                                        "M0,40 C240,72 480,16 720,40 C960,64 1200,24 1440,48 L1440,80 L0,80 Z",
                                                        "M0,48 C240,16 480,72 720,32 C960,8 1200,64 1440,32 L1440,80 L0,80 Z",
                                                        "M0,40 C240,72 480,16 720,40 C960,64 1200,24 1440,48 L1440,80 L0,80 Z",
                                                ]}}
                                                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                        />
                                )}
                        </svg>
                </div>
        );
}
