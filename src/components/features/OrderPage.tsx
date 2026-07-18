"use client";

import { ChefHat, ChevronLeft, ChevronRight, LayoutDashboard, Scan, Search, ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { signOut, useSession } from "next-auth/react";
import { type UIEvent, useEffect, useMemo, useRef, useState } from "react";
import { useOrder, useRestaurant } from "#components/context/useContext";
import { useQueryParams } from "#utils/hooks/useQueryParams";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
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

	const hasImageItems = filteredProducts?.some((p) => !!p.image) ?? false;
	const hasNonImageItems = filteredProducts?.some((p) => !p.image) ?? false;

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
		<div className="flex h-full">
			<div className="flex-1 overflow-auto" onScroll={onMenuScroll}>
				<div className={`sticky top-0 z-10 bg-background transition-shadow ${floatHeader ? "shadow-sm" : ""}`}>
					<div className="flex items-center justify-between px-4 py-3">
						<div>
							<h1 className="text-lg font-semibold tracking-tight">
								{eligibleToOrder ? "Choose" : "Explore"} <span className="text-primary">Order</span>
							</h1>
						</div>
						<div className="flex items-center gap-2">
							<Button variant="ghost" size="icon" onClick={() => setSearchActive(!searchActive)} aria-label="Search menu">
								<Search className="h-4 w-4" />
							</Button>

							{eligibleToOrder && cartCount > 0 && (
								<Button variant="outline" size="sm" onClick={() => setSideSheetOpen(true)} className="relative">
									<ShoppingCart className="h-4 w-4 mr-1" />
									Cart
									<Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
										{cartCount}
									</Badge>
								</Button>
							)}

							{(!session.data?.role || !showOrderButton) && (
								<Button size="sm" onClick={onLoginClick}>
									<Scan className="h-4 w-4 mr-1" />
									{showOrderButton ? "Order" : "Scan"}
								</Button>
							)}

							{session.data?.role === "admin" && (
								<Button variant="outline" size="sm" onClick={() => params.router.push("/dashboard")}>
									<LayoutDashboard className="h-4 w-4 mr-1" />
									Dashboard
								</Button>
							)}

							{session.data?.role === "kitchen" && (
								<Button variant="outline" size="sm" onClick={() => params.router.push("/kitchen")}>
									<ChefHat className="h-4 w-4 mr-1" />
									Kitchen
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
								<Input placeholder="Search menu..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} autoFocus />
							</motion.div>
						)}
					</AnimatePresence>

					{restaurant?.profile?.categories && (
						<div className="relative px-4 pb-3">
							<div ref={categoriesRef} onScroll={onCategoryScroll} className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth">
								{restaurant.profile.categories.map((cat) => (
									<button
										key={cat}
										onClick={() => onCategoryClick(cat)}
										className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
											category.includes(cat) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
										}`}>
										{cat}
									</button>
								))}
							</div>
							{leftCategoryScroll && (
								<button
									onClick={() => scrollCategory("left")}
									className="absolute left-4 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-sm border"
									aria-label="Scroll left">
									<ChevronLeft className="h-3 w-3" />
								</button>
							)}
							{rightCategoryScroll && (
								<button
									onClick={() => scrollCategory("right")}
									className="absolute right-4 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-sm border"
									aria-label="Scroll right">
									<ChevronRight className="h-3 w-3" />
								</button>
							)}
						</div>
					)}
				</div>

				<div className="px-4 pb-24">
					{!restaurant ? (
						<div className="space-y-3 pt-4">
							{Array.from({ length: 6 }).map((_, i) => (
								<Skeleton key={i} className="h-28 w-full rounded-xl" />
							))}
						</div>
					) : (
						<>
							{hasImageItems && (
								<div className="space-y-3 pt-2">
									{filteredProducts
										.filter((item) => item.image)
										.map((item) => (
											<MenuCard
												key={String(item._id)}
												item={item}
												restrictOrder={!eligibleToOrder}
												increaseQuantity={increaseProductQuantity}
												decreaseQuantity={decreaseProductQuantity}
												showInfo={showInfoCard === item._id.toString()}
												setShowInfo={(v) => setShowInfoCard(v ? item._id.toString() : false)}
												quantity={selectedProducts.find((p) => String(p._id) === String(item._id))?.quantity ?? 0}
											/>
										))}
								</div>
							)}

							{hasImageItems && hasNonImageItems && <hr className="my-6 border-t" />}

							{hasNonImageItems && (
								<div className="space-y-3 pt-2">
									{filteredProducts
										.filter((item) => !item.image)
										.map((item) => (
											<MenuCard
												key={String(item._id)}
												item={item}
												restrictOrder={!eligibleToOrder}
												increaseQuantity={increaseProductQuantity}
												decreaseQuantity={decreaseProductQuantity}
												showInfo={showInfoCard === item._id.toString()}
												setShowInfo={(v) => setShowInfoCard(v ? item._id.toString() : false)}
												quantity={selectedProducts.find((p) => String(p._id) === String(item._id))?.quantity ?? 0}
											/>
										))}
								</div>
							)}

							{filteredProducts.length === 0 && (
								<div className="flex flex-col items-center justify-center py-20 text-center">
									<Search className="h-8 w-8 text-muted-foreground mb-3" />
									<p className="text-sm text-muted-foreground">No items found</p>
								</div>
							)}
						</>
					)}
				</div>
			</div>

			<Sheet open={sideSheetOpen} onOpenChange={setSideSheetOpen}>
				<SheetContent side="right" className="w-full sm:max-w-md p-0">
					<SheetHeader className="px-4 py-3 border-b">
						<SheetTitle>
							Your <span className="text-primary">Order</span>
						</SheetTitle>
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
