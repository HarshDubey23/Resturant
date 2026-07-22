"use client";

import { Box, Circle, Info, Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
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

const vegStyles: Record<string, { color: string; label: string; bg: string }> = {
        veg: { color: "text-green-600", label: "Veg", bg: "bg-green-100" },
        "non-veg": { color: "text-red-600", label: "Non-Veg", bg: "bg-red-100" },
        "contains-egg": { color: "text-yellow-600", label: "Contains Egg", bg: "bg-yellow-100" },
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

        if (!inView) {
                return <div ref={cardRef} className="h-28" />;
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
                <div
                        ref={cardRef}
                        id={`menu-item-${item._id}`}
                        className={cn(
                                "group relative flex gap-4 rounded-xl border bg-card p-4 transition-all duration-200",
                                isFlashing && "ring-2 ring-primary",
                                restrictOrder && "opacity-80",
                        )}>
                        {item.image && (
                                <div
                                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg cursor-pointer"
                                        onClick={open3DViewer}>
                                        <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="96px" />
                                        {/* 3D overlay button on the image */}
                                        {panoramicImage && (
                                                <div className="absolute top-1 right-1 flex items-center gap-0.5 rounded-full bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Box className="h-2.5 w-2.5" />
                                                        <span>3D</span>
                                                </div>
                                        )}
                                </div>
                        )}

                        <div className="flex flex-1 flex-col justify-between min-w-0">
                                <div className="space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                        <h3 className="text-sm font-medium text-foreground truncate">{item.name}</h3>
                                                        {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                                                </div>
                                                {vegStyle && (
                                                        <div className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 shrink-0", vegStyle.bg)}>
                                                                <Circle className={cn("h-2 w-2 fill-current", vegStyle.color)} />
                                                                <span className={cn("text-[10px] font-medium", vegStyle.color)}>{vegStyle.label}</span>
                                                        </div>
                                                )}
                                                {/* 3D badge — shows for items with panoramic image OR 3D model */}
                                                {(panoramicImage || has3DModel) && (
                                                        <Badge
                                                                variant="secondary"
                                                                className="shrink-0 cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors"
                                                                onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        open3DViewer();
                                                                }}>
                                                                <Box className="h-3 w-3 mr-1" />
                                                                3D
                                                        </Badge>
                                                )}
                                                {/* FoodViewer3D only renders when a real 3D model URL exists */}
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
                                        </div>

                                        {item.image && item.description && (
                                                <button
                                                        onClick={() => setShowInfo(!showInfo)}
                                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                                        <Info className="h-3 w-3" />
                                                        {showInfo ? "Less" : "More info"}
                                                </button>
                                        )}

                                        <AnimatePresence>
                                                {showInfo && item.description && (
                                                        <motion.p
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="text-xs text-muted-foreground overflow-hidden">
                                                                {item.description}
                                                        </motion.p>
                                                )}
                                        </AnimatePresence>
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                        <span className="text-sm font-semibold text-foreground">{formatCurrency(item.price)}</span>

                                        {!restrictOrder && (
                                                <div className="flex items-center gap-1">
                                                        {quantity > 0 ? (
                                                                <div className="flex items-center gap-1 rounded-lg border bg-background">
                                                                        <button
                                                                                onClick={() => decreaseQuantity(item)}
                                                                                className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                                                                aria-label="Decrease quantity">
                                                                                <Minus className="h-3 w-3" />
                                                                        </button>
                                                                        <span className="min-w-[1.5rem] text-center text-sm font-medium tabular-nums">{quantity}</span>
                                                                        <button
                                                                                onClick={() => increaseQuantity(item)}
                                                                                className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                                                                aria-label="Increase quantity">
                                                                                <Plus className="h-3 w-3" />
                                                                        </button>
                                                                </div>
                                                        ) : (
                                                                <Button size="sm" variant="outline" onClick={() => increaseQuantity(item)} aria-label={`Add ${item.name} to cart`}>
                                                                        <Plus className="h-3 w-3 mr-1" />
                                                                        Add
                                                                </Button>
                                                        )}
                                                </div>
                                        )}
                                </div>
                        </div>
                </div>
        );
}
