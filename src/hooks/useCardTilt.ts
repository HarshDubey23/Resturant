"use client";

import { useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";
import { useCallback } from "react";

export function useCardTilt(intensity = 10) {
	const prefersReduced = useReducedMotion();
	const x = useMotionValue(0);
	const y = useMotionValue(0);

	// Spring physics for smooth movement
	const springX = useSpring(x, { stiffness: 300, damping: 30 });
	const springY = useSpring(y, { stiffness: 300, damping: 30 });

	// Map mouse position to rotation degrees
	const rotateX = useTransform(springY, [-0.5, 0.5], [intensity, -intensity]);
	const rotateY = useTransform(springX, [-0.5, 0.5], [-intensity, intensity]);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (prefersReduced) return;
			const rect = e.currentTarget.getBoundingClientRect();
			// Normalized mouse position (0 to 1)
			const normalizedX = (e.clientX - rect.left) / rect.width;
			const normalizedY = (e.clientY - rect.top) / rect.height;
			// Center around 0 (-0.5 to 0.5)
			x.set(normalizedX - 0.5);
			y.set(normalizedY - 0.5);
		},
		[prefersReduced, x, y],
	);

	const handleMouseLeave = useCallback(() => {
		x.set(0);
		y.set(0);
	}, [x, y]);

	// If reduced motion preferred, return no-tilt values
	if (prefersReduced) {
		return {
			style: {},
			onMouseMove: () => {},
			onMouseLeave: () => {},
		};
	}

	return {
		style: {
			rotateX,
			rotateY,
			transformPerspective: 800,
		},
		onMouseMove: handleMouseMove,
		onMouseLeave: handleMouseLeave,
	};
}
