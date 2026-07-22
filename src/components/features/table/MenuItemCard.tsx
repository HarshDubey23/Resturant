"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { memo, useState } from "react";
import FoodViewer3D from "@/components/features/FoodViewer3DDynamic";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/helper/currency";
import { SPICE_LEVELS } from "./constants";
import type { MenuItem } from "./types";

interface MenuItemCardProps {
	item: MenuItem;
	index: number;
	onAddToCart: (item: MenuItem, spiceLevel: string, notes: string) => void;
	currency: string;
}

/**
 * Memoized menu card — with 20–30 items on screen, typing in the search box
 * previously re-rendered every card on each keystroke. Stable props
 * (item, index, onAddToCart, currency) mean React can now skip untouched cards.
 */
export const MenuItemCard = memo(function MenuItemCard({ item, index, onAddToCart, currency }: MenuItemCardProps) {
	const [spiceLevel, setSpiceLevel] = useState("medium");
	const [notes, setNotes] = useState("");
	const [showDetails, setShowDetails] = useState(false);
	const [qty, setQty] = useState(0);
	const [previewOpen, setPreviewOpen] = useState(false);

	const handleAdd = () => {
		onAddToCart(item, spiceLevel, notes);
		setQty((prev) => prev + 1);
	};

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03 }}
			whileHover={{ y: -4 }}
			className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300">
			<div className="relative aspect-[4/3] overflow-hidden bg-muted">
				{item.image ? (
					<Image
						src={item.image}
						alt={item.name}
						fill
						className="object-cover group-hover:scale-105 transition-transform duration-500"
						sizes="(max-width:768px) 50vw, 25vw"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground/30">🍽️</div>
				)}
				<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
				<div className="absolute top-2 left-2 flex gap-1.5">
					<Badge
						variant={item.veg === "veg" ? "default" : "destructive"}
						className={`text-[10px] px-1.5 py-0.5 h-auto ${item.veg === "veg" ? "bg-green-600" : "bg-red-600"}`}>
						{item.veg === "veg" ? "🟢 Veg" : item.veg === "non-veg" ? "🔴 Non-Veg" : "🟡 Egg"}
					</Badge>
					{(item.model3d?.url || item.modelUrl) && (
						<>
							<Badge
								variant="secondary"
								className="text-[10px] px-1.5 py-0.5 h-auto cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
								onClick={() => setPreviewOpen(true)}>
								3D
							</Badge>
							<FoodViewer3D
								open={previewOpen}
								onOpenChange={setPreviewOpen}
								modelUrl={item.model3d?.url || item.modelUrl || undefined}
								itemName={item.name}
								fallbackImages={item.image ? [item.image] : []}
							/>
						</>
					)}
				</div>
				<div className="absolute bottom-2 left-2 right-2">
					<h3 className="text-white font-bold text-sm drop-shadow-md truncate">{item.name}</h3>
					<p className="text-white/80 text-xs font-bold drop-shadow-md">{formatCurrency(item.price, currency)}</p>
				</div>
			</div>

			<div className="p-3 space-y-2">
				{showDetails && item.description && (
					<motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="text-xs text-muted-foreground leading-relaxed">
						{item.description}
					</motion.p>
				)}

				{/* Spice Level */}
				<div>
					<p className="text-[10px] font-medium text-muted-foreground mb-1">🌶️ Spice Level</p>
					<div className="flex gap-1">
						{SPICE_LEVELS.map((level) => (
							<button
								key={level.value}
								onClick={() => setSpiceLevel(level.value)}
								aria-pressed={spiceLevel === level.value}
								className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-all ${
									spiceLevel === level.value ? "bg-primary/10 text-primary ring-1 ring-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"
								}`}>
								{level.emoji} {level.label}
							</button>
						))}
					</div>
				</div>

				{/* Special Instructions */}
				<textarea
					placeholder="Special instructions... (e.g., extra spicy, no onions)"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					aria-label={`Special instructions for ${item.name}`}
					className="w-full text-xs border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 bg-muted/30"
					rows={1}
				/>

				{/* Add to Cart */}
				<div className="flex gap-2 pt-1">
					{qty > 0 ? (
						<div className="flex items-center gap-2 w-full">
							<button
								onClick={() => setQty((prev) => Math.max(0, prev - 1))}
								aria-label={`Remove one ${item.name}`}
								className="flex-1 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 transition-colors">
								−
							</button>
							<span className="w-6 text-center text-sm font-bold">{qty}</span>
							<button
								onClick={handleAdd}
								aria-label={`Add one more ${item.name}`}
								className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
								+
							</button>
						</div>
					) : (
						<button
							onClick={handleAdd}
							className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-transform active:scale-[0.97]">
							Add · {formatCurrency(item.price, currency)}
						</button>
					)}
				</div>

				<button onClick={() => setShowDetails((v) => !v)} className="w-full text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
					{showDetails ? "▲ Less" : "▼ More"}
				</button>
			</div>
		</motion.div>
	);
});
