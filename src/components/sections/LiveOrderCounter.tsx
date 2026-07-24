"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ShoppingBag, TrendingUp } from "lucide-react";
import { CountUp } from "@/components/base/CountUp";

interface RecentOrder {
        restaurant: string;
        item: string;
        time: string;
}

const RECENT_ORDERS: RecentOrder[] = [
        { restaurant: "Empire Restaurant", item: "Butter Chicken", time: "2 min ago" },
        { restaurant: "Brewpoint Cafe", item: "Cappuccino", time: "5 min ago" },
        { restaurant: "Spice Route", item: "Hyderabadi Biryani", time: "8 min ago" },
        { restaurant: "The Curry House", item: "Paneer Tikka", time: "12 min ago" },
];

const BASE_COUNT = 1247;
const MIN_INTERVAL_MS = 8000;
const MAX_INTERVAL_MS = 15000;
const MIN_INCREMENT = 1;
const MAX_INCREMENT = 3;
const FLOAT_DURATION_MS = 1300;
const ORDER_ROTATION_MS = 4000;

function randomBetween(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function LiveOrderCounter() {
        const prefersReduced = useReducedMotion();
        const [count, setCount] = useState<number>(BASE_COUNT);
        const [increment, setIncrement] = useState<number | null>(null);
        const [incrementTick, setIncrementTick] = useState<number>(0);
        const [orderIndex, setOrderIndex] = useState<number>(0);
        const [isHovered, setIsHovered] = useState<boolean>(false);
        const floatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

        // Mirror prefersReduced into a ref so the interval callback (which has
        // an empty dep array) can read the latest value without re-subscribing.
        const prefersReducedRef = useRef<boolean>(Boolean(prefersReduced));
        useEffect(() => {
                prefersReducedRef.current = Boolean(prefersReduced);
        }, [prefersReduced]);

        // Simulate live order updates with a random 8–15s interval.
        useEffect(() => {
                let timeout: ReturnType<typeof setTimeout>;
                const scheduleNext = () => {
                        const delay = randomBetween(MIN_INTERVAL_MS, MAX_INTERVAL_MS);
                        timeout = setTimeout(() => {
                                const delta = randomBetween(MIN_INCREMENT, MAX_INCREMENT);
                                setCount((prev) => prev + delta);
                                // Only drive the floating "+N" indicator when motion is allowed.
                                if (!prefersReducedRef.current) {
                                        setIncrement(delta);
                                        setIncrementTick((t) => t + 1);
                                }
                                scheduleNext();
                        }, delay);
                };
                scheduleNext();
                return () => clearTimeout(timeout);
        }, []);

        // Auto-clear the floating "+N" indicator after a short delay.
        useEffect(() => {
                if (increment === null) return;
                if (floatTimeoutRef.current) clearTimeout(floatTimeoutRef.current);
                floatTimeoutRef.current = setTimeout(() => setIncrement(null), FLOAT_DURATION_MS);
                return () => {
                        if (floatTimeoutRef.current) clearTimeout(floatTimeoutRef.current);
                };
        }, [increment, incrementTick]);

        // Rotate the displayed "recent order" entry on a slow cadence so it
        // feels fresh when the visitor hovers.
        const advanceOrder = useCallback(() => {
                setOrderIndex((i) => (i + 1) % RECENT_ORDERS.length);
        }, []);
        useEffect(() => {
                const id = setInterval(advanceOrder, ORDER_ROTATION_MS);
                return () => clearInterval(id);
        }, [advanceOrder]);

        const entrance = prefersReduced
                ? { initial: false as const, animate: { x: 0, opacity: 1 } }
                : {
                                initial: { x: -100, opacity: 0 } as const,
                                animate: { x: 0, opacity: 1 },
                                transition: { duration: 0.5, ease: "easeOut" as const },
                        };

        const currentOrder = RECENT_ORDERS[orderIndex];

        return (
                <motion.div
                        {...entrance}
                        onHoverStart={() => setIsHovered(true)}
                        onHoverEnd={() => setIsHovered(false)}
                        onFocus={() => setIsHovered(true)}
                        onBlur={() => setIsHovered(false)}
                        role="status"
                        aria-live="polite"
                        aria-label={`${count} orders processed today on OrderWorder`}
                        className="fixed bottom-24 left-6 z-40 hidden sm:flex">
                        <div className="relative flex items-center gap-2.5 rounded-full border border-violet-200 bg-white/95 px-4 py-2.5 shadow-soft backdrop-blur-md">
                                {/* Pulsing violet dot (brand-aligned) */}
                                <span aria-hidden className="relative flex h-2 w-2 shrink-0">
                                        {!prefersReduced && (
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                                        )}
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-600" />
                                </span>

                                {/* Live count */}
                                <div className="flex items-baseline gap-1">
                                        <span className="text-sm font-bold text-slate-900">
                                                <CountUp to={count} duration={1} separator="," />
                                        </span>
                                        <span className="text-xs font-medium text-slate-500">orders today</span>
                                </div>

                                {/* Trending icon — subtle recent-activity indicator */}
                                <TrendingUp className="h-3.5 w-3.5 text-violet-500" aria-hidden />

                                {/* Separator + expandable recent-order detail (shown on hover) */}
                                <AnimatePresence initial={false}>
                                        {isHovered && (
                                                <motion.div
                                                        key="expansion"
                                                        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, width: 0 }}
                                                        animate={prefersReduced ? { opacity: 1 } : { opacity: 1, width: "auto" }}
                                                        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, width: 0 }}
                                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                                        className="overflow-hidden whitespace-nowrap">
                                                        <div className="flex items-center gap-2 pl-1">
                                                                <span aria-hidden className="h-3 w-px bg-slate-200" />
                                                                <ShoppingBag className="h-3.5 w-3.5 text-fuchsia-500" aria-hidden />
                                                                <span className="text-xs text-slate-600">
                                                                        Order from{" "}
                                                                        <span className="font-semibold text-slate-800">{currentOrder.restaurant}</span>{" "}
                                                                        · {currentOrder.time}
                                                                </span>
                                                        </div>
                                                </motion.div>
                                        )}
                                </AnimatePresence>

                                {/* Floating "+N" indicator above the pill */}
                                <AnimatePresence>
                                        {!prefersReduced && increment !== null && (
                                                <motion.span
                                                        key={incrementTick}
                                                        initial={{ opacity: 0, y: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, y: -22, scale: 1 }}
                                                        exit={{ opacity: 0, y: -32, scale: 0.9 }}
                                                        transition={{ duration: FLOAT_DURATION_MS / 1000, ease: "easeOut" }}
                                                        aria-hidden
                                                        className="pointer-events-none absolute -top-1 left-4 text-xs font-bold text-violet-600">
                                                        +{increment}
                                                </motion.span>
                                        )}
                                </AnimatePresence>
                        </div>
                </motion.div>
        );
}
