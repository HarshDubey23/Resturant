/** @file /[restaurant]/direct/page.tsx — Direct-Order landing page (Feature 1).
 *    Bypasses aggregators entirely: the customer orders via the restaurant's
 *    own site, pays directly via UPI (no app fees), and the restaurant keeps
 *    the 20-30% aggregator commission. The hero banner surfaces a 10%-off
 *    offer code (`?code=...`) that the customer can apply at checkout.
 *
 *    The page fetches the public menu via the existing `/api/menu?id=`
 *    endpoint (audit-C2-safe: no upiId leaked to anonymous browsers). For
 *    the UPI deep-link, the customer proceeds through the existing order
 *    flow at `/{restaurant}?tab=menu&table=direct&code=<code>` — the regular
 *    customer OrderPage handles cart + Razorpay/UPI. This keeps the direct
 *    surface thin and reuses the tamper-proof order/place pipeline (audit
 *    B1-B4 fixes by 1-B) instead of duplicating it.
 *
 *    Mobile-first, dark-mode safe, motion entrance animations, skeleton
 *    loaders, sticky cart bar. Touch targets ≥ 44px.
 * @phase 3
 * @audit-finding n/a
 */
"use client";

import { ArrowRight, BadgePercent, Minus, Plus, ShoppingCart, Sparkles, Star, Tag, UtensilsCrossed } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency } from "#utils/helper/currency";

interface DirectMenuItem {
        _id: string;
        name: string;
        description?: string;
        category?: string;
        price: number;
        image?: string;
        veg?: string;
        rating?: number;
        tags?: string[];
        hidden?: boolean;
}

interface DirectMenuResponse {
        username?: string;
        profile?: {
                name?: string;
                description?: string;
                logoUrl?: string;
                avatar?: string;
                cover?: string;
                currency?: string;
                categories?: string[];
                address?: string;
        };
        menus?: DirectMenuItem[];
}

interface DirectPageProps {
        params: Promise<{ restaurant: string }>;
        searchParams: Promise<{ code?: string; [key: string]: string | undefined }>;
}

export default function DirectOrderPage({ params, searchParams }: DirectPageProps) {
        const { restaurant } = use(params);
        const { code } = use(searchParams);

        const [data, setData] = useState<DirectMenuResponse | null>(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const [cart, setCart] = useState<Record<string, number>>({});
        const [copiedCode, setCopiedCode] = useState(false);

        useEffect(() => {
                let cancelled = false;
                (async () => {
                        try {
                                const res = await fetch(`/api/menu?id=${encodeURIComponent(restaurant)}`, { cache: "no-store" });
                                const json = (await res.json()) as DirectMenuResponse & { message?: string };
                                if (!res.ok) throw new Error(json?.message ?? "Failed to load menu");
                                if (cancelled) return;
                                setData(json);
                        } catch (err) {
                                if (cancelled) return;
                                setError(err instanceof Error ? err.message : "Failed to load menu");
                        } finally {
                                if (!cancelled) setLoading(false);
                        }
                })();
                return () => {
                        cancelled = true;
                };
        }, [restaurant]);

        const restaurantName = data?.profile?.name ?? restaurant;
        const currency = data?.profile?.currency ?? "INR";
        const visibleMenus = useMemo(() => (data?.menus ?? []).filter((m) => !m.hidden), [data?.menus]);

        const cartCount = useMemo(() => Object.values(cart).reduce((s, n) => s + n, 0), [cart]);
        const cartTotal = useMemo(() => {
                if (!data?.menus) return 0;
                return Object.entries(cart).reduce((sum, [id, qty]) => {
                        const item = visibleMenus.find((m) => String(m._id) === id);
                        return sum + (item ? item.price * qty : 0);
                }, 0);
        }, [cart, data?.menus, visibleMenus]);

        const directDiscount = useMemo(() => Math.round(cartTotal * 0.1 * 100) / 100, [cartTotal]);
        const directTotal = Math.max(0, cartTotal - directDiscount);

        const onAdd = (id: string) => setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
        const onRemove = (id: string) =>
                setCart((prev) => {
                        const next = { ...prev };
                        if (!next[id]) return next;
                        next[id] -= 1;
                        if (next[id] <= 0) delete next[id];
                        return next;
                });

        const copyCode = async () => {
                if (!code) return;
                try {
                        await navigator.clipboard.writeText(code);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 1800);
                } catch {
                        // Clipboard may be blocked on insecure origins — silently ignore.
                }
        };

        const checkoutHref = useMemo(() => {
                const params = new URLSearchParams({ tab: "menu", table: "direct" });
                if (code) params.set("code", code);
                return `/${encodeURIComponent(restaurant)}?${params.toString()}`;
        }, [code, restaurant]);

        const heroImage = data?.profile?.cover ?? data?.profile?.avatar ?? null;

        return (
                <main className="min-h-[100dvh] bg-gradient-to-b from-background via-background to-muted/30 pb-28">
                        {/* Hero banner */}
                        <motion.section
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                className="relative overflow-hidden">
                                {heroImage && (
                                        <div className="absolute inset-0">
                                                <Image src={heroImage} alt="" fill priority sizes="100vw" className="object-cover" unoptimized />
                                                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
                                        </div>
                                )}
                                <div className="relative px-5 pt-8 pb-6 max-w-3xl mx-auto">
                                        <motion.div
                                                initial={{ y: 12, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ duration: 0.4, delay: 0.1 }}
                                                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 mb-3">
                                                <Sparkles className="h-3.5 w-3.5" />
                                                0% aggregator commission
                                        </motion.div>
                                        <motion.h1
                                                initial={{ y: 12, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ duration: 0.4, delay: 0.15 }}
                                                className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                                                Welcome back to {restaurantName}
                                        </motion.h1>
                                        <motion.p
                                                initial={{ y: 12, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ duration: 0.4, delay: 0.2 }}
                                                className="text-sm text-muted-foreground mt-1.5 max-w-md">
                                                Order direct and get 10% off — no app fees, no commissions, no markups. You're paying the kitchen, not the platform.
                                        </motion.p>

                                        {code && (
                                                <motion.div
                                                        initial={{ y: 12, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        transition={{ duration: 0.4, delay: 0.25 }}
                                                        className="mt-4 flex items-center gap-3">
                                                        <button
                                                                type="button"
                                                                onClick={copyCode}
                                                                className="group inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                                                aria-label={`Copy offer code ${code}`}>
                                                                <Tag className="h-4 w-4 text-primary" />
                                                                <code className="font-mono text-base tracking-wider">{code}</code>
                                                                <span className="text-xs text-muted-foreground group-hover:text-foreground">{copiedCode ? "Copied!" : "Tap to copy"}</span>
                                                        </button>
                                                </motion.div>
                                        )}
                                </div>
                        </motion.section>

                        {/* Menu */}
                        <section className="px-5 max-w-3xl mx-auto" aria-label="Menu">
                                <div className="flex items-center justify-between mb-3">
                                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                                <UtensilsCrossed className="h-5 w-5 text-primary" />
                                                Menu
                                        </h2>
                                        {visibleMenus.length > 0 && (
                                                <span className="text-xs text-muted-foreground">{visibleMenus.length} items</span>
                                        )}
                                </div>

                                {loading ? (
                                        <MenuSkeleton />
                                ) : error ? (
                                        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                                                <p className="text-sm font-semibold text-destructive">{error}</p>
                                                <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
                                                        Try again
                                                </Button>
                                        </div>
                                ) : visibleMenus.length === 0 ? (
                                        <div className="rounded-xl border bg-card p-8 text-center">
                                                <p className="text-sm text-muted-foreground">This restaurant hasn't published any menu items yet.</p>
                                        </div>
                                ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {visibleMenus.map((item, idx) => {
                                                        const qty = cart[String(item._id)] ?? 0;
                                                        return (
                                                                <motion.article
                                                                        key={String(item._id)}
                                                                        initial={{ opacity: 0, y: 12 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.4) }}
                                                                        className="flex gap-3 rounded-2xl border bg-card p-3 hover:shadow-md transition-shadow">
                                                                        <div className="shrink-0">
                                                                                {item.image ? (
                                                                                        <Image
                                                                                                src={item.image}
                                                                                                alt={item.name}
                                                                                                width={84}
                                                                                                height={84}
                                                                                                className="h-20 w-20 rounded-xl object-cover"
                                                                                                unoptimized
                                                                                        />
                                                                                ) : (
                                                                                        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-muted">
                                                                                                <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
                                                                                        </div>
                                                                                )}
                                                                        </div>
                                                                        <div className="min-w-0 flex-1 flex flex-col">
                                                                                <div className="flex items-start gap-2">
                                                                                        <h3 className="text-sm font-semibold text-foreground line-clamp-1 flex-1">{item.name}</h3>
                                                                                        {typeof item.rating === "number" && item.rating > 0 && (
                                                                                                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-foreground shrink-0">
                                                                                                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                                                                        {item.rating.toFixed(1)}
                                                                                                </span>
                                                                                        )}
                                                                                </div>
                                                                                {item.description && (
                                                                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
                                                                                )}
                                                                                <div className="mt-auto flex items-center justify-between pt-2">
                                                                                        <span className="text-sm font-bold text-foreground">{formatCurrency(item.price, currency)}</span>
                                                                                        {qty === 0 ? (
                                                                                                <Button size="sm" className="h-9 px-3 min-h-[44px]" onClick={() => onAdd(String(item._id))}>
                                                                                                        <Plus className="h-3.5 w-3.5" />
                                                                                                        Add
                                                                                                </Button>
                                                                                        ) : (
                                                                                                <div className="flex items-center gap-1 rounded-lg border bg-background">
                                                                                                        <button
                                                                                                                type="button"
                                                                                                                onClick={() => onRemove(String(item._id))}
                                                                                                                aria-label={`Remove one ${item.name}`}
                                                                                                                className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                                                                                                                <Minus className="h-3.5 w-3.5" />
                                                                                                        </button>
                                                                                                        <span className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums">{qty}</span>
                                                                                                        <button
                                                                                                                type="button"
                                                                                                                onClick={() => onAdd(String(item._id))}
                                                                                                                aria-label={`Add one more ${item.name}`}
                                                                                                                className="flex h-9 w-9 items-center justify-center text-primary hover:text-primary/80 transition-colors">
                                                                                                                <Plus className="h-3.5 w-3.5" />
                                                                                                        </button>
                                                                                                </div>
                                                                                        )}
                                                                                </div>
                                                                        </div>
                                                                </motion.article>
                                                        );
                                                })}
                                        </div>
                                )}
                        </section>

                        {/* Sticky cart bar */}
                        <AnimatePresence>
                                {cartCount > 0 && !loading && !error && (
                                        <motion.div
                                                initial={{ y: 80, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: 80, opacity: 0 }}
                                                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                                                className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
                                                <div className="max-w-3xl mx-auto px-5 py-3 flex items-center gap-3">
                                                        <div className="flex items-center gap-2.5">
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold tabular-nums text-sm" aria-hidden="true">
                                                                        {cartCount}
                                                                </div>
                                                                <div className="min-w-0">
                                                                        <div className="flex items-baseline gap-1.5">
                                                                                <span className="text-base font-bold text-foreground tabular-nums">{formatCurrency(directTotal, currency)}</span>
                                                                                {directDiscount > 0 && (
                                                                                        <span className="text-xs text-muted-foreground line-through tabular-nums">{formatCurrency(cartTotal, currency)}</span>
                                                                                )}
                                                                        </div>
                                                                        <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                                                <BadgePercent className="h-3 w-3" />
                                                                                You saved {formatCurrency(directDiscount, currency)}
                                                                        </div>
                                                                </div>
                                                        </div>
                                                        <div className="ml-auto">
                                                                <Link href={checkoutHref} className="inline-block">
                                                                        <Button size="lg" className="min-h-[44px] px-5">
                                                                                <ShoppingCart className="h-4 w-4" />
                                                                                Order Direct
                                                                                <ArrowRight className="h-4 w-4" />
                                                                        </Button>
                                                                </Link>
                                                        </div>
                                                </div>
                                        </motion.div>
                                )}
                        </AnimatePresence>
                </main>
        );
}

function MenuSkeleton() {
        return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                                <div key={`ds-${i.toString()}`} className="flex gap-3 rounded-2xl border bg-card p-3">
                                        <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
                                        <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-3 w-full" />
                                                <Skeleton className="h-3 w-5/6" />
                                                <div className="flex justify-between pt-1">
                                                        <Skeleton className="h-4 w-16" />
                                                        <Skeleton className="h-9 w-16 rounded-lg" />
                                                </div>
                                        </div>
                                </div>
                        ))}
                </div>
        );
}
