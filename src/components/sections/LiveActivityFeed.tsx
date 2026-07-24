"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MapPin, ShoppingBag } from "lucide-react";

/**
 * LiveActivityFeed — rotating social-proof popups.
 *
 * Shows small toast-style notifications like "Rohit from Mumbai just
 * ordered Butter Chicken" at the bottom-left of the viewport. Each
 * notification stays for ~5s, then fades out and the next one appears
 * after a short gap. Rotates through a static list of plausible
 * entries (no real PII).
 *
 * Hidden on small screens to avoid clutter. Respects
 * prefers-reduced-motion by skipping the animation entirely (and
 * effectively hiding the widget).
 *
 * Stacks below LiveOrderCounter (which sits at `bottom-24 left-6`)
 * by using `bottom-44 left-6` on desktop.
 */

interface Activity {
        name: string;
        city: string;
        item: string;
        ago: string;
}

const ACTIVITIES: Activity[] = [
        { name: "Rohit", city: "Mumbai", item: "Butter Chicken", ago: "just now" },
        { name: "Priya", city: "Bengaluru", item: "Masala Dosa", ago: "1 min ago" },
        { name: "Arjun", city: "Delhi", item: "Paneer Tikka", ago: "2 min ago" },
        { name: "Sneha", city: "Pune", item: "Hyderabadi Biryani", ago: "3 min ago" },
        { name: "Karan", city: "Hyderabad", item: "Chicken 65", ago: "4 min ago" },
        { name: "Anita", city: "Chennai", item: "Filter Coffee", ago: "5 min ago" },
        { name: "Vikram", city: "Jaipur", item: "Dal Baati Churma", ago: "6 min ago" },
        { name: "Meera", city: "Kolkata", item: "Rosogolla", ago: "7 min ago" },
        { name: "Aditya", city: "Ahmedabad", item: "Dhokla", ago: "8 min ago" },
        { name: "Pooja", city: "Chandigarh", item: "Chole Bhature", ago: "9 min ago" },
];

const DISPLAY_MS = 5000;
const GAP_MS = 7000;

export default function LiveActivityFeed() {
        const prefersReduced = useReducedMotion();
        const [index, setIndex] = useState(0);
        const [shown, setShown] = useState(false);

        useEffect(() => {
                if (prefersReduced) return; // hide entirely for reduced motion
                let hideTimer: ReturnType<typeof setTimeout>;
                let nextTimer: ReturnType<typeof setTimeout>;

                const cycle = () => {
                        setShown(true);
                        hideTimer = setTimeout(() => {
                                setShown(false);
                                nextTimer = setTimeout(() => {
                                        setIndex((i) => (i + 1) % ACTIVITIES.length);
                                        cycle();
                                }, GAP_MS);
                        }, DISPLAY_MS);
                };

                // Start the first cycle after a short delay
                const start = setTimeout(cycle, 4500);
                return () => {
                        clearTimeout(start);
                        clearTimeout(hideTimer);
                        clearTimeout(nextTimer);
                };
        }, [prefersReduced]);

        if (prefersReduced) return null;

        const current = ACTIVITIES[index];

        return (
                <AnimatePresence>
                        {shown && (
                                <motion.div
                                        key={`activity-${index}`}
                                        initial={{ opacity: 0, x: -40, y: 8 }}
                                        animate={{ opacity: 1, x: 0, y: 0 }}
                                        exit={{ opacity: 0, x: -40, y: 8 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="fixed bottom-44 left-6 z-30 hidden sm:block"
                                        role="status"
                                        aria-live="polite"
                                        aria-label={`Recent order: ${current.name} from ${current.city} ordered ${current.item}`}
                                >
                                        <div className="flex items-center gap-2.5 rounded-2xl border border-violet-200/60 bg-white/95 px-3.5 py-2.5 shadow-soft backdrop-blur-md max-w-xs">
                                                <span
                                                        aria-hidden
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
                                                >
                                                        <ShoppingBag className="h-3.5 w-3.5" />
                                                </span>
                                                <div className="flex flex-col leading-tight">
                                                        <span className="text-xs font-semibold text-slate-900">
                                                                {current.name} from{" "}
                                                                <span className="inline-flex items-center gap-0.5 text-violet-600">
                                                                        <MapPin className="h-3 w-3" />
                                                                        {current.city}
                                                                </span>
                                                        </span>
                                                        <span className="text-[11px] text-slate-500">
                                                                ordered <span className="font-medium text-slate-700">{current.item}</span>
                                                                <span className="text-slate-400"> · {current.ago}</span>
                                                        </span>
                                                </div>
                                        </div>
                                </motion.div>
                        )}
                </AnimatePresence>
        );
}
