"use client";

import { RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PanoramicViewerProps {
	imageUrl: string;
	itemName?: string;
	description?: string;
	price?: number;
	veg?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function PanoramicViewer({ imageUrl, itemName, description, price, veg, open, onOpenChange }: PanoramicViewerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [rotation, setRotation] = useState(0);
	const [zoom, setZoom] = useState(1);
	const [isDragging, setIsDragging] = useState(false);
	const lastX = useRef(0);
	const velocity = useRef(0);
	const animFrameRef = useRef<number>();

	// Inertia spin after drag
	const inertiaSpin = useCallback(() => {
		if (Math.abs(velocity.current) < 0.1) {
			velocity.current = 0;
			return;
		}
		velocity.current *= 0.95;
		setRotation((prev) => prev + velocity.current);
		animFrameRef.current = requestAnimationFrame(inertiaSpin);
	}, []);

	const handleDragStart = useCallback((e: React.PointerEvent) => {
		setIsDragging(true);
		lastX.current = e.clientX;
		velocity.current = 0;
		if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
	}, []);

	const handleDragMove = useCallback(
		(e: React.PointerEvent) => {
			if (!isDragging) return;
			const delta = e.clientX - lastX.current;
			velocity.current = delta * 0.5;
			setRotation((prev) => prev + delta * 0.3);
			lastX.current = e.clientX;
		},
		[isDragging],
	);

	const handleDragEnd = useCallback(() => {
		setIsDragging(false);
		animFrameRef.current = requestAnimationFrame(inertiaSpin);
	}, [inertiaSpin]);

	// Auto-rotate slowly when not dragging
	useEffect(() => {
		if (!open || isDragging) return;
		const interval = setInterval(() => {
			setRotation((prev) => prev + 0.15);
		}, 16);
		return () => clearInterval(interval);
	}, [open, isDragging]);

	// Reset on close
	useEffect(() => {
		if (!open) {
			setRotation(0);
			setZoom(1);
		}
	}, [open]);

	const vegLabel = veg === "veg" ? "Vegetarian" : veg === "non-veg" ? "Non-Vegetarian" : veg === "contains-egg" ? "Contains Egg" : "";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl">
				<DialogHeader className="sr-only">
					<DialogTitle>{itemName || "360° Food Preview"}</DialogTitle>
				</DialogHeader>

				{/* Content area */}
				<div className="flex-1 flex flex-col min-h-0">
					{/* Viewer area */}
					<div
						ref={containerRef}
						className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none bg-gradient-to-b from-muted/50 to-muted/20"
						onPointerDown={handleDragStart}
						onPointerMove={handleDragMove}
						onPointerUp={handleDragEnd}
						onPointerLeave={handleDragEnd}>
						{/* Panoramic image with 3D perspective */}
						<div
							className="absolute inset-0"
							style={{
								perspective: "1200px",
								perspectiveOrigin: "50% 50%",
							}}>
							<div
								className="absolute inset-0 w-[200%] h-full"
								style={{
									transform: `rotateY(${rotation}deg) scale(${zoom})`,
									transformStyle: "preserve-3d",
									transition: isDragging ? "none" : "transform 0.05s linear",
								}}>
								{/* Duplicate image for seamless wrapping */}
								<div className="absolute inset-0 w-1/2 h-full bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
								<div className="absolute left-1/2 inset-0 w-1/2 h-full bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
							</div>
						</div>

						{/* Drag hint */}
						<div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground pointer-events-none">
							<RotateCw className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "3s" }} />
							Drag to rotate 360°
						</div>

						{/* Zoom controls */}
						<div className="absolute top-4 right-4 flex flex-col gap-2">
							<Button variant="outline" size="icon" className="h-9 w-9 rounded-xl glass" onClick={() => setZoom((z) => Math.min(z + 0.3, 3))}>
								<ZoomIn className="h-4 w-4" />
							</Button>
							<Button variant="outline" size="icon" className="h-9 w-9 rounded-xl glass" onClick={() => setZoom((z) => Math.max(z - 0.3, 0.5))}>
								<ZoomOut className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* Info panel */}
					{(itemName || price) && (
						<div className="border-t bg-card/95 backdrop-blur-sm p-6">
							<div className="flex items-center justify-between">
								<div>
									<div className="flex items-center gap-3 mb-1">
										<h3 className="text-xl font-bold text-foreground">{itemName}</h3>
										{veg && (
											<span
												className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${veg === "veg" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
												{vegLabel}
											</span>
										)}
									</div>
									{description && <p className="text-sm text-muted-foreground mt-1 max-w-lg">{description}</p>}
								</div>
								{price && (
									<div className="text-right">
										<div className="text-2xl font-black text-primary">₹{price}</div>
										<div className="text-xs text-muted-foreground">per serving</div>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
