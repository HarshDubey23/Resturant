"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityButtonProps {
	className?: string;
	disabled?: boolean;
	filled?: boolean;
	quantity: number;
	increaseQuantity: () => void;
	decreaseQuantity: () => void;
}

export default function QuantityButton({ className, disabled, quantity, increaseQuantity, decreaseQuantity }: QuantityButtonProps) {
	return (
		<div className={cn("flex items-center gap-1", className)}>
			{quantity > 0 && (
				<button
					onClick={decreaseQuantity}
					disabled={disabled}
					className="flex h-7 w-7 items-center justify-center rounded-md border bg-background text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
					aria-label="Decrease quantity">
					<Minus className="h-3 w-3" />
				</button>
			)}
			<span className={cn("min-w-[1.5rem] text-center text-sm font-medium tabular-nums", quantity === 0 && "text-muted-foreground")}>{quantity || 0}</span>
			<button
				onClick={increaseQuantity}
				disabled={disabled}
				className="flex h-7 w-7 items-center justify-center rounded-md border bg-background text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
				aria-label="Increase quantity">
				<Plus className="h-3 w-3" />
			</button>
		</div>
	);
}
