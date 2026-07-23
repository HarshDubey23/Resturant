"use client";

import { Box, Circle, Flame, Info, Leaf, Minus, Plus, Sparkles, Star, View } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import type { TMenu } from "#utils/database/models/menu";
import { formatCurrency } from "#utils/helper/currency";
import { getPanoramicForItem } from "#utils/helper/panoramic";
import FoodViewer3D from "@/components/features/FoodViewer3DDynamic";
import PanoramicViewer from "@/components/features/PanoramicViewer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const vegStyles: Record<string, { color: string; label: string; bg: string; ring: string; Icon: typeof Leaf }> = {
	veg: { color: "text-emerald-600", label: "Veg", bg: "bg-emerald-50", ring: "ring-emerald-200", Icon: Leaf },
	"non-veg": { color: "text-rose-600", label: "Non-Veg", bg: "bg-rose-50", ring: "ring-rose-200", Icon: Flame },
	"contains-egg": { color: "text-amber-600", label: "Contains Egg", bg: "bg-amber-50", ring: "ring-amber-200", Icon: Circle },
};

const spiceLabels: Record<number, string> = {
	1: "Mild",
	2: "Medium",
	3: "Spicy",
	4: "Fiery",
};

interface MenuCardProps {
	item: TMenuCustom;
	quantity: number;
	restrictOrder?: boolean;
	showInfo?: boolean;
	setShowInfo: (id: boolean) => void;
	increaseQuantity: (item: TMenuCustom) => void;
	decreaseQuantity: (item: TMenuCustom) => void;
}

export type TMenuCustom = TMenu & { quantity: number };

export default function MenuCard({ item, quantity, restrictOrder, showInfo, setShowInfo, increaseQuantity, decreaseQuantity }: MenuCardProps) {
	const [cardRef, inView] = useInView({ threshold: 0.05, triggerOnce: true });
	const [isFlashing, setFlashing] = useState(false);
	const [viewerOpen, setViewerOpen] = useState(false);
	const [panoramicOpen, setPanoramicOpen] = useState(false);
	const [imgLoaded, setImgLoaded] = useState(false);
	const [imgFailed, setImgFailed] = useState(false);
	const flashTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	// Auto-attach a panoramic image if the item doesn't have one but matches a known dish.
	// This makes the "360° View" button appear on many more dishes for free.
	const panoramicImage = useMemo(() => {
		if (item.panoramicImage) return item.panoramicImage as string;
		return getPanoramicForItem({ slug: item.slug, name: item.name });
	}, [item.panoramicImage, item.slug, item.name]);

	// 3D preview is available whenever we have either an explicit 3D model OR an image
	// (the FoodViewer3D dialog falls back to a 3D parallax experience using the image).
	const has3DPreview = Boolean(item.model3d?.url || item.modelUrl || item.image);

	useEffect(() => {
		const handleHighlight = ((e: CustomEvent<{ id: string }>) => {
			if (e.detail.id === String(item._id)) {
				if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
				setFlashing(false);
				flashTimeoutRef.current = setTimeout(() => {
					setFlashing(true);
					flashTimeoutRef.current = setTimeout(() => setFlashing(false), 1800);
				}, 10);
			}
		}) as EventListener;

		window.addEventListener("highlight-item", handleHighlight);
		return () => {
			window.removeEventListener("highlight-item", handleHighlight);
			if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
		};
	}, [item._id]);

	const vegStyle = item.veg ? vegStyles[item.veg] : null;
	const isPopular = (item.rating ?? 0) >= 4.5 || item.tags?.includes?.("popular") === true;
	const isChefSpecial = item.tags?.includes?.("chef-special") === true || item.tags?.includes?.("signature") === true;
	const rating = item.rating ?? 0;
	const reviewCount = item.reviewCount ?? 0;
	const spiceLevel = item.spiceLevel;

	if (!inView) {
		return <div ref={cardRef} className="h-44" />;
	}

	return (
		<motion.div
			ref={cardRef}
			id={`menu-item-${item._id}`}
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				"group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft transition-all duration-200 ease-out",
				"hover:border-violet-600/40 hover:shadow-soft-hover hover:-translate-y-0.5",
				isFlashing && "ring-2 ring-violet-600 ring-offset-2 ring-offset-background",
				restrictOrder && "opacity-90",
				isChefSpecial && "border-amber-300/60 bg-gradient-to-br from-amber-50/40 via-card to-card",
			)}>
			{/* Premium corner ribbon for chef specials */}
			{isChefSpecial && (
				<div className="absolute right-0 top-0 z-20">
					<div className="bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg rounded-bl-xl flex items-center gap-1">
						<Sparkles className="h-3 w-3" />
						Chef's Special
					</div>
				</div>
			)}

			<div className="flex gap-0">
				{/* Image — bigger, with overlay gradient and lazy shimmer */}
				{item.image && !imgFailed ? (
					<div className="relative h-44 w-40 shrink-0 overflow-hidden bg-muted/40 sm:h-48 sm:w-44">
						{!imgLoaded && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/60 to-muted/20" />}
						<Image
							src={item.image}
							alt={item.name}
							fill
							loading="lazy"
							onLoad={() => setImgLoaded(true)}
							onError={() => setImgFailed(true)}
							className={cn("object-cover transition-all duration-500 group-hover:scale-110", !imgLoaded && "opacity-0")}
							sizes="(max-width: 640px) 160px, 176px"
						/>
						{/* Bottom gradient for text legibility if overlaid */}
						<div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

						{/* 3D badge over image */}
						{has3DPreview && (
							<button
								type="button"
								onClick={() => setViewerOpen(true)}
								className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm transition-all hover:bg-black/80 hover:scale-105">
								<Box className="h-3 w-3" />
								3D View
							</button>
						)}

						{/* 360° panoramic viewer button */}
						{panoramicImage && (
							<button
								type="button"
								onClick={() => setPanoramicOpen(true)}
								className={cn(
									"absolute bottom-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm transition-all hover:bg-black/80 hover:scale-105",
									has3DPreview ? "left-[90px]" : "left-2",
								)}>
								<View className="h-3 w-3" />
								360° View
							</button>
						)}

						{/* Spice level indicator over image */}
						{spiceLevel && spiceLevel >= 1 && (
							<div
								className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-black/60 px-2 py-1 backdrop-blur-sm"
								title={spiceLabels[spiceLevel]}>
								{Array.from({ length: spiceLevel }).map((_, i) => (
									<Flame key={i} className="h-2.5 w-2.5 fill-orange-500 text-orange-500" />
								))}
							</div>
						)}
					</div>
				) : item.image && imgFailed ? (
					<div className="relative h-44 w-40 shrink-0 overflow-hidden bg-gradient-to-br from-muted/60 to-muted/20 sm:h-48 sm:w-44">
						<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2 text-center">
							<div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/80">
								<Sparkles className="h-6 w-6 text-muted-foreground/80" />
							</div>
							<span className="text-[10px] font-medium text-muted-foreground line-clamp-2">{item.name}</span>
						</div>
						{has3DPreview && (
							<button
								type="button"
								onClick={() => setViewerOpen(true)}
								className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm transition-all hover:bg-black/80 hover:scale-105">
								<Box className="h-3 w-3" />
								3D View
							</button>
						)}
						{panoramicImage && (
							<button
								type="button"
								onClick={() => setPanoramicOpen(true)}
								className={cn(
									"absolute bottom-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm transition-all hover:bg-black/80 hover:scale-105",
									has3DPreview ? "left-[90px]" : "left-2",
								)}>
								<View className="h-3 w-3" />
								360° View
							</button>
						)}
					</div>
				) : (
					<div className="relative h-44 w-40 shrink-0 overflow-hidden bg-gradient-to-br from-muted/40 to-muted/10 sm:h-48 sm:w-44">
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/60">
								<Sparkles className="h-7 w-7 text-muted-foreground/60" />
							</div>
						</div>
					</div>
				)}

				{/* Content */}
				<div className="flex flex-1 flex-col justify-between min-w-0 p-4">
					<div className="space-y-1.5">
						{/* Title + rating row */}
						<div className="flex items-start justify-between gap-2">
							<h3 className="text-base font-bold leading-tight text-slate-900 line-clamp-1 group-hover:text-violet-600 transition-all duration-200">
								{item.name}
							</h3>
							{rating > 0 && (
								<div className="flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 ring-1 ring-amber-200">
									<Star className="h-3 w-3 fill-amber-500 text-amber-500" />
									<span className="text-[11px] font-bold text-amber-700 tabular-nums">{rating.toFixed(1)}</span>
									{reviewCount > 0 && <span className="text-[9px] text-amber-600/70">({reviewCount})</span>}
								</div>
							)}
						</div>

						{/* Veg / category badges */}
						<div className="flex flex-wrap items-center gap-1.5">
							{vegStyle && (
								<span
									className={cn(
										"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
										vegStyle.bg,
										vegStyle.color,
										vegStyle.ring,
									)}>
									<vegStyle.Icon className="h-2.5 w-2.5" />
									{vegStyle.label}
								</span>
							)}
							{isPopular && (
								<span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 ring-1 ring-purple-200">
									<Sparkles className="h-2.5 w-2.5" />
									Popular
								</span>
							)}
							{item.category && (
								<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-600">
									{item.category.replace(/-/g, " ")}
								</span>
							)}
						</div>

						{/* Description */}
						{item.description && <p className={cn("text-xs leading-relaxed text-muted-foreground", !showInfo && "line-clamp-2")}>{item.description}</p>}

						<AnimatePresence>
							{showInfo && item.description && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									className="overflow-hidden text-xs text-muted-foreground">
									<div className="pt-1">
										<button type="button" onClick={() => setShowInfo(false)} className="inline-flex items-center gap-1 text-primary hover:underline">
											<Info className="h-3 w-3" />
											Show less
										</button>
									</div>
								</motion.div>
							)}
						</AnimatePresence>

						{item.image && item.description && !showInfo && (
							<button
								type="button"
								onClick={() => setShowInfo(true)}
								className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary">
								<Info className="h-3 w-3" />
								More info
							</button>
						)}
					</div>

					{/* Footer: price + add control */}
					<div className="mt-3 flex items-end justify-between gap-2">
						<div className="flex flex-col">
							<span className="text-lg font-extrabold tracking-tight text-slate-900">{formatCurrency(item.price)}</span>
							{item.originalPrice && item.originalPrice > item.price && (
								<span className="text-[11px] text-muted-foreground line-through">{formatCurrency(item.originalPrice)}</span>
							)}
						</div>

						{!restrictOrder && (
							<div className="flex items-center gap-2">
								{quantity > 0 ? (
									<motion.div
										initial={{ scale: 0.9, opacity: 0 }}
										animate={{ scale: 1, opacity: 1 }}
										className="flex items-center gap-0 rounded-xl border-2 border-primary/20 bg-primary/5 p-1">
										<button
											type="button"
											onClick={() => decreaseQuantity(item)}
											className="flex h-8 w-8 items-center justify-center rounded-lg text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
											aria-label="Decrease quantity">
											<Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
										</button>
										<motion.span
											key={quantity}
											initial={{ scale: 0.7 }}
											animate={{ scale: 1 }}
											className="min-w-[2rem] text-center text-sm font-bold tabular-nums text-slate-900">
											{quantity}
										</motion.span>
										<button
											type="button"
											onClick={() => increaseQuantity(item)}
											className="flex h-8 w-8 items-center justify-center rounded-lg text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
											aria-label="Increase quantity">
											<Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
										</button>
									</motion.div>
								) : (
									<Button
										size="sm"
										type="button"
										onClick={() => increaseQuantity(item)}
										aria-label={`Add ${item.name} to cart`}
										className="h-9 gap-1 rounded-xl bg-gradient-to-br from-primary to-primary/90 px-4 font-semibold shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.03] active:scale-95">
										<Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
										Add
									</Button>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Flash overlay */}
			<AnimatePresence>
				{isFlashing && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.4 }}
						exit={{ opacity: 0 }}
						className="pointer-events-none absolute inset-0 bg-primary"
						style={{ mixBlendMode: "multiply" }}
					/>
				)}
			</AnimatePresence>

			<FoodViewer3D
				open={viewerOpen}
				onOpenChange={setViewerOpen}
				modelUrl={item.model3d?.url || item.modelUrl || undefined}
				itemName={item.name}
				fallbackImages={item.image ? [item.image] : []}
			/>

			<PanoramicViewer
				open={panoramicOpen}
				onOpenChange={setPanoramicOpen}
				imageUrl={panoramicImage as string}
				itemName={item.name}
				description={item.description ?? undefined}
				price={item.price}
				veg={item.veg ?? undefined}
			/>
		</motion.div>
	);
}
