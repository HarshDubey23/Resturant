"use client";

import { useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

const emptySubscribe = () => () => {};

/**
 * Returns false on the server and during hydration, then true on the client
 * after hydration completes. Uses useSyncExternalStore to avoid both
 * hydration mismatches and setState-in-effect lint violations.
 */
function useHydrated(): boolean {
	return useSyncExternalStore(
		emptySubscribe,
		() => true,
		() => false,
	);
}

export default function CartFab() {
	const hydrated = useHydrated();
	const items = useCartStore((s) => s.items);
	const setOpen = useCartStore((s) => s.setOpen);
	const count = items.reduce((sum, i) => sum + i.qty, 0);

	const visible = hydrated && count > 0;

	return (
		<AnimatePresence>
			{visible && (
				<motion.button
					type="button"
					key="cart-fab"
					initial={{ opacity: 0, scale: 0.5, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.5, y: 20 }}
					transition={{ type: "spring", stiffness: 400, damping: 25 }}
					onClick={() => setOpen(true)}
					aria-label={`Open cart with ${count} ${count === 1 ? "item" : "items"}`}
					className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-2xl transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/50"
				>
					<ShoppingCart className="h-6 w-6" />
					<AnimatePresence mode="popLayout">
						<motion.span
							key={count}
							initial={{ scale: 0.5 }}
							animate={{ scale: [0.5, 1.35, 1] }}
							exit={{ scale: 0.5, opacity: 0 }}
							transition={{ duration: 0.35, times: [0, 0.5, 1] }}
							className="absolute -right-1.5 -top-1.5 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border-2 border-white bg-emerald-500 px-1.5 text-xs font-bold text-white"
						>
							{count}
						</motion.span>
					</AnimatePresence>
				</motion.button>
			)}
		</AnimatePresence>
	);
}
