"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "sonner";

export interface CartLine {
	dishId: string;
	name: string;
	price: number;
	qty: number;
	image: string;
}

interface CartContextValue {
	lines: CartLine[];
	count: number;
	total: number;
	add: (line: Omit<CartLine, "qty">, qty?: number) => void;
	clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
	const [lines, setLines] = useState<CartLine[]>([]);

	const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
		setLines((prev) => {
			const existing = prev.find((l) => l.dishId === line.dishId);
			if (existing) {
				return prev.map((l) => (l.dishId === line.dishId ? { ...l, qty: l.qty + qty } : l));
			}
			return [...prev, { ...line, qty }];
		});
		toast.success(`${line.name} added to cart`, {
			description: `₹${line.price} · decorative demo cart`,
		});
	}, []);

	const clear = useCallback(() => setLines([]), []);

	const count = useMemo(() => lines.reduce((sum, l) => sum + l.qty, 0), [lines]);
	const total = useMemo(() => lines.reduce((sum, l) => sum + l.qty * l.price, 0), [lines]);

	const value = useMemo<CartContextValue>(() => ({ lines, count, total, add, clear }), [lines, count, total, add, clear]);

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useDemoCart() {
	const ctx = useContext(CartContext);
	if (!ctx) throw new Error("useDemoCart must be used within a CartProvider");
	return ctx;
}
