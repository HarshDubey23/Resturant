"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { CartSidebar } from "@/components/features/table/CartSidebar";
import { CategoryNav } from "@/components/features/table/CategoryNav";
import { MenuGrid } from "@/components/features/table/MenuGrid";
import type { CartItem, MenuItem, RestaurantData } from "@/components/features/table/types";
import { MobileNav } from "@/components/layout/MobileNav";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useRazorpay } from "@/hooks/useRazorpay";
import { formatCurrency } from "@/utils/helper/currency";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TableMenuPage() {
	const params = useParams<{ restaurant: string; tableId: string }>();
	const router = useRouter();
	const restaurant = params.restaurant;
	const tableId = params.tableId;
	const { initiatePayment } = useRazorpay();

	const [search, setSearch] = useState("");
	const [activeCategory, setActiveCategory] = useState("all");
	const [cart, setCart] = useState<CartItem[]>([]);
	const [cartOpen, setCartOpen] = useState(false);
	const [couponCode, setCouponCode] = useState("");
	const [couponDiscount, setCouponDiscount] = useState(0);
	const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cash">("razorpay");
	const [isPlacingOrder, setIsPlacingOrder] = useState(false);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const categoryScrollRef = useRef<HTMLDivElement>(null);

	const { data: restaurantData, error, isLoading } = useSWR<RestaurantData>(`/api/menu?id=${restaurant}`, fetcher);
	const currency = restaurantData?.profile?.currency || "INR";

	const filteredItems = useMemo(() => {
		if (!restaurantData?.menus) return [];
		let items = restaurantData.menus;

		if (activeCategory !== "all") {
			items = items.filter((item) => item.category?.toLowerCase() === activeCategory);
		}

		if (search) {
			const q = search.toLowerCase();
			items = items.filter((item) => item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q));
		}

		return items;
	}, [restaurantData, activeCategory, search]);

	const categories = useMemo(() => {
		if (!restaurantData?.menus) return [];
		const cats = new Set<string>(["all"]);
		restaurantData.menus.forEach((m) => {
			if (m.category) cats.add(m.category.toLowerCase());
		});
		return Array.from(cats);
	}, [restaurantData]);

	// Tax is computed per item from its own taxPercent — matching the
	// server-side calculation — instead of a flat 5% that drifted from the
	// amount actually charged.
	const cartTotal = useMemo(() => {
		const subtotal = cart.reduce((sum, item) => {
			const customizationsTotal = item.selectedCustomizations.reduce((s, c) => s + c.price, 0);
			return sum + (item.price + customizationsTotal) * item.quantity;
		}, 0);
		const tax = cart.reduce((sum, item) => {
			const customizationsTotal = item.selectedCustomizations.reduce((s, c) => s + c.price, 0);
			return sum + (((item.price + customizationsTotal) * (item.taxPercent || 0)) / 100) * item.quantity;
		}, 0);
		return { subtotal, tax, discount: couponDiscount, total: subtotal - couponDiscount + tax };
	}, [cart, couponDiscount]);

	const addToCart = useCallback((item: MenuItem, spiceLevel: string, specialInstructions: string) => {
		setCart((prev) => {
			const existing = prev.find((i) => i._id === item._id && i.spiceLevel === spiceLevel && i.specialInstructions === specialInstructions);
			if (existing) {
				return prev.map((i) => (i === existing ? { ...i, quantity: i.quantity + 1 } : i));
			}
			return [...prev, { ...item, quantity: 1, spiceLevel, specialInstructions, selectedCustomizations: [] }];
		});

		toast.success(`${item.name} added to cart`);
	}, []);

	const removeFromCart = useCallback((id: string) => {
		setCart((prev) => prev.filter((i) => i._id !== id));
	}, []);

	const updateQuantity = useCallback((id: string, delta: number) => {
		setCart((prev) => prev.map((i) => (i._id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)).filter((i) => i.quantity > 0));
	}, []);

	const applyCoupon = useCallback(async () => {
		if (!couponCode) return;
		try {
			const res = await fetch("/api/coupon/validate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code: couponCode, cartTotal: cartTotal.subtotal, restaurantID: restaurant }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Invalid coupon");
			setCouponDiscount(data.discount);
			toast.success(`Coupon applied! ${data.discountType === "percentage" ? `${data.discountValue}% off` : `${formatCurrency(data.discountValue, currency)} off`}`);
		} catch (err) {
			setCouponDiscount(0);
			toast.error(err instanceof Error ? err.message : "Invalid coupon code");
		}
	}, [couponCode, cartTotal.subtotal, restaurant, currency]);

	const placeOrder = async () => {
		if (cart.length === 0) return toast.error("Cart is empty");
		setIsPlacingOrder(true);

		try {
			const res = await fetch("/api/order/place", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					products: cart.map((item) => ({
						_id: item._id,
						quantity: item.quantity,
					})),
					paymentMethod,
					couponCode: couponCode || undefined,
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Failed to place order");

			if (paymentMethod === "cash") {
				toast.success("Order placed successfully!");
				setCart([]);
				setCartOpen(false);
				return;
			}

			const orderId = data.orderId;
			if (!orderId) throw new Error("No order ID returned");

			const result = await initiatePayment(orderId);

			if (result?.success) {
				setCart([]);
				setCartOpen(false);
				router.push(`/order/success?order_id=${orderId}&payment_id=${result.paymentId}`);
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to place order");
		} finally {
			setIsPlacingOrder(false);
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background p-4 sm:p-6">
				<div className="max-w-7xl mx-auto space-y-6">
					<Skeleton className="h-12 w-64" />
					<Skeleton className="h-10 w-full" />
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						{[...Array(8)].map((_, i) => (
							<Skeleton key={i} className="h-72 rounded-2xl" />
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error || !restaurantData) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="text-6xl mb-4">🍽️</div>
					<h2 className="text-2xl font-bold text-foreground">Restaurant not found</h2>
					<p className="text-muted-foreground mt-2">Please check your QR code and try again.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background pb-24 md:pb-0">
			<header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6">
					<div className="flex items-center justify-between h-16 gap-4">
						<div className="flex items-center gap-3 min-w-0">
							<div className="text-2xl shrink-0">🍽️</div>
							<div className="min-w-0">
								<h1 className="text-lg font-bold text-foreground truncate">{restaurantData.name || restaurantData.username}</h1>
								<p className="text-xs text-muted-foreground">
									Table {tableId} <span className="inline-block mx-1">•</span> Enjoy your meal! 😊
								</p>
							</div>
						</div>
						<div className="flex items-center gap-1 sm:gap-3">
							<button
								onClick={() => searchInputRef.current?.focus()}
								aria-label="Search menu"
								className="p-2 text-muted-foreground hover:text-foreground transition-colors lg:hidden">
								<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<title>Search</title>
									<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
							</button>
							<Link
								href={`/${restaurant}/table/${tableId}/track`}
								className="p-2 text-muted-foreground hover:text-foreground transition-colors sm:hover:bg-muted sm:rounded-lg"
								title="My Orders">
								<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<title>Orders</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
									/>
								</svg>
							</Link>
							<button
								onClick={() => setCartOpen(true)}
								aria-label={`Open cart, ${cart.length} items`}
								className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
								<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<title>Cart</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
									/>
								</svg>
								{cart.length > 0 && (
									<motion.span
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
										{cart.length}
									</motion.span>
								)}
							</button>
						</div>
					</div>
					<div className="pb-3 hidden lg:block">
						<Input ref={searchInputRef} placeholder="Search menu..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
					</div>
				</div>
			</header>

			<CategoryNav categories={categories} activeCategory={activeCategory} onSelect={setActiveCategory} scrollRef={categoryScrollRef} />

			{/* Search bar mobile */}
			<div className="lg:hidden px-4 sm:px-6 pt-3">
				<Input placeholder="Search menu..." value={search} onChange={(e) => setSearch(e.target.value)} />
			</div>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
				<MenuGrid items={filteredItems} onAddToCart={addToCart} currency={currency} />
			</main>

			{/* Desktop Cart Sidebar */}
			{cart.length > 0 && (
				<div className="hidden lg:block fixed right-4 top-24 w-80 z-20">
					<CartSidebar
						cart={cart}
						cartTotal={cartTotal}
						couponCode={couponCode}
						setCouponCode={setCouponCode}
						applyCoupon={applyCoupon}
						updateQuantity={updateQuantity}
						removeFromCart={removeFromCart}
						placeOrder={placeOrder}
						paymentMethod={paymentMethod}
						setPaymentMethod={setPaymentMethod}
						isPlacingOrder={isPlacingOrder}
						currency={currency}
					/>
				</div>
			)}

			{/* Mobile Cart Button */}
			{cart.length > 0 && (
				<motion.button
					initial={{ y: 100 }}
					animate={{ y: 0 }}
					className="lg:hidden fixed bottom-6 right-6 z-30 bg-primary text-primary-foreground rounded-full shadow-xl px-5 py-3 flex items-center gap-3 font-semibold"
					onClick={() => setCartOpen(true)}>
					<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<title>Cart</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
						/>
					</svg>
					<span>
						{cart.length} item{cart.length > 1 ? "s" : ""}
					</span>
					<span>•</span>
					<span>{formatCurrency(cartTotal.subtotal, currency)}</span>
				</motion.button>
			)}

			{/* Mobile Cart Sheet */}
			<Sheet open={cartOpen} onOpenChange={setCartOpen}>
				<SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
					<SheetHeader>
						<SheetTitle>Your Order</SheetTitle>
					</SheetHeader>
					<CartSidebar
						cart={cart}
						cartTotal={cartTotal}
						couponCode={couponCode}
						setCouponCode={setCouponCode}
						applyCoupon={applyCoupon}
						updateQuantity={updateQuantity}
						removeFromCart={removeFromCart}
						placeOrder={placeOrder}
						paymentMethod={paymentMethod}
						setPaymentMethod={setPaymentMethod}
						isPlacingOrder={isPlacingOrder}
						currency={currency}
					/>
				</SheetContent>
			</Sheet>

			<MobileNav restaurant={restaurant} tableId={tableId} onOpenCart={() => setCartOpen(true)} />
		</div>
	);
}
