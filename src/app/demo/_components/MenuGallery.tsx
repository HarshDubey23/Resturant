"use client";

import { Flame, Leaf, Plus, Search, ShoppingCart } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DISH_CATEGORIES, DISHES, type Dish, type DishCategory } from "../_data/dishes";
import { useDemoCart } from "./CartContext";

type Filter = "All" | DishCategory;

const SPICE_DOT: Record<Dish["spice"], string> = {
	Mild: "bg-emerald-500",
	Medium: "bg-amber-500",
	Hot: "bg-rose-500",
};

function formatINR(n: number) {
	return `₹${n.toLocaleString("en-IN")}`;
}

export function MenuGallery() {
	const prefersReduced = useReducedMotion();
	const [filter, setFilter] = useState<Filter>("All");
	const [query, setQuery] = useState("");
	const [active, setActive] = useState<Dish | null>(null);
	const { count } = useDemoCart();

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return DISHES.filter((d) => {
			const inCat = filter === "All" || d.category === filter;
			const inQuery = q === "" || d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
			return inCat && inQuery;
		});
	}, [filter, query]);

	return (
		<section id="menu-gallery" className="relative py-24 sm:py-32 bg-background">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.6 }}
					className="text-center mb-12">
					<Badge variant="secondary" className="mb-4 gap-1.5">
						<Leaf className="h-3.5 w-3.5" /> Live menu · 18 dishes
					</Badge>
					<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
						The menu your diners <span className="text-gradient">scroll through</span>
					</h2>
					<p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
						Tap any dish to open the lightbox, filter by category, or search. Adding to cart updates the floating counter — this is the exact UX your
						customers see after the QR scan.
					</p>
				</motion.div>

				{/* Controls */}
				<div className="sticky top-16 z-30 -mx-4 px-4 py-3 mb-10 bg-background/80 backdrop-blur-md rounded-b-2xl border-b border-border/60">
					<div className="flex flex-col md:flex-row md:items-center gap-4">
						<div className="relative flex-1 max-w-md">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<input
								type="search"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search dishes or categories…"
								aria-label="Search dishes"
								className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
						</div>
						<div className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-hide pb-1 md:pb-0">
							{DISH_CATEGORIES.map((c) => {
								const isActive = filter === c;
								return (
									<button
										key={c}
										type="button"
										onClick={() => setFilter(c)}
										aria-pressed={isActive}
										className={cn(
											"shrink-0 h-9 min-h-11 px-4 rounded-full text-sm font-medium transition-all duration-200",
											isActive
												? "bg-primary text-primary-foreground shadow-soft"
												: "bg-card text-muted-foreground border border-border hover:text-foreground hover:border-primary/40",
										)}>
										{c}
									</button>
								);
							})}
						</div>
						<div className="hidden md:flex items-center gap-2 rounded-full bg-card border border-border px-4 h-11">
							<ShoppingCart className="h-4 w-4 text-primary" />
							<span className="text-sm font-semibold text-foreground">{count}</span>
							<span className="text-xs text-muted-foreground">in cart</span>
						</div>
					</div>
				</div>

				{/* Masonry-style grid */}
				<motion.div layout={!prefersReduced} className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-fill:_balance]">
					<AnimatePresence mode="popLayout">
						{filtered.map((dish, idx) => (
							<motion.button
								key={dish.id}
								type="button"
								layout
								initial={{ opacity: 0, y: 24 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.92 }}
								transition={{
									duration: 0.4,
									delay: prefersReduced ? 0 : Math.min(idx * 0.04, 0.4),
									ease: [0.16, 1, 0.3, 1],
								}}
								onClick={() => setActive(dish)}
								className="group mb-4 block w-full break-inside-avoid text-left rounded-2xl overflow-hidden border border-border bg-card shadow-soft hover:shadow-soft-hover transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
								<div className="relative overflow-hidden">
									<div className="relative aspect-[4/5]">
										<Image
											src={dish.image}
											alt={dish.name}
											fill
											sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
											className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
										/>
										<div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
									</div>

									{/* Veg / spice badges */}
									<div className="absolute top-3 left-3 flex items-center gap-2">
										<span
											role="img"
											aria-label={dish.veg ? "Vegetarian" : "Non-vegetarian"}
											className={cn(
												"flex h-5 w-5 items-center justify-center rounded-sm border-2 bg-card/80 backdrop-blur-sm",
												dish.veg ? "border-emerald-500" : "border-rose-500",
											)}>
											<span className={cn("h-2 w-2 rounded-full", dish.veg ? "bg-emerald-500" : "bg-rose-500")} />
										</span>
									</div>

									{/* Price badge */}
									<div className="absolute top-3 right-3">
										<span className="rounded-full bg-card/90 backdrop-blur-sm px-3 py-1 text-sm font-bold text-foreground shadow-soft">
											{formatINR(dish.price)}
										</span>
									</div>

									{/* Name overlay */}
									<div className="absolute bottom-0 left-0 right-0 p-4">
										<div className="flex items-center gap-1.5 mb-1">
											{dish.spice !== "Mild" && (
												<span
													role="img"
													aria-label={`Spice: ${dish.spice}`}
													className={cn("inline-block h-1.5 w-1.5 rounded-full", SPICE_DOT[dish.spice])}
												/>
											)}
											<span className="text-[10px] uppercase tracking-wider text-muted-foreground">{dish.category}</span>
										</div>
										<h3 className="text-base font-bold text-foreground leading-tight line-clamp-2">{dish.name}</h3>
									</div>

									{/* Hover quick-add */}
									<div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
										<div className="flex items-center justify-center gap-2 rounded-xl bg-primary/95 text-primary-foreground py-2.5 text-sm font-semibold backdrop-blur-sm">
											<Plus className="h-4 w-4" /> Quick view
										</div>
									</div>
								</div>
							</motion.button>
						))}
					</AnimatePresence>
				</motion.div>

				{filtered.length === 0 && (
					<div className="text-center py-20 text-muted-foreground">
						<Search className="mx-auto h-10 w-10 opacity-40 mb-4" />
						<p className="text-lg">No dishes match &ldquo;{query}&rdquo;.</p>
					</div>
				)}
			</div>

			{/* Lightbox */}
			<Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
				<DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0">{active && <DishLightbox dish={active} />}</DialogContent>
			</Dialog>
		</section>
	);
}

function DishLightbox({ dish }: { dish: Dish }) {
	const { add } = useDemoCart();
	return (
		<>
			<div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden">
				<Image src={dish.image} alt={dish.name} fill sizes="(max-width: 640px) 100vw, 640px" className="object-cover" />
				<div className="absolute inset-0 bg-gradient-to-t from-popover via-popover/20 to-transparent" />
			</div>
			<div className="p-6">
				<DialogTitle className="text-2xl font-extrabold tracking-tight text-foreground pr-8">{dish.name}</DialogTitle>
				<div className="mt-3 flex flex-wrap items-center gap-2">
					<Badge variant="secondary">{dish.category}</Badge>
					<Badge variant="outline" className="gap-1.5">
						<span className={cn("inline-block h-2 w-2 rounded-full", dish.veg ? "bg-emerald-500" : "bg-rose-500")} />
						{dish.veg ? "Veg" : "Non-veg"}
					</Badge>
					<Badge variant="outline" className="gap-1.5">
						<Flame className="h-3 w-3" />
						{dish.spice} spice
					</Badge>
					<span className="ml-auto text-2xl font-extrabold text-foreground">{formatINR(dish.price)}</span>
				</div>
				<DialogDescription className="mt-4 text-base text-muted-foreground leading-relaxed">{dish.description}</DialogDescription>
				<div className="mt-6 flex flex-col sm:flex-row gap-3">
					<Button
						size="lg"
						className="h-12 flex-1 gap-2 rounded-xl"
						onClick={() =>
							add({
								dishId: dish.id,
								name: dish.name,
								price: dish.price,
								image: dish.image,
							})
						}>
						<Plus className="h-4 w-4" /> Add to cart · {formatINR(dish.price)}
					</Button>
					<Button
						variant="outline"
						size="lg"
						className="h-12 gap-2 rounded-xl"
						onClick={() =>
							add(
								{
									dishId: dish.id,
									name: dish.name,
									price: dish.price,
									image: dish.image,
								},
								2,
							)
						}>
						Add 2
					</Button>
				</div>
				<p className="mt-4 text-xs text-muted-foreground">Decorative cart — totals shown in the floating counter at bottom-right.</p>
			</div>
		</>
	);
}

export function FloatingCartBadge() {
	const { count, total } = useDemoCart();
	return (
		<AnimatePresence>
			{count > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 24, scale: 0.8 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 24, scale: 0.8 }}
					transition={{ type: "spring", stiffness: 280, damping: 24 }}
					className="fixed bottom-20 right-4 sm:right-6 z-40 flex items-center gap-3 rounded-full border border-border bg-card/95 backdrop-blur-md px-4 py-2.5 shadow-soft-hover">
					<div className="relative">
						<span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
							<ShoppingCart className="h-4 w-4" />
						</span>
						<span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold px-1">
							{count}
						</span>
					</div>
					<div className="pr-1 leading-tight">
						<div className="text-[10px] uppercase tracking-wide text-muted-foreground">Demo cart</div>
						<div className="text-sm font-bold text-foreground">₹{total.toLocaleString("en-IN")}</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
