"use client";

import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

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
 */
export function CountUp({ to, from = 0, duration = 2, decimals = 0, prefix = "", suffix = "", separator = ",", className }: CountUpProps) {
	const prefersReduced = useReducedMotion();
	const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.4 });
	const [display, setDisplay] = useState(prefersReduced ? to : from);
	const motion = useMotionValue(from);

	useEffect(() => {
		if (prefersReduced) {
			setDisplay(to);
			return;
		}
		if (!inView) return;
		const controls = animate(motion, to, {
			duration,
			ease: [0.16, 1, 0.3, 1],
			onUpdate: (v) => setDisplay(v),
		});
		return () => controls.stop();
	}, [inView, to, duration, motion, prefersReduced]);

	const formatted = display.toLocaleString("en-IN", {
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
