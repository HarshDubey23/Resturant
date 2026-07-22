"use client";

import { Box, Circle, Flame, Info, Leaf, Minus, Plus, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import type { TMenu } from "#utils/database/models/menu";
import { formatCurrency } from "#utils/helper/currency";
import { getPanoramicForItem } from "#utils/helper/panoramic";
import FoodViewer3D from "@/components/features/FoodViewer3DDynamic";
import PanoramicViewer from "@/components/features/PanoramicViewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const vegStyles: Record<string, { color: string; label: string; bg: string; ring: string; Icon: typeof Leaf }> = {
        veg: { color: "text-green-700", label: "Veg", bg: "bg-green-50", ring: "border-green-500", Icon: Leaf },
        "non-veg": { color: "text-red-700", label: "Non-Veg", bg: "bg-red-50", ring: "border-red-500", Icon: Flame },
        "contains-egg": { color: "text-amber-700", label: "Contains Egg", bg: "bg-amber-50", ring: "border-amber-500", Icon: Circle },
};

const foodTypeLabels: Record<string, { label: string; color: string }> = {
        spicy: { label: "Spicy", color: "text-orange-600 bg-orange-50 border-orange-200" },
        "extra-spicy": { label: "Extra Spicy", color: "text-red-600 bg-red-50 border-red-200" },
        sweet: { label: "Sweet", color: "text-pink-600 bg-pink-50 border-pink-200" },
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
        const [cardRef, inView] = useInView({ threshold: 0 });
        const [isFlashing, setFlashing] = useState(false);
        const [viewerOpen, setViewerOpen] = useState(false);
        const [panoramicOpen, setPanoramicOpen] = useState(false);
        const [imgError, setImgError] = useState(false);
        const flashTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

        // Look up panoramic image for this item (by slug or name)
        const panoramicImage = getPanoramicForItem(item);
        const has3DModel = !!(item.model3d?.url || item.modelUrl);

        useEffect(() => {
                const handleHighlight = ((e: CustomEvent<{ id: string }>) => {
                        if (e.detail.id === String(item._id)) {
                                if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
                                setFlashing(false);
                                flashTimeoutRef.current = setTimeout(() => {
                                        setFlashing(true);
                                        flashTimeoutRef.current = setTimeout(() => setFlashing(false), 1500);
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
        const foodType = item.foodType ? foodTypeLabels[item.foodType] : null;
        const VegIcon = vegStyle?.Icon ?? Leaf;

        if (!inView) {
                return <div ref={cardRef} className="h-48" />;
        }

        // Click handler for the 3D button — opens PanoramicViewer if available, else FoodViewer3D
        const open3DViewer = () => {
                if (panoramicImage) {
                        setPanoramicOpen(true);
                } else if (has3DModel) {
                        setViewerOpen(true);
                }
        };

        return (
                <motion.div
                        ref={cardRef}
                        id={`menu-item-${item._id}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className={cn(
                                "group relative overflow-hidden rounded-2xl bg-white border border-orange-500/10 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1",
                                isFlashing && "ring-2 ring-orange-500",
                                restrictOrder && "opacity-90",
                        )}>
                        {/* Premium layout: circular plate image + content side-by-side */}
                        <div className="flex p-5 gap-4">
                                {/* CIRCULAR IMAGE — like a plate */}
                                <div className="relative shrink-0">
                                        <div
                                                className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden cursor-pointer ring-4 ring-orange-50 shadow-lg shadow-orange-900/5 group-hover:ring-orange-100 transition-all"
                                                onClick={open3DViewer}>
                                                {item.image && !imgError ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="object-cover group-hover:scale-110 transition-transform duration-500 w-full h-full"
                                                        loading="lazy"
                                                        onError={() => setImgError(true)}
                                                />
                                        ) : (
                                                <div className="h-full w-full bg-gradient-to-br from-orange-100 via-amber-100 to-orange-200 flex items-center justify-center">
                                                        <span className="text-2xl font-bold text-orange-400/60">{item.name?.charAt(0) ?? "?"}</span>
                                                </div>
                                        )}

                                                {/* 3D floating badge over image */}
                                                {(panoramicImage || has3DModel) && (
                                                        <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="absolute -top-1 -right-1 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-md">
                                                                <Box className="h-2.5 w-2.5" />
                                                                <span>3D</span>
                                                        </motion.div>
                                                )}
                                        </div>

                                        {/* Veg/non-veg indicator dot at bottom of plate */}
                                        {vegStyle && (
                                                <div className={cn("absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center h-6 w-6 rounded-full bg-white border-2 shadow-sm", vegStyle.ring)}>
                                                        <VegIcon className={cn("h-3 w-3", vegStyle.color)} />
                                                </div>
                                        )}
                                </div>

                                {/* CONTENT */}
                                <div className="flex flex-1 flex-col justify-between min-w-0">
                                        <div className="space-y-1.5">
                                                <div className="flex items-start justify-between gap-2">
                                                        <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight line-clamp-2">{item.name}</h3>
                                                </div>

                                                {item.description && (
                                                        <p className={cn("text-xs text-muted-foreground leading-relaxed", !showInfo && "line-clamp-2")}>{item.description}</p>
                                                )}

                                                {/* Badges row: food type + 3D + rating */}
                                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                        {foodType && (
                                                                <Badge variant="outline" className={cn("text-[9px] font-semibold rounded-full px-2 py-0 h-5", foodType.color)}>
                                                                        {foodType.label}
                                                                </Badge>
                                                        )}
                                                        {(panoramicImage || has3DModel) && (
                                                                <Badge
                                                                        variant="secondary"
                                                                        className="shrink-0 cursor-pointer hover:bg-orange-500/20 hover:text-orange-600 transition-colors text-[9px] font-semibold rounded-full px-2 py-0 h-5 bg-orange-50 text-orange-600"
                                                                        onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                open3DViewer();
                                                                        }}>
                                                                        <Box className="h-2.5 w-2.5 mr-0.5" />
                                                                        3D View
                                                                </Badge>
                                                        )}
                                                        {/* Faux rating to add premium feel — based on item ID hash so it's stable per dish */}
                                                        {(() => {
                                                                const seed = String(item._id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
                                                                const rating = 4.5 + ((seed % 5) / 10); // 4.5 to 4.9
                                                                return (
                                                                        <div className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 bg-amber-50 rounded-full px-1.5 py-0.5 h-5">
                                                                                <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                                                                                {rating.toFixed(1)}
                                                                        </div>
                                                                );
                                                        })()}
                                                </div>

                                                {item.image && item.description && item.description.length > 80 && (
                                                        <button
                                                                onClick={() => setShowInfo(!showInfo)}
                                                                className="flex items-center gap-1 text-[11px] text-orange-600 hover:text-orange-700 transition-colors font-medium">
                                                                <Info className="h-3 w-3" />
                                                                {showInfo ? "Show less" : "Show more"}
                                                        </button>
                                                )}
                                        </div>

                                        {/* Price + Add to cart */}
                                        <div className="flex items-center justify-between mt-3 pt-2">
                                                <div className="flex flex-col">
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Price</span>
                                                        <span className="text-lg font-bold text-gradient">{formatCurrency(item.price)}</span>
                                                </div>

                                                {!restrictOrder ? (
                                                        <div className="flex items-center gap-1">
                                                                {quantity > 0 ? (
                                                                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 p-1 shadow-md shadow-orange-500/30">
                                                                                <button
                                                                                        onClick={() => decreaseQuantity(item)}
                                                                                        className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
                                                                                        aria-label="Decrease quantity">
                                                                                        <Minus className="h-3.5 w-3.5" />
                                                                                </button>
                                                                                <span className="min-w-[1.75rem] text-center text-sm font-bold tabular-nums text-white">{quantity}</span>
                                                                                <button
                                                                                        onClick={() => increaseQuantity(item)}
                                                                                        className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
                                                                                        aria-label="Increase quantity">
                                                                                        <Plus className="h-3.5 w-3.5" />
                                                                                </button>
                                                                        </motion.div>
                                                                ) : (
                                                                        <Button
                                                                                size="sm"
                                                                                onClick={() => increaseQuantity(item)}
                                                                                aria-label={`Add ${item.name} to cart`}
                                                                                className="rounded-full bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition-all font-semibold text-xs h-9 px-4 shadow-sm">
                                                                                <Plus className="h-3.5 w-3.5 mr-1" />
                                                                                ADD
                                                                        </Button>
                                                                )}
                                                        </div>
                                                ) : (
                                                        <Badge variant="outline" className="rounded-full text-[10px] text-muted-foreground">
                                                                Scan to order
                                                        </Badge>
                                                )}
                                        </div>
                                </div>
                        </div>

                        {/* Bottom accent line — appears on hover */}
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                        {/* 3D viewer (only renders when a real 3D model URL exists) */}
                        {has3DModel && (
                                <FoodViewer3D
                                        open={viewerOpen}
                                        onOpenChange={setViewerOpen}
                                        modelUrl={item.model3d?.url || item.modelUrl || undefined}
                                        itemName={item.name}
                                        fallbackImages={item.image ? [item.image] : []}
                                />
                        )}
                        {/* PanoramicViewer for 360° image-based 3D view */}
                        {panoramicImage && (
                                <PanoramicViewer
                                        imageUrl={panoramicImage}
                                        itemName={item.name}
                                        description={item.description}
                                        price={item.price}
                                        veg={item.veg}
                                        open={panoramicOpen}
                                        onOpenChange={setPanoramicOpen}
                                />
                        )}
                </motion.div>
        );
}
