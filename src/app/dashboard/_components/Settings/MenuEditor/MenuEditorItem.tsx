"use client";

import { Eye, EyeOff, ImageIcon, PencilLine, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useInView } from "react-intersection-observer";
import { useAdmin } from "#components/context/useContext";
import type { TMenu } from "#utils/database/models/menu";
import { formatCurrency } from "#utils/helper/currency";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MenuEditorItemProps {
	item: TMenu;
	onEdit: (item: TMenu) => void;
	onHide: (id: string, hidden: boolean) => void;
	hideSettingsLoading?: boolean;
}

const VEG_STYLES: Record<string, { label: string; className: string }> = {
	veg: { label: "Veg", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
	"non-veg": { label: "Non-Veg", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
	"contains-egg": { label: "Contains Egg", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
};

export default function MenuEditorItem({ item, onEdit, onHide, hideSettingsLoading = false }: MenuEditorItemProps) {
	const [itemRef, inView] = useInView({ threshold: 0 });
	const { profile } = useAdmin();
	const currency = profile?.currency || "INR";
	const [imgFailed, setImgFailed] = useState(false);

	return (
		<div ref={itemRef} className={cn("flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30", !inView && "min-h-[72px]")}>
			{inView && (
				<>
					<div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
						{item.image && !imgFailed ? (
							<Image src={item.image} alt={item.name} fill unoptimized className="object-cover" onError={() => setImgFailed(true)} />
						) : (
							<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/80 to-muted/40">
								<ImageIcon className="h-5 w-5 text-muted-foreground" />
							</div>
						)}
						{item.veg && (
							<span
								className={cn(
									"absolute bottom-0 left-0 text-[8px] font-semibold px-1 py-0.5 leading-none rounded-tr",
									VEG_STYLES[item.veg]?.className ?? "",
								)}>
								{VEG_STYLES[item.veg]?.label ?? item.veg}
							</span>
						)}
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-1.5">
							<p className="text-sm font-medium truncate">{item.name}</p>
							{item.rating !== undefined && item.rating > 0 && (
								<span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600">
									<Sparkles className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
									{item.rating.toFixed(1)}
								</span>
							)}
						</div>
						<p className="text-xs text-muted-foreground truncate">{item.description}</p>
						<div className="flex items-center gap-2 mt-0.5">
							<p className="text-xs font-semibold">{formatCurrency(item.price, currency)}</p>
							{item.originalPrice && item.originalPrice > item.price && (
								<p className="text-[10px] text-muted-foreground line-through">{formatCurrency(item.originalPrice, currency)}</p>
							)}
						</div>
					</div>
					<div className="flex items-center gap-1 shrink-0">
						<Button
							size="xs"
							variant={item.hidden ? "secondary" : "default"}
							onClick={() => onHide(item._id.toString(), !item.hidden)}
							loading={hideSettingsLoading}>
							{item.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
							{item.hidden ? "Hidden" : "Visible"}
						</Button>
						<Button size="xs" variant="outline" onClick={() => onEdit(item)}>
							<PencilLine className="h-3 w-3" />
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
