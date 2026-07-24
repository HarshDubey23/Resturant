"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import {
        Search,
        Star,
        Flame,
        Plus,
        UtensilsCrossed,
        SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCartStore } from "@/lib/cart-store";
import { useCardTilt } from "@/hooks/useCardTilt";
import { cn } from "@/lib/utils";

type MenuItem = {
        id: string;
        name: string;
        slug: string;
        category: string;
        price: number;
        veg: boolean;
        description?: string;
        spiceLevel?: number;
        rating?: number;
        popular?: boolean;
        tags?: string;
        image?: string;
};

const CATEGORIES: { value: string; label: string }[] = [
        { value: "all", label: "All" },
        { value: "starters", label: "Starters" },
        { value: "mains", label: "Mains" },
        { value: "breads", label: "Breads" },
        { value: "desserts", label: "Desserts" },
        { value: "beverages", label: "Beverages" },
        { value: "street-food", label: "Street Food" },
];

const SORTS = [
        { value: "popular", label: "Popular" },
        { value: "price-asc", label: "Price: Low to High" },
        { value: "price-desc", label: "Price: High to Low" },
        { value: "rating", label: "Rating" },
];

function safeSelectValue(v: unknown, fallback: string): string {
        return typeof v === "string" && v.length > 0 ? v : fallback;
}

export default function MenuSection() {
        const reduceMotion = useReducedMotion();
        const [items, setItems] = useState<MenuItem[]>([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const [category, setCategory] = useState("all");
        const [query, setQuery] = useState("");
        const [sort, setSort] = useState("popular");
        const [vegOnly, setVegOnly] = useState(false);

        useEffect(() => {
                let cancelled = false;
                fetch("/api/landing-menu")
                        .then((r) => {
                                if (!r.ok) throw new Error("Failed to load menu");
                                return r.json();
                        })
                        .then((data: { items: MenuItem[] }) => {
                                if (cancelled) return;
                                setItems(data.items ?? []);
                                setError(null);
                        })
                        .catch((e: unknown) => {
                                if (cancelled) return;
                                setError(e instanceof Error ? e.message : "Failed to load menu");
                        })
                        .finally(() => {
                                if (cancelled) return;
                                setLoading(false);
                        });
                return () => {
                        cancelled = true;
                };
        }, []);

        const filtered = useMemo(() => {
                let list = items;
                if (category !== "all") list = list.filter((i) => i.category === category);
                if (vegOnly) list = list.filter((i) => i.veg);
                const q = query.trim().toLowerCase();
                if (q) {
                        list = list.filter((i) => {
                                const name = i.name.toLowerCase();
                                const tags = (i.tags ?? "").toLowerCase();
                                return name.includes(q) || tags.includes(q);
                        });
                }
                const sorted = [...list];
                switch (sort) {
                        case "price-asc":
                                sorted.sort((a, b) => a.price - b.price);
                                break;
                        case "price-desc":
                                sorted.sort((a, b) => b.price - a.price);
                                break;
                        case "rating":
                                sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
                                break;
                        case "popular":
                        default:
                                sorted.sort(
                                        (a, b) =>
                                                Number(Boolean(b.popular)) - Number(Boolean(a.popular)) ||
                                                (b.rating ?? 0) - (a.rating ?? 0),
                                );
                                break;
                }
                return sorted;
        }, [items, category, query, sort, vegOnly]);

        return (
                <section
                        id="menu"
                        className="relative py-20 sm:py-28 bg-gradient-to-b from-white via-violet-50/40 to-white"
                >
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                                <motion.div
                                        initial={{ opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-80px" }}
                                        transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeOut" }}
                                        className="mx-auto max-w-2xl text-center"
                                >
                                        <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
                                                <UtensilsCrossed className="h-3.5 w-3.5" /> Our Menu
                                        </span>
                                        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                                                Browse our signature dishes
                                        </h2>
                                        <p className="mt-4 text-base text-slate-600 sm:text-lg">
                                                From smoky tandoor starters to soulful biryanis and decadent desserts — every dish is crafted with fresh ingredients and authentic spices.
                                        </p>
                                </motion.div>

                                {/* Controls */}
                                <div className="mt-10 flex flex-col gap-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                <div className="relative flex-1">
                                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                        <Input
                                                                value={query}
                                                                onChange={(e) => setQuery(e.target.value)}
                                                                placeholder="Search dishes or tags (e.g. biryani, veg, paneer)..."
                                                                aria-label="Search menu"
                                                                className="rounded-xl border-slate-200 bg-white pl-10 focus:border-violet-500 focus:ring-violet-500/20"
                                                        />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                        <SlidersHorizontal className="hidden h-4 w-4 text-slate-400 sm:block" />
                                                        <Select
                                                                value={sort}
                                                                onValueChange={(v) => setSort(safeSelectValue(v, "popular"))}
                                                        >
                                                                <SelectTrigger
                                                                        className="w-full rounded-xl border-slate-200 bg-white sm:w-56"
                                                                        aria-label="Sort menu"
                                                                >
                                                                        <SelectValue placeholder="Sort by" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                        {SORTS.map((s) => (
                                                                                <SelectItem key={s.value} value={s.value}>
                                                                                        {s.label}
                                                                                </SelectItem>
                                                                        ))}
                                                                </SelectContent>
                                                        </Select>
                                                </div>
                                        </div>

                                        {/* Veg-only toggle */}
                                        <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                        <Switch
                                                                id="veg-only"
                                                                checked={vegOnly}
                                                                onCheckedChange={setVegOnly}
                                                                className="data-checked:bg-emerald-500"
                                                        />
                                                        <Label htmlFor="veg-only" className="text-sm text-slate-600 cursor-pointer">
                                                                Veg only
                                                        </Label>
                                                </div>
                                                {vegOnly && (
                                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                                🌿 Showing vegetarian items
                                                        </Badge>
                                                )}
                                        </div>

                                        <Tabs
                                                value={category}
                                                onValueChange={(v) => setCategory(safeSelectValue(v, "all"))}
                                                className="w-full"
                                        >
                                                <TabsList
                                                        className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-violet-50 p-1"
                                                        variant="default"
                                                >
                                                        {CATEGORIES.map((c) => (
                                                                <TabsTrigger
                                                                        key={c.value}
                                                                        value={c.value}
                                                                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 data-active:bg-white data-active:text-violet-700 data-active:shadow-sm"
                                                                >
                                                                        {c.label}
                                                                </TabsTrigger>
                                                        ))}
                                                </TabsList>
                                        </Tabs>
                                </div>

                                {/* Grid */}
                                {loading ? (
                                        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                                {Array.from({ length: 8 }).map((_, i) => (
                                                        <Skeleton key={i} className="h-80 w-full rounded-2xl" />
                                                ))}
                                        </div>
                                ) : error ? (
                                        <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                                                <p className="text-sm font-medium text-red-700">{error}</p>
                                                <Button
                                                        variant="outline"
                                                        className="mt-4 border-red-200 text-red-700 hover:bg-red-50"
                                                        onClick={() => window.location.reload()}
                                                >
                                                        Try again
                                                </Button>
                                        </div>
                                ) : filtered.length === 0 ? (
                                        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center">
                                                <UtensilsCrossed className="h-10 w-10 text-slate-300" />
                                                <p className="mt-3 text-base font-semibold text-slate-700">
                                                        No dishes match your search
                                                </p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                        Try a different category or keyword.
                                                </p>
                                                <Button
                                                        variant="outline"
                                                        className="mt-4 border-violet-200 text-violet-700 hover:bg-violet-50"
                                                        onClick={() => {
                                                                setQuery("");
                                                                setCategory("all");
                                                                setSort("popular");
                                                                setVegOnly(false);
                                                        }}
                                                >
                                                        Reset filters
                                                </Button>
                                        </div>
                                ) : (
                                        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                                {filtered.map((item, idx) => (
                                                        <MenuCard
                                                                key={item.id}
                                                                item={item}
                                                                index={idx}
                                                                reduceMotion={Boolean(reduceMotion)}
                                                        />
                                                ))}
                                        </div>
                                )}
                        </div>
                </section>
        );
}

function SpiceLevel({ level = 0 }: { level?: number }) {
        const clamped = Math.max(0, Math.min(3, level));
        return (
                <span
                        className="inline-flex items-center gap-0.5"
                        aria-label={`Spice level ${clamped} of 3`}
                >
                        {[1, 2, 3].map((n) => (
                                <Flame
                                        key={n}
                                        className={cn(
                                                "h-3.5 w-3.5",
                                                n <= clamped ? "text-orange-500" : "text-slate-200",
                                        )}
                                />
                        ))}
                </span>
        );
}

type MenuCardProps = {
        item: MenuItem;
        index: number;
        reduceMotion: boolean;
};

function MenuCard({ item, index, reduceMotion }: MenuCardProps) {
        const addItem = useCartStore((s) => s.addItem);
        const [imgError, setImgError] = useState(false);
        const hasImage = Boolean(item.image) && !imgError;
        const { style: tiltStyle, onMouseMove: tiltOnMouseMove, onMouseLeave: tiltOnMouseLeave } = useCardTilt(5);

        const handleAdd = () => {
                addItem(
                        {
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                image: item.image ?? "",
                                spice: item.spiceLevel,
                        },
                        1,
                );
                toast.success(`Added ${item.name}`, {
                        description: `₹${item.price} • View cart to checkout`,
                        action: {
                                label: "View cart",
                                onClick: () => useCartStore.getState().setOpen(true),
                        },
                });
        };

        return (
                <motion.article
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{
                                duration: reduceMotion ? 0 : 0.4,
                                delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.3),
                                ease: "easeOut",
                        }}
                        style={tiltStyle}
                        onMouseMove={tiltOnMouseMove}
                        onMouseLeave={tiltOnMouseLeave}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl"
                >
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-violet-50">
                                {hasImage ? (
                                        <Image
                                                src={item.image as string}
                                                alt={item.name}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                onError={() => setImgError(true)}
                                        />
                                ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 to-fuchsia-100">
                                                <UtensilsCrossed className="h-10 w-10 text-violet-400" />
                                        </div>
                                )}
                                {/* Veg / non-veg indicator */}
                                <span
                                        className={cn(
                                                "absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded border-2 bg-white",
                                                item.veg ? "border-green-600" : "border-red-600",
                                        )}
                                        aria-label={item.veg ? "Vegetarian" : "Non-vegetarian"}
                                        title={item.veg ? "Vegetarian" : "Non-vegetarian"}
                                >
                                        <span
                                                className={cn(
                                                        "h-2 w-2 rounded-full",
                                                        item.veg ? "bg-green-600" : "bg-red-600",
                                                )}
                                        />
                                </span>
                                {item.popular && (
                                        <Badge className="absolute right-2 top-2 gap-1 bg-amber-500 text-white shadow-sm hover:bg-amber-500">
                                                <Star className="h-3 w-3 fill-current" /> Popular
                                        </Badge>
                                )}
                        </div>

                        <div className="flex flex-1 flex-col p-4">
                                <div className="flex items-start justify-between gap-2">
                                        <h3 className="text-base font-semibold leading-snug text-slate-900">
                                                {item.name}
                                        </h3>
                                        {(item.rating ?? 0) > 0 && (
                                                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
                                                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                                        {item.rating?.toFixed(1)}
                                                </span>
                                        )}
                                </div>
                                <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-slate-500">
                                        {item.description ?? "Delicious dish made fresh to order."}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                        <SpiceLevel level={item.spiceLevel ?? 0} />
                                        <span className="text-xs capitalize text-slate-400">
                                                {item.category.replace("-", " ")}
                                        </span>
                                </div>
                                <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                                        <span className="text-lg font-bold text-slate-900">₹{item.price}</span>
                                        <Button
                                                size="sm"
                                                onClick={handleAdd}
                                                className="rounded-full bg-violet-600 px-4 hover:bg-violet-700"
                                                aria-label={`Add ${item.name} to cart`}
                                        >
                                                <Plus className="h-4 w-4" /> Add
                                        </Button>
                                </div>
                        </div>
                </motion.article>
        );
}
