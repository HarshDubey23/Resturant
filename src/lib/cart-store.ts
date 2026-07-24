"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
	id: string;
	name: string;
	price: number;
	image: string;
	qty: number;
	spice?: number;
	notes?: string;
};

type CartState = {
	items: CartItem[];
	isOpen: boolean;
	addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
	removeItem: (id: string) => void;
	updateQty: (id: string, qty: number) => void;
	clear: () => void;
	setOpen: (open: boolean) => void;
	totalItems: () => number;
	totalPrice: () => number;
};

export const useCartStore = create<CartState>()(
	persist(
		(set, get) => ({
			items: [],
			isOpen: false,
			addItem: (item, qty = 1) =>
				set((state) => {
					const existing = state.items.find((i) => i.id === item.id);
					if (existing) {
						return {
							items: state.items.map((i) =>
								i.id === item.id ? { ...i, qty: i.qty + qty } : i,
							),
						};
					}
					return { items: [...state.items, { ...item, qty }] };
				}),
			removeItem: (id) =>
				set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
			updateQty: (id, qty) =>
				set((state) => ({
					items:
						qty <= 0
							? state.items.filter((i) => i.id !== id)
							: state.items.map((i) => (i.id === id ? { ...i, qty } : i)),
				})),
			clear: () => set({ items: [] }),
			setOpen: (open) => set({ isOpen: open }),
			totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),
			totalPrice: () => get().items.reduce((sum, i) => sum + i.qty * i.price, 0),
		}),
		{
			name: "orderworder-cart",
			// Only persist the items, never the drawer open state
			partialize: (state) => ({ items: state.items }),
		},
	),
);
