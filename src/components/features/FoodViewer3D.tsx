"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { getStoredWebGLTier, type WebGLTier } from "#utils/helper/webgl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FoodViewer3DProps {
	modelUrl?: string;
	fallbackImages?: string[];
	itemName?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function ParallaxFallback({ images, itemName }: { images: string[]; itemName?: string }) {
	const ref = useRef<HTMLDivElement>(null);
	const [style, setStyle] = useState({ transform: "rotateX(0deg) rotateY(0deg)" });
	const [autoRotate, setAutoRotate] = useState(true);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const onMove = (e: MouseEvent) => {
			const rect = el.getBoundingClientRect();
			const x = (e.clientX - rect.left) / rect.width - 0.5;
			const y = (e.clientY - rect.top) / rect.height - 0.5;
			setAutoRotate(false);
			setStyle({ transform: `rotateX(${-y * 20}deg) rotateY(${x * 20}deg)` });
		};
		const onLeave = () => setAutoRotate(true);
		el.addEventListener("mousemove", onMove);
		el.addEventListener("mouseleave", onLeave);
		return () => {
			el.removeEventListener("mousemove", onMove);
			el.removeEventListener("mouseleave", onLeave);
		};
	}, []);

	// Subtle auto-rotation when the user isn't interacting — gives a "showroom turntable" feel.
	useEffect(() => {
		if (!autoRotate) return;
		let raf = 0;
		let angle = 0;
		const tick = () => {
			angle = (angle + 0.4) % 360;
			setStyle({ transform: `rotateX(5deg) rotateY(${Math.sin(angle * (Math.PI / 180)) * 12}deg)` });
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [autoRotate]);

	return (
		<div
			ref={ref}
			className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-muted/40 via-background to-muted/20"
			style={{ perspective: "1000px" }}>
			{/* Soft glow behind the dish */}
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
				<div className="h-2/3 w-2/3 rounded-full bg-primary/10 blur-3xl" />
			</div>

			{images.map((src, i) => (
				<div
					key={src}
					role="img"
					aria-label={itemName || "Food preview"}
					className="absolute w-3/4 h-3/4 transition-transform duration-100 ease-out will-change-transform bg-contain bg-center bg-no-repeat rounded-2xl shadow-2xl"
					style={{
						...style,
						transform: `${style.transform} translateZ(${(i + 1) * 40}px)`,
						backgroundImage: `url(${src})`,
					}}
				/>
			))}

			{/* Floating hint */}
			<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
				<span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
				<span className="text-[11px] font-medium text-white">Move cursor to rotate · 3D Preview</span>
			</div>

			{itemName && <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-semibold text-muted-foreground">{itemName}</div>}
		</div>
	);
}

function ModelViewer({ modelUrl, itemName }: { modelUrl: string; itemName?: string }) {
	const ref = useRef<HTMLElement>(null);

	useEffect(() => {
		let mounted = true;
		const load = async () => {
			await import("@google/model-viewer");
			if (!mounted || !ref.current) return;
			const el = ref.current as HTMLElement & {
				src?: string;
				alt?: string;
				"camera-controls"?: boolean;
				"auto-rotate"?: boolean;
				ar?: boolean;
				"ar-modes"?: string;
				"environment-image"?: string;
			};
			el.src = modelUrl;
			el.alt = itemName || "3D food preview";
			el["camera-controls"] = true;
			el["auto-rotate"] = true;
			el.ar = true;
			el["ar-modes"] = "scene-viewer quick-look";
			el["environment-image"] = "neutral";
		};
		load();
		return () => {
			mounted = false;
		};
	}, [modelUrl, itemName]);

	return <div ref={ref as unknown as React.RefObject<HTMLDivElement>} className="w-full h-full rounded-lg" />;
}

export default function FoodViewer3D({ modelUrl, fallbackImages, itemName, open, onOpenChange }: FoodViewer3DProps) {
	const tier = useMemo<WebGLTier>(() => getStoredWebGLTier(), []);
	const [R3FViewer, setR3FViewer] = useState<React.ComponentType<{ modelUrl: string; itemName: string }> | null>(null);

	// Lazy-load R3F only on WebGL2 devices when actually opening a 3D model
	useEffect(() => {
		if (!open || tier !== "r3f" || !modelUrl) return;
		let mounted = true;
		import("./R3FViewer")
			.then((mod) => {
				if (mounted) setR3FViewer(() => mod.R3FViewer);
			})
			.catch(() => {
				if (mounted) setR3FViewer(null);
			});
		return () => {
			mounted = false;
		};
	}, [open, tier, modelUrl]);

	const viewer = useMemo(() => {
		const images = fallbackImages?.length ? fallbackImages : ["/icon-192.png"];
		// No model URL — fall back to the parallax 3D experience using the food photo.
		// This still gives the customer a "3D preview" feel (mouse-tracked tilt + depth layers).
		if (!modelUrl) {
			return <ParallaxFallback images={images} itemName={itemName} />;
		}
		// r3f tier: use real Three.js when module loaded, fall back to parallax if R3F fails to load
		if (tier === "r3f") {
			if (R3FViewer) {
				return (
					<Suspense fallback={<ParallaxFallback images={images} itemName={itemName} />}>
						<R3FViewer modelUrl={modelUrl} itemName={itemName || "3D Preview"} />
					</Suspense>
				);
			}
			// While R3F is loading, show parallax as instant fallback
			return <ParallaxFallback images={images} itemName={itemName} />;
		}
		if (tier === "model-viewer") {
			return <ModelViewer modelUrl={modelUrl} itemName={itemName} />;
		}
		return <ParallaxFallback images={images} itemName={itemName} />;
	}, [tier, modelUrl, fallbackImages, itemName, R3FViewer]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl h-[80vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>{itemName || "3D Preview"}</DialogTitle>
				</DialogHeader>
				<div className="flex-1 min-h-0 relative">{viewer}</div>
			</DialogContent>
		</Dialog>
	);
}
