"use client";

import { AlertCircle, ChefHat, Minus, Plus, ShoppingBag } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useOrder, useRestaurant } from "#components/context/useContext";
import { formatCurrency } from "#utils/helper/currency";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { TMenuCustom } from "./MenuCard";

interface CartPageProps {
	selectedProducts: Array<TMenuCustom>;
	increaseProductQuantity: (product: TMenuCustom) => void;
	decreaseProductQuantity: (product: TMenuCustom) => void;
	resetSelectedProducts: () => void;
}

export default function CartPage({ selectedProducts, increaseProductQuantity, decreaseProductQuantity, resetSelectedProducts }: CartPageProps) {
	const params = useSearchParams();
	const table = params.get("table");
	const { restaurant } = useRestaurant();
	const currency = restaurant?.profile?.currency || "INR";
	const { order, placeOrder, placingOrder, cancelOrder, cancelingOrder } = useOrder();
	const [showTaxSummary, setShowTaxSummary] = useState(false);

	const selectionTotal = selectedProducts.reduce((sum, p) => sum + p.quantity * p.price, 0);
	const approvedCount = order?.products?.reduce((acc, p) => (p.adminApproved ? acc + 1 : acc), 0) ?? 0;
	const hasActiveOrder = order?.products?.length && approvedCount === 0;

	const onOrderAction = async () => {
		if (selectedProducts.length === 0) return;
		await placeOrder(selectedProducts);
		resetSelectedProducts();
	};

	const onCancelOrder = async () => {
		await cancelOrder();
		resetSelectedProducts();
	};

	useEffect(() => {
		if (!order) return;
		if (order.table && order.table !== table) {
			cancelOrder();
			signOut();
		}
	}, [cancelOrder, order, table]);

	if (!selectedProducts.length && !order?.products?.length) {
		return (
			<div className="flex flex-col items-center justify-center h-full py-20 text-center px-4">
				<ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
				<p className="text-sm text-muted-foreground">Your cart is empty</p>
				<p className="text-xs text-muted-foreground mt-1">Add items from the menu to get started</p>
			</div>
		);
	}

	if (hasActiveOrder) {
		return (
			<div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
				<ChefHat className="h-12 w-12 text-primary mb-4" />
				<h3 className="text-lg font-semibold mb-1">Your order is being prepared</h3>
				<p className="text-sm text-muted-foreground mb-6">The kitchen will accept it shortly</p>
				<Button variant="destructive" size="sm" loading={cancelingOrder} onClick={onCancelOrder}>
					<AlertCircle className="h-4 w-4 mr-1" />
					Cancel Order
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			<ScrollableCartItems
				selectedProducts={selectedProducts}
				increaseProductQuantity={increaseProductQuantity}
				decreaseProductQuantity={decreaseProductQuantity}
				order={order}
				currency={currency}
			/>

			<div className="border-t bg-card p-4 space-y-3">
				{order?.orderTotal != null && (
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Subtotal</span>
						<span className="font-medium">{formatCurrency(order.orderTotal, currency)}</span>
					</div>
				)}

				{order?.taxTotal != null && order.taxTotal > 0 && (
					<button onClick={() => setShowTaxSummary(!showTaxSummary)} className="flex items-center justify-between text-sm w-full">
						<span className="text-muted-foreground underline underline-offset-2 decoration-dotted">Tax {showTaxSummary ? "(hide)" : "(show)"}</span>
						<span className="font-medium">{formatCurrency(order.taxTotal, currency)}</span>
					</button>
				)}

				{order?.orderTotal != null && order?.taxTotal != null && (
					<>
						<Separator />
						<div className="flex items-center justify-between text-sm font-semibold">
							<span>Total</span>
							<span>{formatCurrency(order.orderTotal + order.taxTotal, currency)}</span>
						</div>
					</>
				)}

				<Button className="w-full" size="lg" loading={placingOrder} onClick={onOrderAction} disabled={selectedProducts.length === 0}>
					{selectedProducts.length > 0 ? `Place Order — ${formatCurrency(selectionTotal, currency)}` : order?.products?.length ? "Order Placed" : "Cart Empty"}
				</Button>
			</div>
		</div>
	);
}

function ScrollableCartItems({
	selectedProducts,
	increaseProductQuantity,
	decreaseProductQuantity,
	order,
	currency,
}: {
	selectedProducts: Array<TMenuCustom>;
	increaseProductQuantity: (p: TMenuCustom) => void;
	decreaseProductQuantity: (p: TMenuCustom) => void;
	order?: { products?: Array<TMenuCustom & { adminApproved?: boolean; taxPercent?: number; tax?: number }>; orderTotal?: number; taxTotal?: number };
	currency: string;
}) {
	return (
		<div className="flex-1 overflow-auto px-4 py-4 space-y-3">
			<LayoutGroup>
				<AnimatePresence mode="popLayout">
					{order?.products
						?.filter((p) => p.adminApproved)
						.map((product) => (
							<motion.div
								key={String(product._id)}
								layout
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.95 }}
								className="flex items-center justify-between rounded-lg border bg-card/50 p-3">
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium truncate">{String(product.name)}</p>
									<p className="text-xs text-muted-foreground">
										{formatCurrency(product.price, currency)} × {product.quantity}
									</p>
								</div>
								<div className="text-sm font-semibold ml-2">{formatCurrency(product.price * product.quantity, currency)}</div>
							</motion.div>
						))}
				</AnimatePresence>
			</LayoutGroup>

			{order?.products?.some((p) => !p.adminApproved) && (
				<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
					<p className="font-medium">Pending approval</p>
					{order.products
						.filter((p) => !p.adminApproved)
						.map((p) => (
							<p key={String(p._id)}>
								{p.name} × {p.quantity}
							</p>
						))}
				</div>
			)}

			<LayoutGroup>
				<AnimatePresence mode="popLayout">
					{selectedProducts.map((product) => (
						<motion.div
							key={String(product._id)}
							layout
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20, height: 0 }}
							transition={{ duration: 0.2, ease: "easeOut" }}
							className="flex items-center justify-between rounded-lg border bg-card p-3">
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium truncate">{String(product.name)}</p>
								<p className="text-xs text-muted-foreground">{formatCurrency(product.price, currency)} each</p>
							</div>

							<div className="flex items-center gap-3 ml-3">
								<div className="flex items-center gap-1 rounded-md border">
									<button
										onClick={() => decreaseProductQuantity(product)}
										className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
										aria-label="Decrease quantity">
										<Minus className="h-3 w-3" />
									</button>
									<span className="min-w-[1.5rem] text-center text-sm font-medium tabular-nums">{product.quantity}</span>
									<button
										onClick={() => increaseProductQuantity(product)}
										className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
										aria-label="Increase quantity">
										<Plus className="h-3 w-3" />
									</button>
								</div>
								<span className="text-sm font-semibold min-w-[4rem] text-right">{formatCurrency(product.quantity * product.price, currency)}</span>
							</div>
						</motion.div>
					))}
				</AnimatePresence>
			</LayoutGroup>
		</div>
	);
}
