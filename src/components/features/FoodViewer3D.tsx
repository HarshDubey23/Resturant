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

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const onMove = (e: MouseEvent) => {
			const rect = el.getBoundingClientRect();
			const x = (e.clientX - rect.left) / rect.width - 0.5;
			const y = (e.clientY - rect.top) / rect.height - 0.5;
			setStyle({ transform: `rotateX(${-y * 20}deg) rotateY(${x * 20}deg)` });
		};
		el.addEventListener("mousemove", onMove);
		return () => el.removeEventListener("mousemove", onMove);
	}, []);

	return (
		<div ref={ref} className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg" style={{ perspective: "1000px" }}>
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
		if (!modelUrl) return null;
		// r3f tier: use real Three.js when module loaded, fall back to parallax if R3F fails to load
		if (tier === "r3f") {
			if (R3FViewer) {
				return (
					<Suspense fallback={<ParallaxFallback images={fallbackImages?.length ? fallbackImages : ["/icon-192.png"]} itemName={itemName} />}>
						<R3FViewer modelUrl={modelUrl} itemName={itemName || "3D Preview"} />
					</Suspense>
				);
			}
			// While R3F is loading, show parallax as instant fallback
			return <ParallaxFallback images={fallbackImages?.length ? fallbackImages : ["/icon-192.png"]} itemName={itemName} />;
		}
		if (tier === "model-viewer") {
			return <ModelViewer modelUrl={modelUrl} itemName={itemName} />;
		}
		return <ParallaxFallback images={fallbackImages?.length ? fallbackImages : ["/icon-192.png"]} itemName={itemName} />;
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
