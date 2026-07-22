"use client";

import { Box, CookingPot, Drumstick, Leaf, Star, View } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { formatCurrency } from "#utils/helper/currency";
import { getPanoramicForItem } from "#utils/helper/panoramic";
import FoodViewer3D from "@/components/features/FoodViewer3DDynamic";
import PanoramicViewer from "@/components/features/PanoramicViewer";
import { cn } from "@/lib/utils";
import type { MenuSuggestion } from "../../types/chat";

interface MenuCardProps {
	item: MenuSuggestion;
}

const VEG_ICONS: Record<string, { icon: typeof Leaf; className: string }> = {
	veg: { icon: Leaf, className: "text-green-600" },
	"non-veg": { icon: Drumstick, className: "text-red-600" },
	"contains-egg": { icon: CookingPot, className: "text-yellow-600" },
};

export function MenuCard({ item }: MenuCardProps) {
	const [imgFailed, setImgFailed] = useState(false);
	const [viewerOpen, setViewerOpen] = useState(false);
	const [panoramicOpen, setPanoramicOpen] = useState(false);

	const handleClick = () => {
		const el = document.getElementById(`menu-item-${item._id}`);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
			window.dispatchEvent(new CustomEvent("highlight-item", { detail: { id: String(item._id) } }));
		}
	};

	const VegIcon = item.veg ? VEG_ICONS[item.veg]?.icon : null;

	// Auto-attach a panoramic image if the item matches a known dish.
	const panoramicImage = useMemo(() => {
		const explicit = (item as { panoramicImage?: string }).panoramicImage;
		if (explicit) return explicit;
		return getPanoramicForItem({ name: item.name, slug: (item as { slug?: string }).slug });
	}, [item]);

	const rating = (item as { rating?: number }).rating ?? 0;
	const has3DPreview = Boolean(item.image);

	return (
		<>
			<div className="flex items-center gap-2 rounded-lg border bg-card p-2 text-left text-sm transition-colors hover:bg-muted/50">
				{item.image && !imgFailed ? (
					<button
						type="button"
						onClick={handleClick}
						className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted"
						aria-label={`View ${item.name} on menu`}>
						<Image src={item.image} alt={item.name} fill unoptimized className="object-cover" onError={() => setImgFailed(true)} />
					</button>
				) : (
					<button
						type="button"
						onClick={handleClick}
						className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-muted/80 to-muted/40"
						aria-label={`View ${item.name} on menu`}>
						<CookingPot className="h-5 w-5 text-muted-foreground/70" />
					</button>
				)}

				<div className="min-w-0 flex-1">
					<button type="button" onClick={handleClick} className="block w-full text-left">
						<h4 className="text-sm font-medium truncate hover:text-primary transition-colors">{item.name}</h4>
						<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
							{VegIcon && <VegIcon className={cn("h-3 w-3", VEG_ICONS[item.veg || "veg"]?.className)} />}
							<span className="font-semibold text-foreground">{formatCurrency(item.price)}</span>
							{rating > 0 && (
								<span className="inline-flex items-center gap-0.5 text-amber-600">
									<Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
									<span className="text-[10px] tabular-nums">{rating.toFixed(1)}</span>
								</span>
							)}
						</p>
					</button>
				</div>

				<div className="flex shrink-0 items-center gap-1">
					{has3DPreview && (
						<button
							type="button"
							onClick={() => setViewerOpen(true)}
							title="3D preview"
							className="flex h-7 w-7 items-center justify-center rounded-md bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
							<Box className="h-3.5 w-3.5 text-foreground/70" />
						</button>
					)}
					{panoramicImage && (
						<button
							type="button"
							onClick={() => setPanoramicOpen(true)}
							title="360° view"
							className="flex h-7 w-7 items-center justify-center rounded-md bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
							<View className="h-3.5 w-3.5 text-foreground/70" />
						</button>
					)}
				</div>
			</div>

			<FoodViewer3D
				open={viewerOpen}
				onOpenChange={setViewerOpen}
				modelUrl={(item as { model3d?: { url?: string } | null }).model3d?.url || (item as { modelUrl?: string }).modelUrl || undefined}
				itemName={item.name}
				fallbackImages={item.image ? [item.image] : []}
			/>

			{panoramicImage && (
				<PanoramicViewer
					open={panoramicOpen}
					onOpenChange={setPanoramicOpen}
					imageUrl={panoramicImage}
					itemName={item.name}
					description={item.description ?? undefined}
					price={item.price}
					veg={item.veg ?? undefined}
				/>
			)}
		</>
	);
}
