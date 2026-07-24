"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

const SECTIONS = [
        { id: "homepage", label: "Top" },
        { id: "features", label: "Features" },
        { id: "platform-vision", label: "Vision" },
        { id: "how-it-works", label: "How It Works" },
        { id: "menu", label: "Menu" },
        { id: "testimonials", label: "Reviews" },
        { id: "pricing", label: "Pricing" },
        { id: "comparison", label: "Compare" },
        { id: "faq", label: "FAQ" },
        { id: "about", label: "About" },
        { id: "blog", label: "Blog" },
];

export default function SectionProgressIndicator() {
        const prefersReduced = useReducedMotion();
        const [activeIndex, setActiveIndex] = useState(0);
        const [visible, setVisible] = useState(false);

        useEffect(() => {
                const onScroll = () => {
                        const scrollY = window.scrollY;
                        setVisible(scrollY > 300);

                        // Determine which section is currently most visible
                        let bestIndex = 0;
                        let bestVisibility = 0;

                        SECTIONS.forEach((section, index) => {
                                const el = document.getElementById(section.id);
                                if (!el) return;
                                const rect = el.getBoundingClientRect();
                                const windowHeight = window.innerHeight;
                                // How much of the section is visible in the viewport
                                const visibleTop = Math.max(0, rect.top);
                                const visibleBottom = Math.min(windowHeight, rect.bottom);
                                const visibility = (visibleBottom - visibleTop) / windowHeight;
                                if (visibility > bestVisibility) {
                                        bestVisibility = visibility;
                                        bestIndex = index;
                                }
                        });

                        setActiveIndex(bestIndex);
                };

                onScroll();
                window.addEventListener("scroll", onScroll, { passive: true });
                return () => window.removeEventListener("scroll", onScroll);
        }, []);

        const handleClick = (id: string) => {
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        };

        return (
                <AnimatePresence>
                        {visible && (
                                <motion.div
                                        key="section-progress"
                                        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -20 }}
                                        animate={prefersReduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
                                        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-center gap-1"
                                        role="navigation"
                                        aria-label="Page section navigation">
                                        {/* Progress line */}
                                        <div className="relative flex flex-col items-center gap-0">
                                                {/* Background track */}
                                                <div className="w-0.5 h-[calc(100%)] bg-slate-200/60 rounded-full absolute top-0" />

                                                {/* Active progress fill */}
                                                <motion.div
                                                        className="w-0.5 bg-gradient-to-b from-violet-500 to-fuchsia-500 rounded-full absolute top-0"
                                                        initial={false}
                                                        animate={{
                                                                height: `${((activeIndex + 1) / SECTIONS.length) * 100}%`,
                                                        }}
                                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                                />

                                                {/* Section dots */}
                                                {SECTIONS.map((section, index) => (
                                                        <button
                                                                key={section.id}
                                                                onClick={() => handleClick(section.id)}
                                                                className="relative group my-1"
                                                                aria-label={`Navigate to ${section.label}`}
                                                                aria-current={index === activeIndex ? "true" : undefined}>
                                                                <motion.div
                                                                        className={`rounded-full transition-all duration-200 ${
                                                                                index === activeIndex
                                                                                        ? "h-3 w-3 bg-violet-600 ring-2 ring-violet-300 ring-offset-2 ring-offset-white shadow-soft"
                                                                                        : index < activeIndex
                                                                                                ? "h-2 w-2 bg-violet-400"
                                                                                                : "h-2 w-2 bg-slate-300 hover:bg-slate-400"
                                                                        }`}
                                                                        animate={
                                                                                index === activeIndex && !prefersReduced
                                                                                        ? { scale: [1, 1.2, 1] }
                                                                                        : { scale: 1 }
                                                                        }
                                                                        transition={
                                                                                index === activeIndex
                                                                                        ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                                                                                        : { duration: 0.2 }
                                                                        }
                                                                />
                                                                {/* Tooltip on hover */}
                                                                <span
                                                                        className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-soft opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                                                        {section.label}
                                                                </span>
                                                        </button>
                                                ))}
                                        </div>
                                </motion.div>
                        )}
                </AnimatePresence>
        );
}
