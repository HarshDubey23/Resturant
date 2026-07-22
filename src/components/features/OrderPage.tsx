"use client";

import { ChefHat, ChevronLeft, ChevronRight, Flame, LayoutDashboard, Leaf, Scan, Search, ShoppingCart, Sparkles, Star, UtensilsCrossed, X } from "lucide-react";
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

const categoryIcons: Record<string, React.ReactNode> = {
        starters: <Sparkles className="h-3.5 w-3.5" />,
        Mains: <UtensilsCrossed className="h-3.5 w-3.5" />,
        breads: <ChefHat className="h-3.5 w-3.5" />,
        beverages: <Sparkles className="h-3.5 w-3.5" />,
        desserts: <Star className="h-3.5 w-3.5" />,
};

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

        // Group products by category for premium sectioned display
        const groupedProducts = useMemo(() => {
                const groups: Record<string, TMenuCustom[]> = {};
                for (const p of filteredProducts) {
                        const cat = p.category || "Other";
                        if (!groups[cat]) groups[cat] = [];
                        groups[cat].push(p);
                }
                // Order categories by profile order, then alphabetical
                const order = restaurant?.profile?.categories ?? [];
                return Object.entries(groups).sort(([a], [b]) => {
                        const ai = order.indexOf(a);
                        const bi = order.indexOf(b);
                        if (ai !== -1 && bi !== -1) return ai - bi;
                        if (ai !== -1) return -1;
                        if (bi !== -1) return 1;
                        return a.localeCompare(b);
                });
        }, [filteredProducts, restaurant?.profile?.categories]);

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
        const cartTotal = selectedProducts.reduce((sum, p) => sum + p.quantity * (p.price || 0), 0);

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
                        <div className="flex-1 overflow-auto bg-gradient-to-b from-orange-50/40 via-background to-background" onScroll={onMenuScroll}>
                                {/* HERO BANNER */}
                                <div className="relative overflow-hidden">
                                        {/* Layered gradient background */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-rose-600" />
                                        {/* Decorative dot pattern */}
                                        <div
                                                className="absolute inset-0 opacity-20"
                                                style={{
                                                        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                                                        backgroundSize: "20px 20px",
                                                }}
                                        />
                                        {/* Decorative leaf swooshes (top-right) */}
                                        <svg className="absolute -top-8 -right-8 w-64 h-64 text-white/10" viewBox="0 0 200 200" fill="currentColor">
                                                <path d="M100 20 Q150 50 180 100 Q150 150 100 180 Q50 150 20 100 Q50 50 100 20 Z" />
                                                <path d="M100 40 Q140 70 160 100 Q140 130 100 160 Q60 130 40 100 Q60 70 100 40 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                                        </svg>

                                        <div className="relative px-6 pt-8 pb-10 sm:pt-12 sm:pb-16">
                                                <div className="flex flex-col items-center text-center text-white">
                                                        <motion.div
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1 text-[11px] font-medium mb-4">
                                                                <Leaf className="h-3 w-3" />
                                                                Farm-to-table Indian cuisine
                                                        </motion.div>

                                                        <motion.h1
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.05 }}
                                                                className="text-4xl sm:text-5xl font-bold tracking-tight mb-2"
                                                                style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}>
                                                                {restaurant?.profile?.name ?? "Our Menu"}
                                                        </motion.h1>

                                                        <motion.p
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.1 }}
                                                                className="text-sm sm:text-base text-white/85 max-w-xl mb-4">
                                                                {restaurant?.profile?.description ?? "Handcrafted with love — explore our chef's signature dishes"}
                                                        </motion.p>

                                                        {/* Breadcrumb */}
                                                        <div className="flex items-center gap-1.5 text-[11px] text-white/70">
                                                                <span>OrderWorder</span>
                                                                <ChevronRight className="h-3 w-3" />
                                                                <span className="text-white font-medium">Menu</span>
                                                        </div>
                                                </div>
                                        </div>

                                        {/* Decorative wave bottom */}
                                        <svg className="absolute bottom-0 left-0 right-0 w-full h-6 text-background" viewBox="0 0 1440 24" preserveAspectRatio="none" fill="currentColor">
                                                <path d="M0,24 C360,0 1080,0 1440,24 L1440,24 L0,24 Z" />
                                        </svg>
                                </div>

                                {/* STICKY HEADER */}
                                <div
                                        className={`sticky top-0 z-20 transition-all duration-300 ${
                                                floatHeader ? "bg-background/95 backdrop-blur-md shadow-lg shadow-orange-500/5 border-b border-orange-500/10" : "bg-transparent"
                                        }`}>
                                        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                        <h2 className="text-lg font-bold tracking-tight">
                                                                <span className="text-gradient">Explore</span> Menu
                                                        </h2>
                                                        {filteredProducts.length > 0 && (
                                                                <Badge variant="secondary" className="rounded-full text-[10px] font-semibold">
                                                                        {filteredProducts.length} items
                                                                </Badge>
                                                        )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                        <Button
                                                                variant={searchActive ? "default" : "ghost"}
                                                                size="icon"
                                                                onClick={() => setSearchActive(!searchActive)}
                                                                aria-label="Search menu"
                                                                className="rounded-full">
                                                                <Search className="h-4 w-4" />
                                                        </Button>

                                                        {eligibleToOrder && cartCount > 0 && (
                                                                <Button variant="outline" size="sm" onClick={() => setSideSheetOpen(true)} className="relative rounded-full border-orange-500/30 hover:bg-orange-50 hover:border-orange-500/60">
                                                                        <ShoppingCart className="h-4 w-4 mr-1.5" />
                                                                        <span className="font-semibold tabular-nums">{cartCount}</span>
                                                                        <span className="ml-1.5 text-[10px] text-muted-foreground hidden sm:inline">· {cartTotal > 0 ? `₹${cartTotal}` : ""}</span>
                                                                </Button>
                                                        )}

                                                        {(!session.data?.role || !showOrderButton) && (
                                                                <Button size="sm" onClick={onLoginClick} className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md shadow-orange-500/20">
                                                                        <Scan className="h-4 w-4 mr-1.5" />
                                                                        {showOrderButton ? "Order" : "Scan QR"}
                                                                </Button>
                                                        )}

                                                        {session.data?.role === "admin" && (
                                                                <Button variant="outline" size="sm" onClick={() => params.router.push("/dashboard")} className="rounded-full">
                                                                        <LayoutDashboard className="h-4 w-4 mr-1.5" />
                                                                        Dashboard
                                                                </Button>
                                                        )}

                                                        {session.data?.role === "kitchen" && (
                                                                <Button variant="outline" size="sm" onClick={() => params.router.push("/kitchen")} className="rounded-full">
                                                                        <ChefHat className="h-4 w-4 mr-1.5" />
                                                                        Kitchen
                                                                </Button>
                                                        )}
                                                </div>
                                        </div>

                                        <AnimatePresence>
                                                {searchActive && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 sm:px-6 pb-3">
                                                                <div className="relative">
                                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                        <Input
                                                                                placeholder="Search dishes, ingredients..."
                                                                                value={searchValue}
                                                                                onChange={(e) => setSearchValue(e.target.value)}
                                                                                autoFocus
                                                                                className="pl-10 pr-10 rounded-full border-orange-500/20 focus-visible:border-orange-500/50 bg-orange-50/30"
                                                                        />
                                                                        {searchValue && (
                                                                                <button
                                                                                        onClick={() => setSearchValue("")}
                                                                                        className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/30 transition-colors">
                                                                                        <X className="h-3 w-3" />
                                                                                </button>
                                                                        )}
                                                                </div>
                                                        </motion.div>
                                                )}
                                        </AnimatePresence>

                                        {restaurant?.profile?.categories && (
                                                <div className="relative px-4 sm:px-6 pb-4">
                                                        <div ref={categoriesRef} onScroll={onCategoryScroll} className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth pb-1">
                                                                <button
                                                                        onClick={() => onCategoryClick("")}
                                                                        className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 inline-flex items-center gap-1.5 ${
                                                                                category.length === 0 ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30" : "bg-white text-foreground hover:bg-orange-50 border border-orange-500/15 shadow-sm"
                                                                        }`}>
                                                                        <UtensilsCrossed className="h-3.5 w-3.5" />
                                                                        All
                                                                </button>
                                                                {restaurant.profile.categories.map((cat) => (
                                                                        <button
                                                                                key={cat}
                                                                                onClick={() => onCategoryClick(cat)}
                                                                                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold capitalize transition-all duration-200 inline-flex items-center gap-1.5 ${
                                                                                        category.includes(cat)
                                                                                                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30"
                                                                                                : "bg-white text-foreground hover:bg-orange-50 border border-orange-500/15 shadow-sm"
                                                                                }`}>
                                                                                {categoryIcons[cat] ?? <Sparkles className="h-3.5 w-3.5" />}
                                                                                {cat}
                                                                        </button>
                                                                ))}
                                                        </div>
                                                        {leftCategoryScroll && (
                                                                <button
                                                                        onClick={() => scrollCategory("left")}
                                                                        className="absolute left-4 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md border border-orange-500/10 hover:bg-orange-50 transition-colors"
                                                                        aria-label="Scroll left">
                                                                        <ChevronLeft className="h-3.5 w-3.5" />
                                                                </button>
                                                        )}
                                                        {rightCategoryScroll && (
                                                                <button
                                                                        onClick={() => scrollCategory("right")}
                                                                        className="absolute right-4 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md border border-orange-500/10 hover:bg-orange-50 transition-colors"
                                                                        aria-label="Scroll right">
                                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                                </button>
                                                        )}
                                                </div>
                                        )}
                                </div>

                                {/* MENU GRID — premium 2-col cards with circular images */}
                                <div className="px-4 sm:px-6 pb-32 pt-4">
                                        {!restaurant ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {Array.from({ length: 6 }).map((_, i) => (
                                                                <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                                                        ))}
                                                </div>
                                        ) : filteredProducts.length === 0 ? (
                                                <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="flex flex-col items-center justify-center py-24 text-center">
                                                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center mb-4">
                                                                <Search className="h-8 w-8 text-orange-500" />
                                                        </div>
                                                        <p className="text-base font-semibold mb-1">No items found</p>
                                                        <p className="text-xs text-muted-foreground">Try a different search or category filter</p>
                                                </motion.div>
                                        ) : groupedProducts.length === 0 ? (
                                                /* No items matched any profile category — show all items flat */
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {filteredProducts.map((item) => (
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
                                        ) : (
                                                <div className="space-y-10">
                                                        {groupedProducts.map(([cat, items]) => (
                                                                <motion.section
                                                                        key={cat}
                                                                        initial={{ opacity: 0, y: 20 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ duration: 0.4 }}
                                                                        className="scroll-mt-32">
                                                                        {/* Category section header */}
                                                                        <div className="flex items-center gap-3 mb-4">
                                                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                                                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-orange-500/15 shadow-sm">
                                                                                        <span className="text-orange-500">{categoryIcons[cat] ?? <UtensilsCrossed className="h-3.5 w-3.5" />}</span>
                                                                                        <h3 className="text-sm font-bold capitalize tracking-wide">{cat}</h3>
                                                                                        <Badge variant="secondary" className="text-[10px] rounded-full">
                                                                                                {items.length}
                                                                                        </Badge>
                                                                                </div>
                                                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                                                                        </div>

                                                                        {/* Cards grid — premium circular plate design */}
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                                {items.map((item) => (
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
                                                                </motion.section>
                                                        ))}
                                                </div>
                                        )}
                                </div>
                        </div>

                        {/* Floating cart button (mobile-style, premium) */}
                        {eligibleToOrder && cartCount > 0 && (
                                <motion.div
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30"
                                        style={{ left: "calc(50% + 30px)" }}>
                                        <Button
                                                onClick={() => setSideSheetOpen(true)}
                                                size="lg"
                                                className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-2xl shadow-orange-500/40 px-6 h-12 gap-3 font-semibold">
                                                <ShoppingCart className="h-5 w-5" />
                                                View Cart
                                                <Badge className="bg-white/20 text-white hover:bg-white/30 rounded-full">{cartCount}</Badge>
                                                <span className="text-xs opacity-90">· ₹{cartTotal}</span>
                                        </Button>
                                </motion.div>
                        )}

                        <Sheet open={sideSheetOpen} onOpenChange={setSideSheetOpen}>
                                <SheetContent side="right" className="w-full sm:max-w-md p-0">
                                        <SheetHeader className="px-4 py-3 border-b bg-gradient-to-r from-orange-500/5 to-red-500/5">
                                                <SheetTitle className="flex items-center gap-2">
                                                        <ShoppingCart className="h-4 w-4 text-orange-500" />
                                                        Your <span className="text-gradient">Order</span>
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
