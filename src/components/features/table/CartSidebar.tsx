"use client";

import { motion } from "motion/react";
import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/helper/currency";
import { SPICE_LEVELS } from "./constants";
import type { CartItem, CartTotal } from "./types";

interface CartSidebarProps {
	cart: CartItem[];
	cartTotal: CartTotal;
	couponCode: string;
	setCouponCode: (code: string) => void;
	applyCoupon: () => void;
	updateQuantity: (id: string, delta: number) => void;
	removeFromCart: (id: string) => void;
	placeOrder: () => void;
	paymentMethod: "razorpay" | "cash";
	setPaymentMethod: (method: "razorpay" | "cash") => void;
	isPlacingOrder: boolean;
	currency: string;
}

export const CartSidebar = memo(function CartSidebar({
	cart,
	cartTotal,
	couponCode,
	setCouponCode,
	applyCoupon,
	updateQuantity,
	removeFromCart,
	placeOrder,
	paymentMethod,
	setPaymentMethod,
	isPlacingOrder,
	currency,
}: CartSidebarProps) {
	return (
		<Card className="p-4 space-y-4 border-border/50 shadow-lg">
			<div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
				{cart.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<div className="text-4xl mb-2">🛒</div>
						<p className="text-sm">Your cart is empty</p>
					</div>
				) : (
					cart.map((item) => {
						const customizationsTotal = item.selectedCustomizations.reduce((s, c) => s + c.price, 0);
						const unitTotal = item.price + customizationsTotal;
						return (
							<motion.div
								key={`${item._id}-${item.spiceLevel}-${item.specialInstructions}`}
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="flex items-start gap-3 p-2 rounded-xl bg-muted/30">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-1">
										<Badge
											variant={item.veg === "veg" ? "default" : "destructive"}
											className={`w-2 h-2 p-0 rounded-full ${item.veg === "veg" ? "bg-green-600" : "bg-red-600"}`}
										/>
										<p className="text-sm font-medium text-foreground truncate">{item.name}</p>
									</div>
									<div className="flex flex-wrap gap-1 mt-0.5">
										{(() => {
											const level = SPICE_LEVELS.find((l) => l.value === item.spiceLevel);
											return level ? (
												<span className="text-[10px] text-muted-foreground">
													{level.emoji} {level.label}
												</span>
											) : null;
										})()}
									</div>
									{item.specialInstructions && (
										<p className="text-[10px] text-muted-foreground/70 italic mt-0.5">&ldquo;{item.specialInstructions}&rdquo;</p>
									)}
									{item.selectedCustomizations.length > 0 && (
										<p className="text-[10px] text-muted-foreground/70">+{item.selectedCustomizations.map((c) => c.name).join(", ")}</p>
									)}
									<p className="text-xs font-medium text-foreground mt-1">
										{formatCurrency(unitTotal, currency)} × {item.quantity} = {formatCurrency(unitTotal * item.quantity, currency)}
									</p>
								</div>
								<div className="flex items-center gap-1 shrink-0">
									<button
										onClick={() => updateQuantity(item._id, -1)}
										aria-label={`Decrease ${item.name} quantity`}
										className="w-7 h-7 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors">
										−
									</button>
									<span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
									<button
										onClick={() => updateQuantity(item._id, 1)}
										aria-label={`Increase ${item.name} quantity`}
										className="w-7 h-7 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors">
										+
									</button>
									<button
										onClick={() => removeFromCart(item._id)}
										aria-label={`Remove ${item.name} from cart`}
										className="w-7 h-7 rounded-lg text-muted-foreground/50 hover:text-destructive text-xs transition-colors">
										✕
									</button>
								</div>
							</motion.div>
						);
					})
				)}
			</div>

			{cart.length > 0 && (
				<>
					<div className="space-y-2">
						<div className="flex gap-2">
							<Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="text-sm" />
							<Button variant="outline" size="sm" onClick={applyCoupon} className="shrink-0">
								Apply
							</Button>
						</div>
					</div>

					<div className="space-y-1 text-sm">
						<div className="flex justify-between text-muted-foreground">
							<span>Subtotal</span>
							<span>{formatCurrency(cartTotal.subtotal, currency)}</span>
						</div>
						{cartTotal.discount > 0 && (
							<div className="flex justify-between text-green-600">
								<span>Discount</span>
								<span>-{formatCurrency(cartTotal.discount, currency)}</span>
							</div>
						)}
						<div className="flex justify-between text-muted-foreground">
							<span>GST</span>
							<span>{formatCurrency(cartTotal.tax, currency)}</span>
						</div>
						<div className="border-t pt-1 flex justify-between font-bold text-foreground">
							<span>Total</span>
							<span>{formatCurrency(cartTotal.total, currency)}</span>
						</div>
					</div>

					<div className="space-y-2">
						<p className="text-xs font-medium text-muted-foreground">Payment Method</p>
						<div className="flex gap-2">
							<button
								onClick={() => setPaymentMethod("razorpay")}
								aria-pressed={paymentMethod === "razorpay"}
								className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
									paymentMethod === "razorpay" ? "bg-primary/10 text-primary ring-1 ring-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"
								}`}>
								💳 Razorpay
							</button>
							<button
								onClick={() => setPaymentMethod("cash")}
								aria-pressed={paymentMethod === "cash"}
								className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
									paymentMethod === "cash" ? "bg-primary/10 text-primary ring-1 ring-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"
								}`}>
								💵 Cash
							</button>
						</div>
					</div>

					<Button className="w-full transition-transform active:scale-[0.98]" size="lg" onClick={placeOrder} disabled={isPlacingOrder}>
						{isPlacingOrder ? (
							<span className="flex items-center gap-2">
								<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								Processing...
							</span>
						) : paymentMethod === "cash" ? (
							`Place Order · ${formatCurrency(cartTotal.total, currency)}`
						) : (
							`Pay · ${formatCurrency(cartTotal.total, currency)}`
						)}
					</Button>
				</>
			)}
		</Card>
	);
});
