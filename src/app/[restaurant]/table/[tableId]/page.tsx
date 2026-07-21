"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useRazorpay } from "@/hooks/useRazorpay";

const SPICE_LEVELS = [
	{ value: "mild", label: "Mild", emoji: "🟢" },
	{ value: "medium", label: "Medium", emoji: "🟡" },
	{ value: "hot", label: "Hot", emoji: "🟠" },
	{ value: "extra-hot", label: "Extra Hot", emoji: "🔴" },
] as const;

const CATEGORY_ICONS: Record<string, string> = {
	starters: "🥗",
	"main course": "🍛",
	biryani: "🍚",
	breads: "🫓",
	pizza: "🍕",
	chinese: "🥡",
	desserts: "🍰",
	beverages: "🥤",
};

interface MenuItem {
	_id: string;
	name: string;
	description: string;
	price: number;
	taxPercent: number;
	category: string;
	veg: "veg" | "non-veg" | "contains-egg";
	image: string;
	foodType: string;
	isAvailable?: boolean;
	isBestseller?: boolean;
}

interface CartItem extends MenuItem {
	quantity: number;
	spiceLevel: string;
	specialInstructions: string;
	selectedCustomizations: { name: string; price: number }[];
}

interface RestaurantData {
	name: string;
	username: string;
	profile: { categories: string[]; address?: string };
	menus: MenuItem[];
}

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

	const cartTotal = useMemo(() => {
		const subtotal = cart.reduce((sum, item) => {
			const customizationsTotal = item.selectedCustomizations.reduce((s, c) => s + c.price, 0);
			return sum + (item.price + customizationsTotal) * item.quantity;
		}, 0);
		const tax = (subtotal - couponDiscount) * 0.05;
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

	const applyCoupon = useCallback(() => {
		if (couponCode === "FIRST20") {
			setCouponDiscount(Math.min(cartTotal.subtotal * 0.2, 500));
			toast.success("Coupon applied! 20% off up to ₹500");
		} else if (couponCode === "FLAT100") {
			setCouponDiscount(100);
			toast.success("Coupon applied! ₹100 off");
		} else {
			toast.error("Invalid coupon code");
		}
	}, [couponCode, cartTotal.subtotal]);

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
		<div className="min-h-screen bg-background">
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
							<button onClick={() => setCartOpen(true)} className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
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

			{/* Category Tabs */}
			<div ref={categoryScrollRef} className="sticky top-16 lg:top-[88px] z-20 bg-background border-b border-border/50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6">
					<div className="py-3 overflow-x-auto scrollbar-none">
						<div className="flex gap-2">
							{categories.map((cat) => (
								<button
									key={cat}
									onClick={() => setActiveCategory(cat)}
									className={`relative shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
										activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
									}`}>
									{CATEGORY_ICONS[cat] && <span className="mr-1.5">{CATEGORY_ICONS[cat]}</span>}
									{cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Search bar mobile */}
			<div className="lg:hidden px-4 sm:px-6 pt-3">
				<Input placeholder="Search menu..." value={search} onChange={(e) => setSearch(e.target.value)} />
			</div>

			{/* Menu Grid */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
				{filteredItems.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-center">
						<div className="text-6xl mb-4">🔍</div>
						<h3 className="text-xl font-semibold text-foreground">No items found</h3>
						<p className="text-muted-foreground mt-2">Try a different search or category.</p>
					</div>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
						<AnimatePresence mode="popLayout">
							{filteredItems.map((item, index) => (
								<MenuItemCard key={item._id} item={item} index={index} onAddToCart={addToCart} />
							))}
						</AnimatePresence>
					</div>
				)}
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
					<span>₹{cartTotal.subtotal}</span>
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
					/>
				</SheetContent>
			</Sheet>
		</div>
	);
}

function MenuItemCard({ item, index, onAddToCart }: { item: MenuItem; index: number; onAddToCart: (item: MenuItem, spiceLevel: string, notes: string) => void }) {
	const [spiceLevel, setSpiceLevel] = useState("medium");
	const [notes, setNotes] = useState("");
	const [showDetails, setShowDetails] = useState(false);
	const [qty, setQty] = useState(0);

	const handleAdd = () => {
		onAddToCart(item, spiceLevel, notes);
		setQty((prev) => prev + 1);
	};

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={{ duration: 0.3, delay: index * 0.03 }}
			whileHover={{ y: -4 }}
			className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300">
			<div className="relative aspect-[4/3] overflow-hidden bg-muted">
				{item.image ? (
					<Image
						src={item.image}
						alt={item.name}
						fill
						className="object-cover group-hover:scale-105 transition-transform duration-500"
						sizes="(max-width:768px) 50vw, 25vw"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground/30">🍽️</div>
				)}
				<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
				<div className="absolute top-2 left-2 flex gap-1.5">
					<Badge
						variant={item.veg === "veg" ? "default" : "destructive"}
						className={`text-[10px] px-1.5 py-0.5 h-auto ${item.veg === "veg" ? "bg-green-600" : "bg-red-600"}`}>
						{item.veg === "veg" ? "🟢 Veg" : item.veg === "non-veg" ? "🔴 Non-Veg" : "🟡 Egg"}
					</Badge>
				</div>
				<div className="absolute bottom-2 left-2 right-2">
					<h3 className="text-white font-bold text-sm drop-shadow-md truncate">{item.name}</h3>
					<p className="text-white/80 text-xs font-bold drop-shadow-md">₹{item.price}</p>
				</div>
			</div>

			<div className="p-3 space-y-2">
				{showDetails && item.description && (
					<motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="text-xs text-muted-foreground leading-relaxed">
						{item.description}
					</motion.p>
				)}

				{/* Spice Level */}
				<div>
					<p className="text-[10px] font-medium text-muted-foreground mb-1">🌶️ Spice Level</p>
					<div className="flex gap-1">
						{SPICE_LEVELS.map((level) => (
							<button
								key={level.value}
								onClick={() => setSpiceLevel(level.value)}
								className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-all ${
									spiceLevel === level.value ? "bg-primary/10 text-primary ring-1 ring-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"
								}`}>
								{level.emoji} {level.label}
							</button>
						))}
					</div>
				</div>

				{/* Special Instructions */}
				<textarea
					placeholder="Special instructions... (e.g., extra spicy, no onions)"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					className="w-full text-xs border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 bg-muted/30"
					rows={1}
				/>

				{/* Add to Cart */}
				<div className="flex gap-2 pt-1">
					{qty > 0 ? (
						<div className="flex items-center gap-2 w-full">
							<button
								onClick={() => {
									setQty((prev) => prev - 1);
								}}
								className="flex-1 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 transition-colors">
								−
							</button>
							<span className="w-6 text-center text-sm font-bold">{qty}</span>
							<button
								onClick={handleAdd}
								className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
								+
							</button>
						</div>
					) : (
						<button
							onClick={handleAdd}
							className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
							Add · ₹{item.price}
						</button>
					)}
				</div>

				<button onClick={() => setShowDetails((v) => !v)} className="w-full text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
					{showDetails ? "▲ Less" : "▼ More"}
				</button>
			</div>
		</motion.div>
	);
}

function CartSidebar({
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
}: {
	cart: CartItem[];
	cartTotal: { subtotal: number; tax: number; discount: number; total: number };
	couponCode: string;
	setCouponCode: (code: string) => void;
	applyCoupon: () => void;
	updateQuantity: (id: string, delta: number) => void;
	removeFromCart: (id: string) => void;
	placeOrder: () => void;
	paymentMethod: "razorpay" | "cash";
	setPaymentMethod: (method: "razorpay" | "cash") => void;
	isPlacingOrder: boolean;
}) {
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
										₹{unitTotal} × {item.quantity} = ₹{unitTotal * item.quantity}
									</p>
								</div>
								<div className="flex items-center gap-1 shrink-0">
									<button
										onClick={() => updateQuantity(item._id, -1)}
										className="w-7 h-7 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors">
										−
									</button>
									<span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
									<button
										onClick={() => updateQuantity(item._id, 1)}
										className="w-7 h-7 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors">
										+
									</button>
									<button
										onClick={() => removeFromCart(item._id)}
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
							<span>₹{cartTotal.subtotal}</span>
						</div>
						{cartTotal.discount > 0 && (
							<div className="flex justify-between text-green-600">
								<span>Discount</span>
								<span>-₹{cartTotal.discount}</span>
							</div>
						)}
						<div className="flex justify-between text-muted-foreground">
							<span>GST (5%)</span>
							<span>₹{cartTotal.tax}</span>
						</div>
						<div className="border-t pt-1 flex justify-between font-bold text-foreground">
							<span>Total</span>
							<span>₹{cartTotal.total}</span>
						</div>
					</div>

					<div className="space-y-2">
						<p className="text-xs font-medium text-muted-foreground">Payment Method</p>
						<div className="flex gap-2">
							<button
								onClick={() => setPaymentMethod("razorpay")}
								className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
									paymentMethod === "razorpay" ? "bg-primary/10 text-primary ring-1 ring-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"
								}`}>
								💳 Razorpay
							</button>
							<button
								onClick={() => setPaymentMethod("cash")}
								className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
									paymentMethod === "cash" ? "bg-primary/10 text-primary ring-1 ring-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"
								}`}>
								💵 Cash
							</button>
						</div>
					</div>

					<Button className="w-full" size="lg" onClick={placeOrder} disabled={isPlacingOrder}>
						{isPlacingOrder ? (
							<span className="flex items-center gap-2">
								<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								Processing...
							</span>
						) : paymentMethod === "cash" ? (
							`Place Order · ₹${cartTotal.total}`
						) : (
							`Pay · ₹${cartTotal.total}`
						)}
					</Button>
				</>
			)}
		</Card>
	);
}
