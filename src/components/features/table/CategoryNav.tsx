"use client";

import { memo } from "react";
import { CATEGORY_ICONS } from "./constants";

interface CategoryNavProps {
	categories: string[];
	activeCategory: string;
	onSelect: (category: string) => void;
	scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export const CategoryNav = memo(function CategoryNav({ categories, activeCategory, onSelect, scrollRef }: CategoryNavProps) {
	return (
		<div ref={scrollRef} className="sticky top-16 lg:top-[88px] z-20 bg-background border-b border-border/50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6">
				<div className="py-3 overflow-x-auto scrollbar-none">
					<div className="flex gap-2" role="tablist" aria-label="Menu categories">
						{categories.map((cat) => (
							<button
								key={cat}
								role="tab"
								aria-selected={activeCategory === cat}
								onClick={() => onSelect(cat)}
								className={`relative shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
									activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
								}`}>
								{CATEGORY_ICONS[cat] && <span className="mr-1.5">{CATEGORY_ICONS[cat]}</span>}
								{cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
});
