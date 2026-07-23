"use client";

import { ChefHat, ChevronLeft, ChevronRight, LayoutDashboard, Scan, Search, ShoppingCart, Sparkles, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { type UIEvent, useEffect, useMemo, useRef, useState } from "react";
import { VoiceButtonPro } from "#components/chatbot/VoiceButtonPro";
import { useOrder, useRestaurant } from "#components/context/useContext";
import { formatCurrency } from "#utils/helper/currency";
import { useQueryParams } from "#utils/hooks/useQueryParams";
import { SITE_NAME } from "#utils/seo/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import CartPage from "./CartPage";
import type { TMenuCustom } from "./MenuCard";
import MenuCard from "./MenuCard";
import UserLogin from "./UserLogin";

export default function OrderPage() {
	const session = useSession();
	const { loginOpen, setLoginOpen } = useOrder();
	const { restaurant } = useRestaurant();

	const menus = restaurant?.menus as Array<TMenuCustom> | undefined;
	const params = useQueryParams();
	const table = params.get("table");
	const searchParam = params.get("search")?.trim() ?? "";
	const categoryParam = params.get("category")?.trim();
	const category = useMemo(() => (categoryParam ? categoryParam.split(",") : []), [categoryParam]);

	const categoriesRef = useRef<HTMLDivElement>(null);
	const [sideSheetOpen, setSideSheetOpen] = useState(false);
	const [searchActive, setSearchActive] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [floatHeader, setFloatHeader] = useState(false);
	const [leftCategoryScroll, setLeftCategoryScroll] = useState(false);
	const [rightCategoryScroll, setRightCategoryScroll] = useState(true);
	const [showInfoCard, setShowInfoCard] = useState<false | string>(false);
	const [selectedProducts, setSelectedProducts] = useState<Array<TMenuCustom>>([]);

	const showOrderButton = restaurant?.tables?.some(({ username }) => username === table);
	const eligibleToOrder = session.data?.role === "customer" && showOrderButton;

	const filteredProducts = useMemo(() => {
		if (!menus) return [];
		const search = searchParam.toLowerCase();
		return menus.filter(
			({ name, description, category: cat, hidden }) =>
				!hidden &&
				(search ? name?.toLowerCase().includes(search) || description?.toLowerCase().includes(search) || cat?.toLowerCase().includes(search) : true) &&
				(category.length ? category.includes(cat) : true),
		);
	}, [category, menus, searchParam]);

	// Group items by category for premium sectioned layout
	const groupedByCategory = useMemo(() => {
		if (!filteredProducts.length) return [];
		const groups = new Map<string, TMenuCustom[]>();
		for (const item of filteredProducts) {
			const cat = item.category || "other";
			if (!groups.has(cat)) groups.set(cat, []);
			groups.get(cat)?.push(item);
		}
		// Sort items within each group: chef specials first, then by rating
		return Array.from(groups.entries()).map(([cat, items]) => ({
			category: cat,
			items: items.sort((a, b) => {
				const aSpecial = a.tags?.includes?.("chef-special") || a.tags?.includes?.("signature") ? 1 : 0;
				const bSpecial = b.tags?.includes?.("chef-special") || b.tags?.includes?.("signature") ? 1 : 0;
				if (aSpecial !== bSpecial) return bSpecial - aSpecial;
				return (b.rating ?? 0) - (a.rating ?? 0);
			}),
		}));
	}, [filteredProducts]);

	const featuredItem = useMemo(() => {
		if (!menus) return null;
		const withImages = menus.filter((m) => m.image && !m.hidden);
		if (!withImages.length) return null;
		// Pick highest rated or first chef special
		const special = withImages.find((m) => m.tags?.includes?.("chef-special") || m.tags?.includes?.("signature"));
		if (special) return special;
		return withImages.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
	}, [menus]);

	const onMenuScroll = (event: UIEvent<HTMLDivElement>) => {
		const scrollTop = (event.target as HTMLDivElement).scrollTop;
		setFloatHeader(scrollTop > 30);
	};

	const onCategoryScroll = () => {
		const el = categoriesRef.current;
		if (!el) return;
		setLeftCategoryScroll(el.scrollLeft > 50);
		setRightCategoryScroll(Math.round(el.scrollWidth - el.scrollLeft) - 50 > el.clientWidth);
	};

	const scrollCategory = (dir: "left" | "right") => {
		if (categoriesRef.current) {
			categoriesRef.current.scrollLeft += dir === "left" ? -400 : 400;
		}
	};

	const onCategoryClick = (categoryName: string) => {
		const newCategory = category.includes(categoryName) ? category.filter((item) => item !== categoryName) : [...category, categoryName];
		params.set({ category: newCategory.join(",") });
	};

	const onLoginClick = () => {
		if (table) return setLoginOpen(true);
		return params.router.push("/scan");
	};

	const increaseProductQuantity = (product: TMenuCustom) => {
		setSelectedProducts((prev) => {
			const existing = prev.find((item) => String(item._id) === String(product._id));
			if (existing) {
				return prev.map((item) => (String(item._id) === String(product._id) ? ({ ...item, quantity: item.quantity + 1 } as TMenuCustom) : item));
			}
			const plain = JSON.parse(JSON.stringify(product));
			return [...prev, { ...plain, quantity: 1 } as TMenuCustom];
		});
	};

	const decreaseProductQuantity = (product: TMenuCustom) => {
		setSelectedProducts((prev) => {
			const existing = prev.find((item) => String(item._id) === String(product._id));
			if (existing && existing.quantity <= 1) {
				return prev.filter((item) => String(item._id) !== String(product._id));
			}
			return prev.map((item) => (String(item._id) === String(product._id) ? ({ ...item, quantity: item.quantity - 1 } as TMenuCustom) : item));
		});
	};

	const resetSelectedProducts = () => setSelectedProducts([]);
	const cartCount = selectedProducts.reduce((sum, p) => sum + p.quantity, 0);
	const cartTotal = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);

	useEffect(() => {
		const validCategories = category.filter((c) => restaurant?.profile?.categories?.includes(c));
		if (validCategories.length !== category.length) {
			params.set({ category: validCategories.join(",") });
		}
	}, [category, restaurant, params.set]);

	useEffect(() => {
		params.set({ search: searchValue });
	}, [searchValue, params.set]);

	useEffect(() => {
		if (session.data?.role === "customer") return;
		if (session.status === "authenticated" && session.data?.restaurant?.username !== restaurant?.username) {
			signOut();
		}
	}, [restaurant?.username, session.data?.restaurant?.username, session.status, session.data?.role]);

	return (
		<div className="flex h-full bg-gradient-to-b from-background via-background to-muted/20">
			<div className="flex-1 overflow-auto" onScroll={onMenuScroll}>
				{/* ─── Premium Hero Banner ─── */}
				{!searchParam && category.length === 0 && featuredItem && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="relative h-64 sm:h-80 overflow-hidden">
						<Image src={featuredItem.image || ""} alt={featuredItem.name} fill priority className="object-cover" sizes="100vw" />
						<div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
						<div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

						<div className="relative h-full flex flex-col justify-end p-6 sm:p-10">
							<motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="max-w-2xl">
								<div className="flex items-center gap-2 mb-3">
									<Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1">
										<Sparkles className="h-3 w-3" />
										Featured
									</Badge>
									{(featuredItem.rating ?? 0) > 0 && (
										<div className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 backdrop-blur-sm">
											<Star className="h-3 w-3 fill-amber-400 text-amber-400" />
											<span className="text-xs font-bold text-white tabular-nums">{featuredItem.rating?.toFixed(1)}</span>
										</div>
									)}
								</div>
								<h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground mb-2 drop-shadow-sm">{featuredItem.name}</h2>
								{featuredItem.description && (
									<p className="text-sm sm:text-base text-muted-foreground line-clamp-2 max-w-xl mb-3">{featuredItem.description}</p>
								)}
								<div className="flex items-center gap-3">
									<span className="text-2xl font-bold text-primary">
										{typeof featuredItem.price === "number" ? formatCurrency(featuredItem.price) : ""}
									</span>
									{eligibleToOrder && (
										<Button
											size="sm"
											onClick={() => increaseProductQuantity(featuredItem)}
											className="rounded-full bg-gradient-to-r from-violet-600 to-violet-500 shadow-soft hover:shadow-soft-hover hover:scale-105 transition-all duration-200 ease-out">
											Order Now
										</Button>
									)}
								</div>
							</motion.div>
						</div>
					</motion.div>
				)}

				{/* ─── Sticky Header ─── */}
				<div
					className={cn(
						"sticky top-0 z-20 transition-all duration-300",
						floatHeader ? "bg-white/95 backdrop-blur-xl shadow-soft border-b border-slate-100" : "bg-transparent",
					)}>
					<div className="flex items-center justify-between px-4 py-3 gap-2">
						<div className="min-w-0 flex-1">
							{restaurant?.profile ? (
								<div className="flex items-center gap-2 min-w-0">
									{restaurant.profile.logoUrl || restaurant.profile.avatar ? (
										<Image
											src={restaurant.profile.logoUrl || (restaurant.profile.avatar as string)}
											alt={restaurant.profile.name}
											width={36}
											height={36}
											className="rounded-full ring-2 ring-violet-600/20 object-cover"
										/>
									) : (
										<div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-500 text-white font-bold ring-2 ring-violet-600/20">
											{restaurant.profile.name?.[0] || "R"}
										</div>
									)}
									<div className="min-w-0">
										<h1 className="text-base font-bold tracking-tight truncate">{restaurant.profile.name}</h1>
										{table && (
											<p className="text-[11px] text-muted-foreground flex items-center gap-1">
												<span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
												Table {table}
											</p>
										)}
									</div>
								</div>
							) : (
								<h1 className="text-lg font-bold tracking-tight">Menu</h1>
							)}
						</div>

						<div className="flex items-center gap-1.5 shrink-0">
							<Button
								variant={floatHeader ? "ghost" : "secondary"}
								size="icon"
								onClick={() => setSearchActive(!searchActive)}
								aria-label="Search menu"
								className="h-9 w-9 backdrop-blur-sm">
								<Search className="h-4 w-4" />
							</Button>

							<VoiceButtonPro
								onTranscript={(text) => {
									setSearchValue(text);
									setSearchActive(true);
								}}
								variant="icon"
								lang="en-US"
							/>

							{eligibleToOrder && cartCount > 0 && (
								<motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
									<Button variant="default" size="sm" onClick={() => setSideSheetOpen(true)} className="relative gap-1.5 rounded-full shadow-md">
										<ShoppingCart className="h-4 w-4" />
										<span className="font-bold tabular-nums">{cartCount}</span>
										<span className="hidden sm:inline text-xs opacity-80">· {formatCurrency(cartTotal)}</span>
									</Button>
								</motion.div>
							)}

							{(!session.data?.role || !showOrderButton) && (
								<Button size="sm" onClick={onLoginClick} className="gap-1.5 rounded-full shadow-md">
									<Scan className="h-4 w-4" />
									<span className="hidden sm:inline">{showOrderButton ? "Order" : "Sign in"}</span>
								</Button>
							)}

							{session.data?.role === "admin" && (
								<Button variant="secondary" size="sm" onClick={() => params.router.push("/dashboard")} className="gap-1.5 rounded-full">
									<LayoutDashboard className="h-4 w-4" />
									<span className="hidden sm:inline">Dashboard</span>
								</Button>
							)}

							{session.data?.role === "kitchen" && (
								<Button variant="secondary" size="sm" onClick={() => params.router.push("/kitchen")} className="gap-1.5 rounded-full">
									<ChefHat className="h-4 w-4" />
									<span className="hidden sm:inline">Kitchen</span>
								</Button>
							)}
						</div>
					</div>

					<AnimatePresence>
						{searchActive && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								className="px-4 pb-3">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Search dishes, cuisines, ingredients…"
										value={searchValue}
										onChange={(e) => setSearchValue(e.target.value)}
										autoFocus
										className="pl-9 pr-9 rounded-full bg-background/80 backdrop-blur"
									/>
									{searchValue && (
										<button
											type="button"
											onClick={() => setSearchValue("")}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
											Clear
										</button>
									)}
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					{restaurant?.profile?.categories && restaurant.profile.categories.length > 0 && (
						<div className="relative px-4 pb-3">
							<div ref={categoriesRef} onScroll={onCategoryScroll} className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth pb-1">
								<button
									type="button"
									onClick={() => params.set({ category: "" })}
									className={cn(
										"shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
										category.length === 0
											? "bg-violet-600 text-white shadow-soft"
											: "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700",
									)}>
									All
								</button>
								{restaurant.profile.categories.map((cat) => (
									<button
										type="button"
										key={cat}
										onClick={() => onCategoryClick(cat)}
										className={cn(
											"shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-all duration-200",
											category.includes(cat)
												? "bg-violet-600 text-white shadow-soft"
												: "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700",
										)}>
										{cat.replace(/-/g, " ")}
									</button>
								))}
							</div>
							{leftCategoryScroll && (
								<button
									type="button"
									onClick={() => scrollCategory("left")}
									className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-soft border border-slate-100"
									aria-label="Scroll left">
									<ChevronLeft className="h-3.5 w-3.5" />
								</button>
							)}
							{rightCategoryScroll && (
								<button
									type="button"
									onClick={() => scrollCategory("right")}
									className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-soft border border-slate-100"
									aria-label="Scroll right">
									<ChevronRight className="h-3.5 w-3.5" />
								</button>
							)}
						</div>
					)}
				</div>

				{/* ─── Main Content ─── */}
				<div className="px-4 pb-32 pt-2">
					{!restaurant ? (
						<div className="space-y-3 pt-4">
							{Array.from({ length: 6 }).map((_, i) => (
								<Skeleton key={i} className="h-44 w-full rounded-2xl" />
							))}
						</div>
					) : groupedByCategory.length === 0 ? (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className="flex flex-col items-center justify-center py-24 text-center">
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/60 mb-4">
								<Search className="h-7 w-7 text-muted-foreground" />
							</div>
							<h3 className="text-base font-semibold mb-1">No dishes found</h3>
							<p className="text-sm text-muted-foreground">Try a different search or category filter</p>
						</motion.div>
					) : (
						<div className="space-y-8 pt-4">
							{groupedByCategory.map((group, gi) => (
								<motion.section
									key={group.category}
									initial={{ opacity: 0, y: 16 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: gi * 0.05, duration: 0.4 }}>
									<div className="flex items-center gap-3 mb-4">
										<h2 className="text-xl font-bold capitalize tracking-tight">{group.category.replace(/-/g, " ")}</h2>
										<span className="text-xs text-muted-foreground font-medium">
											{group.items.length} {group.items.length === 1 ? "dish" : "dishes"}
										</span>
										<div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
									</div>
									<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
										{group.items.map((item, i) => (
											<motion.div
												key={String(item._id)}
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.3 }}>
												<MenuCard
													item={item}
													restrictOrder={!eligibleToOrder}
													increaseQuantity={increaseProductQuantity}
													decreaseQuantity={decreaseProductQuantity}
													showInfo={showInfoCard === item._id.toString()}
													setShowInfo={(v) => setShowInfoCard(v ? item._id.toString() : false)}
													quantity={selectedProducts.find((p) => String(p._id) === String(item._id))?.quantity ?? 0}
												/>
											</motion.div>
										))}
									</div>
								</motion.section>
							))}

							{/* Footer with branding */}
							<div className="pt-8 pb-4 text-center">
								<div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
									<div className="h-px w-8 bg-border" />
									<span>Powered by {SITE_NAME}</span>
									<div className="h-px w-8 bg-border" />
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Floating cart bar for mobile */}
			{eligibleToOrder && cartCount > 0 && !sideSheetOpen && (
				<motion.div
					initial={{ y: 100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 100, opacity: 0 }}
					className="fixed bottom-4 left-4 right-4 z-30 lg:hidden">
					<button
						type="button"
						onClick={() => setSideSheetOpen(true)}
						className="flex w-full items-center justify-between gap-3 rounded-2xl bg-violet-600 px-5 py-3 text-white shadow-soft hover:shadow-soft-hover transition-all duration-200 ease-out">
						<div className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 font-bold tabular-nums">{cartCount}</div>
							<span className="font-semibold">View cart</span>
						</div>
						<span className="font-bold tabular-nums">{formatCurrency(cartTotal)}</span>
					</button>
				</motion.div>
			)}

			<Sheet open={sideSheetOpen} onOpenChange={setSideSheetOpen}>
				<SheetContent side="right" className="w-full sm:max-w-md p-0">
					<SheetHeader className="px-4 py-3 border-b bg-card/50">
						<SheetTitle>Your Order</SheetTitle>
					</SheetHeader>
					<CartPage
						selectedProducts={selectedProducts}
						increaseProductQuantity={increaseProductQuantity}
						decreaseProductQuantity={decreaseProductQuantity}
						resetSelectedProducts={resetSelectedProducts}
					/>
				</SheetContent>
			</Sheet>

			<Dialog open={loginOpen} onOpenChange={setLoginOpen}>
				<DialogContent className="sm:max-w-sm">
					<UserLogin setOpen={setLoginOpen} />
				</DialogContent>
			</Dialog>
		</div>
	);
}
