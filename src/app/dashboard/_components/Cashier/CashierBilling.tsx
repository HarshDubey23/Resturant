"use client";

/**
 * @file CashierBilling — keyboard-driven POS billing screen.
 * @phase 2
 * @audit-finding n/a
 *
 * Three-column layout: item search + grid (left), current bill (center),
 * totals + tender (right). Locked behind a ShiftOpen modal until the cashier
 * opens a shift. Keyboard shortcuts: F1 search, F2 hold, F3 recall, F4
 * discount, F5 print, F6 pay cash, F7 pay UPI, Esc cancel, ? overlay.
 * Hold/recall persists to localStorage. Split + combine bills operate on the
 * held-bill set. Tender uses react-hook-form + zod. Cash auto-computes change;
 * UPI generates a deep-link. Bill print calls /api/print/kot + /api/print/bill.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import {
	AlertCircle,
	Banknote,
	CreditCard,
	Hash,
	History,
	Lock,
	Minus,
	Percent,
	Plus,
	Printer,
	Search,
	ShoppingCart,
	Smartphone,
	SplitSquareHorizontal,
	Trash2,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "#components/context/useContext";
import { fetcher } from "#utils/helper/common";
import { formatCurrency } from "#utils/helper/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import ShiftClose from "./ShiftClose";
import ShiftOpen from "./ShiftOpen";
import ShiftXReport from "./ShiftXReport";

// ----- Types ----------------------------------------------------------------

interface CashierItem {
	menuId: string;
	name: string;
	price: number;
	qty: number;
	tax: number;
	station: string;
	veg: string;
	sku?: string;
	modifiers?: string[];
}

interface HeldBill {
	id: string;
	table: string;
	items: CashierItem[];
	discount: number;
	tip: number;
	createdAt: string;
}

interface ShiftSnapshot {
	_id: string;
	openingCash: number;
	openedAt: string;
	cashierName?: string;
	status: "open" | "closed" | "flagged";
}

const tenderSchema = z.object({
	tendered: z.number().min(0, "Tendered amount cannot be negative"),
});
type TenderValues = z.infer<typeof tenderSchema>;

const SHORTCUTS: Array<{ key: string; label: string }> = [
	{ key: "F1", label: "Focus search" },
	{ key: "F2", label: "Hold current bill" },
	{ key: "F3", label: "Recall a held bill" },
	{ key: "F4", label: "Apply discount" },
	{ key: "F5", label: "Print KOT + Bill" },
	{ key: "F6", label: "Pay cash" },
	{ key: "F7", label: "Pay via UPI" },
	{ key: "Esc", label: "Cancel / clear bill" },
	{ key: "?", label: "Show this shortcut overlay" },
];

const HELD_BILLS_KEY = "ow_cashier_held_bills";

// ----- Component ------------------------------------------------------------

export default function CashierBilling() {
	const { menus, tables, profile, profileLoading } = useAdmin();
	const currency = profile?.currency ?? "INR";
	const upiId = profile?.upiId ?? "";
	const restaurantName = profile?.name ?? "Restaurant";

	const [shift, setShift] = useState<ShiftSnapshot | null>(null);
	const [shiftChecking, setShiftChecking] = useState(true);
	const [shiftOpenOpen, setShiftOpenOpen] = useState(false);
	const [shiftCloseOpen, setShiftCloseOpen] = useState(false);
	const [xReportOpen, setXReportOpen] = useState(false);
	const [shortcutsOpen, setShortcutsOpen] = useState(false);

	const [items, setItems] = useState<CashierItem[]>([]);
	const [table, setTable] = useState<string>("");
	const [discount, setDiscount] = useState<number>(0);
	const [tip, setTip] = useState<number>(0);
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
	const [recallOpen, setRecallOpen] = useState(false);
	const [payMode, setPayMode] = useState<"cash" | "upi" | null>(null);
	const [processing, setProcessing] = useState(false);

	const {
		register,
		handleSubmit: handleTenderSubmit,
		watch,
		reset: resetTender,
		formState: { errors: tenderErrors },
	} = useForm<TenderValues>({
		resolver: zodResolver(tenderSchema),
		defaultValues: { tendered: 0 },
	});

	// ---- shift gating ----
	const refetchShift = useCallback(async () => {
		setShiftChecking(true);
		try {
			const data = await fetcher("/api/cashier/shift/current");
			setShift((data?.shift ?? null) as ShiftSnapshot | null);
		} catch {
			setShift(null);
		} finally {
			setShiftChecking(false);
		}
	}, []);

	useEffect(() => {
		refetchShift();
	}, [refetchShift]);

	// ---- held-bills persistence ----
	useEffect(() => {
		try {
			const raw = localStorage.getItem(HELD_BILLS_KEY);
			if (raw) setHeldBills(JSON.parse(raw) as HeldBill[]);
		} catch {
			// localStorage may be unavailable (private mode) — fail silently.
		}
	}, []);

	const persistHeldBills = useCallback((next: HeldBill[]) => {
		setHeldBills(next);
		try {
			localStorage.setItem(HELD_BILLS_KEY, JSON.stringify(next));
		} catch {
			// Same as above — non-fatal.
		}
	}, []);

	// ---- keyboard shortcuts ----
	// biome-ignore lint/correctness/useExhaustiveDependencies: keyboard handler intentionally rebinds only on UI-state changes; action callbacks (clearBill/holdBill/printBill/startTender) close over the same state and are intentionally omitted.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			// Ignore shortcuts while typing in inputs (except Esc).
			const target = e.target as HTMLElement | null;
			const isTyping = !!target?.tagName?.match(/^(INPUT|TEXTAREA|SELECT)$/);
			if (e.key === "Escape") {
				if (searchOpen) setSearchOpen(false);
				else if (recallOpen) setRecallOpen(false);
				else if (shortcutsOpen) setShortcutsOpen(false);
				else if (payMode) setPayMode(null);
				else clearBill();
				return;
			}
			if (isTyping) return;
			if (e.key === "F1") {
				e.preventDefault();
				setSearchOpen(true);
			} else if (e.key === "F2") {
				e.preventDefault();
				holdBill();
			} else if (e.key === "F3") {
				e.preventDefault();
				setRecallOpen(true);
			} else if (e.key === "F4") {
				e.preventDefault();
				const next = prompt("Discount amount:", String(discount || ""));
				if (next !== null) setDiscount(Math.max(0, Number(next) || 0));
			} else if (e.key === "F5") {
				e.preventDefault();
				printBill();
			} else if (e.key === "F6") {
				e.preventDefault();
				startTender("cash");
			} else if (e.key === "F7") {
				e.preventDefault();
				startTender("upi");
			} else if (e.key === "?") {
				e.preventDefault();
				setShortcutsOpen(true);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
		// biome-ignore lint/correctness/useExhaustiveDependencies: keyboard handler intentionally rebinds on UI-state changes; action callbacks close over the same state.
	}, [discount, searchOpen, recallOpen, shortcutsOpen, payMode]);

	// ---- derived totals ----
	const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
	const taxTotal = useMemo(() => items.reduce((s, i) => s + i.tax * i.qty, 0), [items]);
	const grandTotal = useMemo(() => Math.max(0, subtotal + taxTotal - discount + tip), [subtotal, taxTotal, discount, tip]);

	const tendered = watch("tendered") ?? 0;
	const change = Math.max(0, Number(tendered || 0) - grandTotal);

	// ---- bill mutations ----
	const addItem = (menuId: string) => {
		const menu = menus?.find((m) => String(m._id) === menuId);
		if (!menu) return;
		setItems((prev) => {
			const existing = prev.find((i) => i.menuId === menuId);
			if (existing) return prev.map((i) => (i.menuId === menuId ? { ...i, qty: i.qty + 1 } : i));
			return [
				...prev,
				{
					menuId,
					name: String(menu.name),
					price: Number(menu.price),
					qty: 1,
					tax: Number(menu.price) * (Number(menu.taxPercent) / 100),
					station: String(menu.station ?? "main"),
					veg: String(menu.veg ?? "veg"),
					sku: menu.sku,
				},
			];
		});
	};

	const changeQty = (menuId: string, delta: number) => {
		setItems((prev) => prev.map((i) => (i.menuId === menuId ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0));
	};

	const removeItem = (menuId: string) => setItems((prev) => prev.filter((i) => i.menuId !== menuId));

	const clearBill = () => {
		setItems([]);
		setDiscount(0);
		setTip(0);
		setTable("");
		resetTender({ tendered: 0 });
	};

	const holdBill = () => {
		if (items.length === 0) {
			toast.error("Cannot hold an empty bill");
			return;
		}
		const held: HeldBill = {
			id: `hold-${Date.now()}`,
			table: table || "—",
			items,
			discount,
			tip,
			createdAt: new Date().toISOString(),
		};
		persistHeldBills([held, ...heldBills]);
		toast.success(`Bill held (${items.length} items)`);
		clearBill();
	};

	const recallBill = (id: string) => {
		const held = heldBills.find((h) => h.id === id);
		if (!held) return;
		if (items.length > 0) {
			toast.error("Clear current bill before recalling");
			return;
		}
		setItems(held.items);
		setTable(held.table === "—" ? "" : held.table);
		setDiscount(held.discount);
		setTip(held.tip);
		persistHeldBills(heldBills.filter((h) => h.id !== id));
		setRecallOpen(false);
		toast.success("Bill recalled");
	};

	const combineBills = (id: string) => {
		const held = heldBills.find((h) => h.id === id);
		if (!held) return;
		setItems((prev) => {
			const map = new Map(prev.map((i) => [i.menuId, i]));
			for (const i of held.items) {
				const existing = map.get(i.menuId);
				if (existing) existing.qty += i.qty;
				else map.set(i.menuId, { ...i });
			}
			return Array.from(map.values());
		});
		persistHeldBills(heldBills.filter((h) => h.id !== id));
		setRecallOpen(false);
		toast.success("Bill combined into current");
	};

	const startTender = (mode: "cash" | "upi") => {
		if (items.length === 0) {
			toast.error("Add items before tendering");
			return;
		}
		if (!table) {
			toast.error("Select a table first");
			return;
		}
		setPayMode(mode);
		resetTender({ tendered: mode === "cash" ? grandTotal : 0 });
	};

	const cancelTender = () => {
		setPayMode(null);
		resetTender({ tendered: 0 });
	};

	const printBill = async () => {
		if (items.length === 0) {
			toast.error("Add items before printing");
			return;
		}
		if (!table) {
			toast.error("Select a table first");
			return;
		}
		setProcessing(true);
		try {
			const checkoutRes = await fetch("/api/cashier/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					table,
					items: items.map((i) => ({ menuId: i.menuId, qty: i.qty, modifiers: i.modifiers })),
					paymentMode: "cash",
					discount,
					tip,
				}),
			});
			const checkoutData = await checkoutRes.json();
			if (!checkoutRes.ok) throw new Error(checkoutData?.message ?? "Checkout failed");
			const orderId = checkoutData.orderId as string;

			// Fire both print requests — bytes are consumed by the local print agent.
			const [kotRes, billRes] = await Promise.allSettled([
				fetch("/api/print/kot", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ orderId }),
				}),
				fetch("/api/print/bill", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ orderId, discount, tip, paymentMode: "cash" }),
				}),
			]);
			if (kotRes.status === "rejected") throw new Error("KOT print failed");
			if (billRes.status === "rejected") throw new Error("Bill print failed");

			toast.success(`Printed KOT #${orderId.slice(-6).toUpperCase()} + bill`);
			clearBill();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Print failed");
		} finally {
			setProcessing(false);
		}
	};

	const onTender = handleTenderSubmit(async (_values) => {
		if (!payMode || !table) return;
		setProcessing(true);
		try {
			const res = await fetch("/api/cashier/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					table,
					items: items.map((i) => ({ menuId: i.menuId, qty: i.qty, modifiers: i.modifiers })),
					paymentMode: payMode,
					discount,
					tip,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message ?? "Checkout failed");
			toast.success(payMode === "cash" ? `Paid • Change ${formatCurrency(change, currency)}` : `UPI link ready`);
			clearBill();
			setPayMode(null);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Tender failed");
		} finally {
			setProcessing(false);
		}
	});

	const upiDeepLink = useMemo(() => {
		if (!upiId || grandTotal <= 0) return "";
		const params = new URLSearchParams({
			pa: upiId,
			am: grandTotal.toFixed(2),
			pn: restaurantName,
			cu: "INR",
			tn: `Table ${table || "—"} • ${items.length} items`,
		});
		return `upi://pay?${params.toString()}`;
	}, [upiId, grandTotal, restaurantName, table, items.length]);

	// ---- filtered menu for search ----
	const filteredMenus = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		const visible = (menus ?? []).filter((m) => m.hidden !== true);
		if (!q) return visible.slice(0, 30);
		return visible
			.filter((m) => {
				const name = String(m.name ?? "").toLowerCase();
				const sku = String(m.sku ?? "").toLowerCase();
				return name.includes(q) || sku.includes(q);
			})
			.slice(0, 30);
	}, [menus, searchQuery]);

	// ---- render ----
	const locked = !shift && !shiftChecking;

	if (shiftChecking || profileLoading) {
		return (
			<div className="grid gap-4 lg:grid-cols-[280px_1fr_320px]">
				<Skeleton className="h-64 w-full rounded-xl" />
				<Skeleton className="h-64 w-full rounded-xl" />
				<Skeleton className="h-64 w-full rounded-xl" />
			</div>
		);
	}

	return (
		<div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
			{/* Shift status header */}
			<div className="flex items-center justify-between rounded-xl border bg-card px-4 py-2">
				<div className="flex items-center gap-2">
					{shift ? (
						<Badge variant="secondary" className="gap-1">
							<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
							Shift open • {formatCurrency(shift.openingCash, currency)}
						</Badge>
					) : (
						<Badge variant="destructive" className="gap-1">
							<Lock className="h-3 w-3" />
							No open shift
						</Badge>
					)}
					<span className="text-xs text-muted-foreground">
						{items.length} items • {table || "no table"}
					</span>
				</div>
				<div className="flex items-center gap-1">
					<Button variant="outline" size="xs" onClick={() => setXReportOpen(true)} disabled={locked}>
						<History className="h-3 w-3" />X Report
					</Button>
					<Button variant="outline" size="xs" onClick={() => setShiftCloseOpen(true)} disabled={locked}>
						End Shift
					</Button>
					<Button variant="ghost" size="xs" onClick={() => setShortcutsOpen(true)}>
						<Hash className="h-3 w-3" />
						Shortcuts
					</Button>
				</div>
			</div>

			{/* Three-column grid */}
			<div className="grid flex-1 gap-3 overflow-hidden lg:grid-cols-[280px_1fr_320px]">
				{/* LEFT: item search + grid */}
				<aside className="hidden flex-col gap-2 overflow-hidden rounded-xl border bg-card lg:flex">
					<div className="p-2">
						<Button variant="outline" className="w-full justify-start" size="sm" onClick={() => setSearchOpen(true)}>
							<Search className="h-3.5 w-3.5" />
							Search items… <kbd className="ml-auto text-[10px] opacity-60">F1</kbd>
						</Button>
					</div>
					<ScrollArea className="flex-1 px-2 pb-2">
						<div className="grid grid-cols-2 gap-2">
							{filteredMenus.length === 0 ? (
								<div className="col-span-2 py-10 text-center text-xs text-muted-foreground">No menu items. Add items in Settings → Menu.</div>
							) : (
								filteredMenus.map((m) => (
									<motion.button
										key={String(m._id)}
										whileTap={{ scale: 0.97 }}
										onClick={() => addItem(String(m._id))}
										className="flex flex-col gap-1 rounded-lg border bg-card p-2 text-left transition hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/20">
										<span className="text-xs font-medium leading-tight line-clamp-2">{m.name}</span>
										<span className="text-[11px] text-muted-foreground">{formatCurrency(Number(m.price), currency)}</span>
									</motion.button>
								))
							)}
						</div>
					</ScrollArea>
				</aside>

				{/* CENTER: current bill */}
				<section className="flex flex-col overflow-hidden rounded-xl border bg-card">
					<header className="flex items-center justify-between border-b p-3">
						<div className="flex items-center gap-2">
							<ShoppingCart className="h-4 w-4 text-muted-foreground" />
							<h3 className="text-sm font-semibold">Current Bill</h3>
						</div>
						<select
							value={table}
							onChange={(e) => setTable(e.target.value)}
							className="h-7 rounded-md border bg-background px-2 text-xs"
							aria-label="Select table">
							<option value="">Select table…</option>
							{tables?.map((t) => (
								<option key={String(t.name)} value={String(t.name)}>
									{t.name}
								</option>
							))}
						</select>
					</header>

					<ScrollArea className="flex-1">
						{items.length === 0 ? (
							<div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
								<ShoppingCart className="h-10 w-10 text-muted-foreground/50" />
								<p className="text-sm text-muted-foreground">Bill is empty</p>
								<p className="text-xs text-muted-foreground/70">Tap an item on the left or press F1 to search.</p>
							</div>
						) : (
							<div className="divide-y">
								<AnimatePresence initial={false}>
									{items.map((item) => (
										<motion.div
											key={item.menuId}
											layout
											initial={{ opacity: 0, x: 16 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: -16, height: 0 }}
											className="flex items-start gap-2 p-3">
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium truncate">{item.name}</p>
												<p className="text-xs text-muted-foreground">
													{formatCurrency(item.price, currency)} × {item.qty} = {formatCurrency(item.price * item.qty, currency)}
												</p>
												{item.modifiers && item.modifiers.length > 0 && (
													<p className="text-[11px] text-muted-foreground">[{item.modifiers.join(", ")}]</p>
												)}
											</div>
											<div className="flex items-center gap-1">
												<Button size="icon-xs" variant="outline" onClick={() => changeQty(item.menuId, -1)} aria-label="Decrease qty">
													<Minus className="h-3 w-3" />
												</Button>
												<span className="min-w-[1.5rem] text-center text-sm font-medium tabular-nums">{item.qty}</span>
												<Button size="icon-xs" variant="outline" onClick={() => changeQty(item.menuId, 1)} aria-label="Increase qty">
													<Plus className="h-3 w-3" />
												</Button>
												<Button size="icon-xs" variant="ghost" onClick={() => removeItem(item.menuId)} aria-label="Remove item">
													<Trash2 className="h-3 w-3" />
												</Button>
											</div>
										</motion.div>
									))}
								</AnimatePresence>
							</div>
						)}
					</ScrollArea>

					{items.length > 0 && (
						<footer className="flex items-center justify-between border-t p-3">
							<Button variant="ghost" size="sm" onClick={clearBill}>
								<X className="h-3.5 w-3.5" />
								Clear (Esc)
							</Button>
							<div className="flex items-center gap-2">
								<Button variant="outline" size="sm" onClick={holdBill}>
									<SplitSquareHorizontal className="h-3.5 w-3.5" />
									Hold (F2)
								</Button>
								<Button variant="outline" size="sm" onClick={() => setRecallOpen(true)} disabled={heldBills.length === 0}>
									<History className="h-3.5 w-3.5" />
									Recall ({heldBills.length})
								</Button>
							</div>
						</footer>
					)}
				</section>

				{/* RIGHT: totals + tender */}
				<aside className="flex flex-col gap-2 overflow-y-auto rounded-xl border bg-card p-3">
					<div className="space-y-1 text-sm">
						<Row label="Subtotal" value={formatCurrency(subtotal, currency)} />
						<Row label="Tax" value={formatCurrency(taxTotal, currency)} />
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Discount</span>
							<div className="flex items-center gap-1">
								<Input
									type="number"
									min="0"
									value={discount || ""}
									onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
									className="h-6 w-20 text-right text-xs"
									placeholder="0"
								/>
							</div>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Tip</span>
							<Input
								type="number"
								min="0"
								value={tip || ""}
								onChange={(e) => setTip(Math.max(0, Number(e.target.value) || 0))}
								className="h-6 w-20 text-right text-xs"
								placeholder="0"
							/>
						</div>
						<Separator className="my-2" />
						<div className="flex items-center justify-between">
							<span className="font-semibold">Grand Total</span>
							<span className="text-lg font-bold tabular-nums">{formatCurrency(grandTotal, currency)}</span>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-2 pt-2">
						<Button variant="outline" size="sm" onClick={() => setDiscount(0)} disabled={!discount}>
							<Percent className="h-3.5 w-3.5" />
							Reset discount
						</Button>
						<Button variant="outline" size="sm" onClick={printBill} loading={processing} disabled={items.length === 0}>
							<Printer className="h-3.5 w-3.5" />
							Print (F5)
						</Button>
					</div>

					<div className="grid grid-cols-2 gap-2 pt-1">
						<Button onClick={() => startTender("cash")} disabled={items.length === 0}>
							<Banknote className="h-4 w-4" />
							Cash (F6)
						</Button>
						<Button variant="outline" onClick={() => startTender("upi")} disabled={items.length === 0}>
							<Smartphone className="h-4 w-4" />
							UPI (F7)
						</Button>
					</div>

					{heldBills.length > 0 && (
						<div className="rounded-lg border bg-muted/30 p-2 text-xs">
							<p className="font-medium">{heldBills.length} held bill(s)</p>
							<Button variant="link" size="xs" className="h-5 px-0" onClick={() => setRecallOpen(true)}>
								View / recall →
							</Button>
						</div>
					)}
				</aside>
			</div>

			{/* Sticky footer for mobile */}
			<div className="flex items-center justify-between rounded-xl border bg-violet-600 px-4 py-2 text-white lg:hidden">
				<span className="text-sm font-semibold">{formatCurrency(grandTotal, currency)}</span>
				<Button size="sm" variant="secondary" onClick={() => startTender("cash")} disabled={items.length === 0}>
					Charge
				</Button>
			</div>

			{/* Modals */}
			<ShiftOpen
				open={locked || shiftOpenOpen}
				onOpened={() => {
					setShiftOpenOpen(false);
					refetchShift();
				}}
				dismissable={shiftOpenOpen && !locked}
				onCancel={() => setShiftOpenOpen(false)}
			/>

			<ShiftClose
				open={shiftCloseOpen}
				onClosed={() => {
					setShiftCloseOpen(false);
					refetchShift();
				}}
				onCancel={() => setShiftCloseOpen(false)}
			/>

			<ShiftXReport open={xReportOpen} onClose={() => setXReportOpen(false)} />

			{/* Search dialog */}
			<Dialog open={searchOpen} onOpenChange={setSearchOpen}>
				<DialogContent className="p-0 sm:max-w-md">
					<DialogHeader className="sr-only">
						<DialogTitle>Search items</DialogTitle>
						<DialogDescription>Fuzzy search by name or SKU.</DialogDescription>
					</DialogHeader>
					<Command shouldFilter={false} className="rounded-xl">
						<CommandInput placeholder="Search name or SKU…" value={searchQuery} onValueChange={setSearchQuery} autoFocus />
						<CommandList>
							<CommandEmpty>No items match.</CommandEmpty>
							<CommandGroup heading="Items">
								{filteredMenus.map((m) => (
									<CommandItem
										key={String(m._id)}
										value={String(m._id)}
										onSelect={() => {
											addItem(String(m._id));
											setSearchQuery("");
										}}>
										<span className="flex-1">{m.name}</span>
										<span className="text-xs text-muted-foreground">{formatCurrency(Number(m.price), currency)}</span>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</DialogContent>
			</Dialog>

			{/* Recall dialog */}
			<Dialog open={recallOpen} onOpenChange={setRecallOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Recall a held bill</DialogTitle>
						<DialogDescription>Recall replaces the current bill. Combine merges items into the current bill.</DialogDescription>
					</DialogHeader>
					<ScrollArea className="max-h-72">
						<div className="space-y-2">
							{heldBills.length === 0 ? (
								<p className="py-6 text-center text-sm text-muted-foreground">No held bills.</p>
							) : (
								heldBills.map((h) => (
									<div key={h.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
										<div>
											<p className="font-medium">Table {h.table}</p>
											<p className="text-xs text-muted-foreground">
												{h.items.length} items •{" "}
												{formatCurrency(
													h.items.reduce((s, i) => s + i.price * i.qty, 0),
													currency,
												)}
											</p>
										</div>
										<div className="flex items-center gap-1">
											<Button size="xs" variant="outline" onClick={() => combineBills(h.id)}>
												Combine
											</Button>
											<Button size="xs" onClick={() => recallBill(h.id)}>
												Recall
											</Button>
										</div>
									</div>
								))
							)}
						</div>
					</ScrollArea>
				</DialogContent>
			</Dialog>

			{/* Tender dialog */}
			<Dialog open={!!payMode} onOpenChange={(next) => !next && cancelTender()}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{payMode === "cash" ? (
								<span className="flex items-center gap-2">
									<Banknote className="h-4 w-4" /> Cash tender
								</span>
							) : (
								<span className="flex items-center gap-2">
									<Smartphone className="h-4 w-4" /> UPI payment
								</span>
							)}
						</DialogTitle>
						<DialogDescription>Total: {formatCurrency(grandTotal, currency)}</DialogDescription>
					</DialogHeader>

					{payMode === "cash" ? (
						<form onSubmit={onTender} className="space-y-3">
							<div className="space-y-2">
								<Label htmlFor="tendered">Cash received</Label>
								<Input
									id="tendered"
									type="number"
									min="0"
									step="0.01"
									aria-invalid={!!tenderErrors.tendered}
									{...register("tendered", { valueAsNumber: true })}
								/>
								{tenderErrors.tendered && <p className="text-xs text-destructive">{tenderErrors.tendered.message}</p>}
							</div>
							<div className="flex items-center justify-between rounded-lg border bg-muted/30 p-2 text-sm">
								<span className="text-muted-foreground">Change</span>
								<span className="font-semibold tabular-nums">{formatCurrency(change, currency)}</span>
							</div>
							<div className="grid grid-cols-4 gap-1">
								{[100, 200, 500, 2000].map((preset) => (
									<Button key={preset} type="button" variant="outline" size="sm" onClick={() => resetTender({ tendered: preset })}>
										{formatCurrency(preset, currency)}
									</Button>
								))}
							</div>
							<div className="flex items-center justify-end gap-2">
								<Button type="button" variant="ghost" onClick={cancelTender}>
									Cancel
								</Button>
								<Button type="submit" loading={processing} disabled={Number(tendered || 0) < grandTotal}>
									<CreditCard className="h-4 w-4" />
									Settle
								</Button>
							</div>
						</form>
					) : (
						<div className="space-y-3">
							{upiId ? (
								<>
									<div className="rounded-lg border bg-muted/30 p-2 text-sm">
										<p className="text-xs text-muted-foreground">Pay to</p>
										<p className="font-mono text-sm">{upiId}</p>
									</div>
									<div className="rounded-lg border bg-muted/30 p-2 text-sm">
										<p className="text-xs text-muted-foreground">Amount</p>
										<p className="text-lg font-semibold">{formatCurrency(grandTotal, currency)}</p>
									</div>
									<a
										href={upiDeepLink}
										className="flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">
										<Smartphone className="h-4 w-4" />
										Open UPI app
									</a>
									<Button className="w-full" loading={processing} onClick={() => onTender()}>
										Mark paid
									</Button>
								</>
							) : (
								<div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
									<AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
									<p>No UPI ID configured for this restaurant. Set it in Settings → Business.</p>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Shortcuts overlay */}
			<Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Keyboard shortcuts</DialogTitle>
						<DialogDescription>Press any time to speed up billing.</DialogDescription>
					</DialogHeader>
					<div className="space-y-1.5">
						{SHORTCUTS.map((s) => (
							<div key={s.key} className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">{s.label}</span>
								<kbd className="rounded-md border bg-muted px-1.5 py-0.5 text-[11px] font-medium">{s.key}</kbd>
							</div>
						))}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between">
			<span className="text-muted-foreground">{label}</span>
			<span className="tabular-nums">{value}</span>
		</div>
	);
}
