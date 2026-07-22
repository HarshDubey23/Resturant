"use client";

import { AnimatePresence } from "motion/react";
import { memo } from "react";
import { MenuItemCard } from "./MenuItemCard";
import type { MenuItem } from "./types";

interface MenuGridProps {
	items: MenuItem[];
	onAddToCart: (item: MenuItem, spiceLevel: string, notes: string) => void;
	currency: string;
}

export const MenuGrid = memo(function MenuGrid({ items, onAddToCart, currency }: MenuGridProps) {
	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<div className="text-6xl mb-4">🔍</div>
				<h3 className="text-xl font-semibold text-foreground">No items found</h3>
				<p className="text-muted-foreground mt-2">Try a different search or category.</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
			<AnimatePresence mode="popLayout">
				{items.map((item, index) => (
					<MenuItemCard key={item._id} item={item} index={index} onAddToCart={onAddToCart} currency={currency} />
				))}
			</AnimatePresence>
		</div>
	);
});
