"use client";

import { Box, Circle, Info, Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Icon } from "xtreme-ui";

import QuantityButton from "#components/base/QuantityButton";
import PanoramicViewer from "#components/features/PanoramicViewer";
import type { TMenu } from "#utils/database/models/menu";
import { getPanoramicForItem } from "#utils/helper/panoramic";

const vegIcon = {
	veg: "f4d8",
	"non-veg": "f6d6",
	"contains-egg": "f7fb",
} as const;

const MenuCard = (props: TMenuCardProps) => {
	const { className, show, restrictOrder, showInfo, setShowInfo, item, quantity } = props;
	const [cardRef, inView] = useInView({ threshold: 0 });
	const [isFlashing, setFlashing] = useState(false);
	const [viewerOpen, setViewerOpen] = useState(false);
	const flashTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

	// Look up panoramic image for this item (by slug or name)
	const panoramicImage = getPanoramicForItem(item);

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

	const classList =
		`${className ?? ""} ${isFlashing ? "flash" : ""} ${restrictOrder ? "restrictOrder" : ""} ${showInfo ? "showInfo" : ""} ${!item.image ? "withoutImage" : ""} ${window.matchMedia("(hover: hover)").matches ? "hoverSupported" : ""}`.trim();

	if (!show) return null;

	return (
		<div id={`menu-item-${item._id}`} className={`menuCard ${classList} ${!inView ? "blank" : ""}`} ref={cardRef}>
			{inView && (
				<>
					{item.image && (
						<div className="picture">
							<span style={{ background: `url(${item.image})` }} />
							<div className="description">{item.description}</div>
							{/* 3D View button overlay — only show when a panoramic image is available */}
							{panoramicImage && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										setViewerOpen(true);
									}}
									className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-white shadow-lg hover:bg-black/80 hover:scale-105 active:scale-95 transition-all"
									aria-label={`View 3D ${item.name}`}>
									<Box className="h-3 w-3" />
									<span>3D</span>
								</button>
							)}
						</div>
					)}
					{item.veg && (
						<div className={`vegIcon ${item.veg}`}>
							<Icon className="icon" type="solid" size={16} code={vegIcon[item.veg]} />
							<span className="label">{item.veg.replace(/-/g, " ")}</span>
						</div>
					)}
					<div className="options">
						<div className="title">
							<span>{item.name}</span>
							{item.image && (
								<div className="info" onClick={() => setShowInfo(showInfo ? false : !!item._id)}>
									<Icon code={showInfo ? "f00d" : "f05a"} set="duotone" type="solid" />
								</div>
							)}
							{/* 3D badge next to title — for items without image but with panoramic */}
							{!item.image && panoramicImage && (
								<button
									type="button"
									onClick={() => setViewerOpen(true)}
									className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors"
									aria-label={`View 3D ${item.name}`}>
									<Box className="h-3 w-3" />
									<span>3D</span>
								</button>
							)}
						</div>
						{!item.image && <div className="description">{item.description}</div>}
						<div className="footer">
							{!item.image && <div className="priceNoImage rupee">{item.price}</div>}
							<QuantityButton
								className="addToCart"
								quantity={quantity}
								filled
								increaseQuantity={() => props.increaseQuantity(item)}
								decreaseQuantity={() => props.decreaseQuantity(item)}
							/>
						</div>
					</div>
					{item.image && (
						<div className="price rupee">
							<div className="ribbonTop" />
							<div className="ribbonBottom" />
							<span>{item.price}</span>
						</div>
					)}

					{/* 3D Panoramic Viewer Modal */}
					{panoramicImage && (
						<PanoramicViewer
							imageUrl={panoramicImage}
							itemName={item.name}
							description={item.description}
							price={item.price}
							veg={item.veg}
							open={viewerOpen}
							onOpenChange={setViewerOpen}
						/>
					)}
				</>
			)}
		</div>
	);
};

export default MenuCard;

type TMenuCardProps = {
	className?: string;
	show?: boolean;
	restrictOrder?: boolean;
	showInfo?: boolean;
	setShowInfo: (showInfo: boolean) => void;
	item: TMenuCustom;
	quantity: number;
	increaseQuantity: (item: TMenuCustom) => void;
	decreaseQuantity: (item: TMenuCustom) => void;
};

type TMenuCustom = TMenu & { quantity: number };
