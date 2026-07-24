"use client";

import { AlertCircle, ChefHat, Minus, Plus, ShoppingBag } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useOrder, useRestaurant } from "#components/context/useContext";
import { formatCurrency } from "#utils/helper/currency";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { TMenuCustom } from "./MenuCard";

const TIP_PRESETS = [20, 50, 100] as const;

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

	// ── Tip selector state ──────────────────────────────────────────────────
	// 3-E2 addition: trust feature, NOT a dark pattern. Nothing is pre-selected.
	// The customer must explicitly pick a preset, "No tip", or enter a custom
	// amount. Default state = no selection (functionally ₹0 tip).
	const [tipPreset, setTipPreset] = useState<number | "none" | null>(null);
	const [customTip, setCustomTip] = useState<string>("");

	const tipAmount = useMemo(() => {
		if (customTip.trim() !== "") {
			const n = Number(customTip);
			if (Number.isFinite(n) && n > 0) return Math.round(n * 100) / 100;
		}
		if (tipPreset === "none") return 0;
		if (typeof tipPreset === "number") return tipPreset;
		return 0;
	}, [customTip, tipPreset]);

	const selectPreset = (value: number | "none") => {
		setTipPreset(value);
		setCustomTip("");
	};

	const onCustomTipChange = (raw: string) => {
		// Allow only non-negative numeric input (incl. decimals). Stripping
		// non-numeric chars avoids accidental NaN/state corruption.
		const cleaned = raw.replace(/[^\d.]/g, "").slice(0, 6);
		setCustomTip(cleaned);
		if (cleaned !== "") setTipPreset(null);
		else if (tipPreset !== null) setTipPreset(null);
	};

	const selectionTotal = selectedProducts.reduce((sum, p) => sum + p.quantity * p.price, 0);
	const approvedCount = order?.products?.reduce((acc, p) => (p.adminApproved ? acc + 1 : acc), 0) ?? 0;
	const hasActiveOrder = order?.products?.length && approvedCount === 0;

	const onOrderAction = async () => {
		if (selectedProducts.length === 0) return;
		// Pass the tip through so the server-side order/place flow (or the
		// payment webhook) can record it on `order.tip` (field added by 2-C).
		await placeOrder(selectedProducts, undefined, tipAmount > 0 ? tipAmount : undefined);
		resetSelectedProducts();
	};

	const onCancelOrder = async () => {
		await cancelOrder();
		resetSelectedProducts();
	};

	useEffect(() => {
		if (!order) return;
		// FIX (audit E2): `table` is null during SSR/first hydration render
		// (useSearchParams returns null on the server). The previous check
		// `order.table && order.table !== table` evaluated to true whenever
		// `table` was null but `order.table` was set — cancelling the order
		// and signing the customer out on every fresh pageload. Now we only
		// act when BOTH values are defined and genuinely mismatched, so a
		// transient null can never trigger a destructive side-effect.
		if (!table) return;
		if (!order.table) return;
		if (order.table !== table) {
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

	const existingOrderTotal = (order?.orderTotal ?? 0) + (order?.taxTotal ?? 0);
	const grandTotalWithTip = existingOrderTotal + tipAmount;

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

				<TipSelector
					currency={currency}
					tipPreset={tipPreset}
					customTip={customTip}
					tipAmount={tipAmount}
					onSelectPreset={selectPreset}
					onCustomTipChange={onCustomTipChange}
				/>

				{tipAmount > 0 && (
					<>
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">Tip for staff</span>
							<span className="font-medium text-emerald-600 dark:text-emerald-400">+{formatCurrency(tipAmount, currency)}</span>
						</div>
						<div className="flex items-center justify-between text-sm font-semibold">
							<span>Grand total</span>
							<span className="tabular-nums">{formatCurrency(grandTotalWithTip, currency)}</span>
						</div>
					</>
				)}

				<Button
					className="w-full"
					size="lg"
					loading={placingOrder}
					onClick={onOrderAction}
					disabled={selectedProducts.length === 0}>
					{selectedProducts.length > 0
						? `Place Order — ${formatCurrency(selectionTotal + tipAmount, currency)}`
						: order?.products?.length
							? "Order Placed"
							: "Cart Empty"}
				</Button>
			</div>
		</div>
	);
}

// ─── Tip selector ────────────────────────────────────────────────────────────

interface TipSelectorProps {
	currency: string;
	tipPreset: number | "none" | null;
	customTip: string;
	tipAmount: number;
	onSelectPreset: (value: number | "none") => void;
	onCustomTipChange: (raw: string) => void;
}

function TipSelector({ currency, tipPreset, customTip, tipAmount, onSelectPreset, onCustomTipChange }: TipSelectorProps) {
	return (
		<fieldset className="space-y-2 pt-1">
			<legend className="text-xs font-medium text-muted-foreground">Add a tip for the staff? (Optional)</legend>
			<div role="radiogroup" aria-label="Tip amount" className="flex flex-wrap gap-2">
				{TIP_PRESETS.map((amount) => {
					const selected = tipPreset === amount;
					return (
						<motion.button
							key={`tip-${amount}`}
							type="button"
							role="radio"
							aria-checked={selected}
							onClick={() => onSelectPreset(amount)}
							whileTap={{ scale: 0.94 }}
							whileHover={{ scale: 1.02 }}
							transition={{ duration: 0.12, ease: "easeOut" }}
							className={cn(
								"min-h-[44px] rounded-full px-4 text-sm font-medium border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
								selected ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted",
							)}>
							{currency === "INR" ? "₹" : ""}{amount}
						</motion.button>
					);
				})}
				<motion.button
					key="tip-none"
					type="button"
					role="radio"
					aria-checked={tipPreset === "none"}
					onClick={() => onSelectPreset("none")}
					whileTap={{ scale: 0.94 }}
					whileHover={{ scale: 1.02 }}
					transition={{ duration: 0.12, ease: "easeOut" }}
					className={cn(
						"min-h-[44px] rounded-full px-4 text-sm font-medium border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
						tipPreset === "none" ? "bg-muted text-foreground border-foreground/30" : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground",
					)}>
					No tip
				</motion.button>
			</div>
			<div className="flex items-center gap-2 pt-1">
				<label htmlFor="tip-custom" className="text-xs text-muted-foreground shrink-0">
					Custom
				</label>
				<div className="relative flex-1">
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none" aria-hidden="true">
						{currency === "INR" ? "₹" : ""}
					</span>
					<input
						id="tip-custom"
						type="text"
						inputMode="decimal"
						value={customTip}
						onChange={(e) => onCustomTipChange(e.target.value)}
						placeholder="0"
						aria-label="Custom tip amount"
						className="h-10 w-full rounded-lg border border-input bg-background pl-7 pr-3 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
					/>
				</div>
				{tipAmount > 0 && (
					<span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium tabular-nums shrink-0" aria-live="polite">
						+{formatCurrency(tipAmount, currency)}
					</span>
				)}
			</div>
		</fieldset>
	);
}

// ─── Scrollable cart items (unchanged from 1-B) ──────────────────────────────

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
