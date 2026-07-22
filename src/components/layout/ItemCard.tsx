"use client";

import { useInView } from "react-intersection-observer";
import QuantityButton from "#components/base/QuantityButton";
import type { TMenu } from "#utils/database/models/menu";
import { formatCurrency } from "#utils/helper/currency";
import { cn } from "@/lib/utils";

type TMenuCustom = TMenu & { quantity: number };

interface ItemCardProps {
	className?: string;
	item: TMenuCustom;
	staticCard?: boolean;
	increaseQuantity?: (item: TMenuCustom) => void;
	decreaseQuantity?: (item: TMenuCustom) => void;
}

export default function ItemCard({ className, item, staticCard, increaseQuantity, decreaseQuantity }: ItemCardProps) {
	const [cardRef, inView] = useInView({ triggerOnce: true, threshold: 0 });
	const total = item.quantity ? item.price * item.quantity : item.price;

	return (
		<div ref={cardRef} className={cn("flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors", className)}>
			{inView && (
				<>
					{item.image && (
						<div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
							<span className="block h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
						</div>
					)}
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium truncate">{item.name}</p>
						<div className="flex items-center justify-between mt-1">
							<p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
							{staticCard && item.quantity > 0 && <p className="text-xs text-muted-foreground">× {item.quantity}</p>}
						</div>
					</div>
					{staticCard ? (
						<div className="text-sm font-semibold shrink-0">{formatCurrency(total)}</div>
					) : (
						increaseQuantity &&
						decreaseQuantity && (
							<QuantityButton quantity={item.quantity} increaseQuantity={() => increaseQuantity(item)} decreaseQuantity={() => decreaseQuantity(item)} />
						)
					)}
				</>
			)}
		</div>
	);
}
