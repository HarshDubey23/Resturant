"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronUp } from "lucide-react";

/**
 * Floating "back to top" button.
 *
 * Stacks above the CartFab (which sits at `bottom-24 right-6`) by using
 * `bottom-44 right-6`. Appears once the user has scrolled past 600px and
 * animates in/out with a scale + opacity transition. Honors
 * `prefers-reduced-motion` by falling back to an instant scroll.
 */
export default function BackToTopButton() {
        const reduceMotion = useReducedMotion();
        const [visible, setVisible] = useState(false);

        useEffect(() => {
                const onScroll = () => {
                        setVisible(window.scrollY > 600);
                };
                // Run once on mount in case the page loads already scrolled down.
                onScroll();
                window.addEventListener("scroll", onScroll, { passive: true });
                return () => window.removeEventListener("scroll", onScroll);
        }, []);

        const handleClick = () => {
                window.scrollTo({
                        top: 0,
                        behavior: reduceMotion ? "auto" : "smooth",
                });
        };

        return (
                <AnimatePresence>
                        {visible && (
                                <motion.button
                                        type="button"
                                        key="back-to-top"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{
                                                duration: reduceMotion ? 0 : 0.2,
                                                ease: "easeOut",
                                        }}
                                        onClick={handleClick}
                                        aria-label="Scroll back to top"
                                        className="fixed bottom-44 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-soft-hover transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-400/30"
                                >
                                        <ChevronUp className="h-5 w-5" />
                                </motion.button>
                        )}
                </AnimatePresence>
        );
}
