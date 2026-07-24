"use client";

import { useState } from "react";
import Image from "next/image";
import {
        ShoppingCart,
        Plus,
        Minus,
        Trash2,
        X,
        UtensilsCrossed,
        ShieldCheck,
        CheckCircle2,
        Sparkles,
} from "lucide-react";
import {
        Sheet,
        SheetContent,
        SheetHeader,
        SheetTitle,
        SheetDescription,
        SheetFooter,
} from "@/components/ui/sheet";
import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCartStore } from "@/lib/cart-store";
import { toast } from "sonner";

const GST_RATE = 0.05;

type CheckoutStep = "form" | "success";

export default function CartDrawer() {
        const isOpen = useCartStore((s) => s.isOpen);
        const setOpen = useCartStore((s) => s.setOpen);
        const items = useCartStore((s) => s.items);
        const updateQty = useCartStore((s) => s.updateQty);
        const removeItem = useCartStore((s) => s.removeItem);
        const clear = useCartStore((s) => s.clear);

        const [confirmClear, setConfirmClear] = useState(false);

        // Checkout dialog state
        const [checkoutOpen, setCheckoutOpen] = useState(false);
        const [step, setStep] = useState<CheckoutStep>("form");
        const [submitting, setSubmitting] = useState(false);
        const [form, setForm] = useState({
                name: "",
                email: "",
                phone: "",
                restaurantName: "",
        });

        const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
        const taxes = Math.round(subtotal * GST_RATE);
        const total = subtotal + taxes;
        const totalItems = items.reduce((sum, i) => sum + i.qty, 0);

        const handleCheckout = () => {
                setStep("form");
                setSubmitting(false);
                setCheckoutOpen(true);
        };

        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                if (submitting) return;

                const name = form.name.trim();
                const email = form.email.trim();
                const phone = form.phone.trim();
                const restaurantName = form.restaurantName.trim();

                if (!name || !email || !phone) {
                        toast.error("Please fill in your name, email, and phone number.");
                        return;
                }

                setSubmitting(true);
                try {
                        const res = await fetch("/api/lead", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                        name,
                                        email,
                                        phone,
                                        restaurantName: restaurantName || undefined,
                                        cartItems: items.map((i) => ({
                                                name: i.name,
                                                qty: i.qty,
                                                price: i.price,
                                        })),
                                        total,
                                        source: "cart_checkout",
                                }),
                        });
                        const data = (await res.json().catch(() => null)) as
                                | { ok?: boolean; error?: string; id?: string }
                                | null;

                        if (!res.ok || !data?.ok) {
                                const msg =
                                        data?.error ||
                                        "Something went wrong. Please try again.";
                                toast.error(msg);
                                setSubmitting(false);
                                return;
                        }

                        toast.success("Request received!", {
                                description:
                                        "Our team will reach out within 24 hours.",
                        });
                        setStep("success");
                        setSubmitting(false);
                } catch {
                        toast.error("Network error. Please check your connection.");
                        setSubmitting(false);
                }
        };

        const handleSuccessClear = () => {
                clear();
                setForm({ name: "", email: "", phone: "", restaurantName: "" });
                setCheckoutOpen(false);
                setStep("form");
                setOpen(false);
        };

        const handleSuccessClose = () => {
                setForm({ name: "", email: "", phone: "", restaurantName: "" });
                setCheckoutOpen(false);
                setStep("form");
        };

        const handleClear = () => {
                clear();
                setConfirmClear(false);
                toast.success("Cart cleared");
        };

        return (
                <>
                        <Sheet open={isOpen} onOpenChange={setOpen}>
                                <SheetContent
                                        side="right"
                                        showCloseButton={false}
                                        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
                                >
                                        {/* Sticky Header */}
                                        <SheetHeader className="sticky top-0 z-10 flex flex-row items-center justify-between gap-2 border-b border-slate-100 bg-white/95 p-4 backdrop-blur">
                                                <div className="flex items-center gap-3">
                                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                                                <ShoppingCart className="h-5 w-5" />
                                                        </span>
                                                        <div className="flex flex-col">
                                                                <SheetTitle className="text-base font-semibold text-slate-900">
                                                                        Your Cart
                                                                </SheetTitle>
                                                                <SheetDescription className="text-xs text-slate-500">
                                                                        {totalItems} {totalItems === 1 ? "item" : "items"}
                                                                </SheetDescription>
                                                        </div>
                                                </div>
                                                <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setOpen(false)}
                                                        aria-label="Close cart"
                                                        className="h-8 w-8 text-slate-500 hover:bg-slate-100"
                                                >
                                                        <X className="h-4 w-4" />
                                                </Button>
                                        </SheetHeader>

                                        {/* Body */}
                                        {items.length === 0 ? (
                                                <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-50">
                                                                <UtensilsCrossed className="h-8 w-8 text-violet-400" />
                                                        </div>
                                                        <div>
                                                                <p className="text-base font-semibold text-slate-800">
                                                                        Your cart is empty
                                                                </p>
                                                                <p className="mt-1 text-sm text-slate-500">
                                                                        Add some delicious dishes to get started.
                                                                </p>
                                                        </div>
                                                        <Button
                                                                onClick={() => setOpen(false)}
                                                                className="rounded-full bg-violet-600 px-6 hover:bg-violet-700"
                                                        >
                                                                Browse menu
                                                        </Button>
                                                </div>
                                        ) : (
                                                <ScrollArea className="flex-1">
                                                        <ul className="divide-y divide-slate-100 p-2">
                                                                {items.map((item) => (
                                                                        <li key={item.id} className="flex gap-3 p-3">
                                                                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-violet-50">
                                                                                        {item.image ? (
                                                                                                <Image
                                                                                                        src={item.image}
                                                                                                        alt={item.name}
                                                                                                        fill
                                                                                                        sizes="64px"
                                                                                                        className="object-cover"
                                                                                                />
                                                                                        ) : (
                                                                                                <div className="flex h-full w-full items-center justify-center">
                                                                                                        <UtensilsCrossed className="h-5 w-5 text-violet-300" />
                                                                                                </div>
                                                                                        )}
                                                                                </div>
                                                                                <div className="flex flex-1 flex-col">
                                                                                        <div className="flex items-start justify-between gap-2">
                                                                                                <p className="text-sm font-semibold leading-snug text-slate-900">
                                                                                                        {item.name}
                                                                                                </p>
                                                                                                <button
                                                                                                        type="button"
                                                                                                        onClick={() => removeItem(item.id)}
                                                                                                        className="text-slate-400 transition-colors hover:text-red-500"
                                                                                                        aria-label={`Remove ${item.name} from cart`}
                                                                                                >
                                                                                                        <X className="h-4 w-4" />
                                                                                                </button>
                                                                                        </div>
                                                                                        <p className="mt-0.5 text-xs text-slate-500">
                                                                                                ₹{item.price} each
                                                                                        </p>
                                                                                        <div className="mt-auto flex items-center justify-between pt-2">
                                                                                                <div className="inline-flex items-center rounded-full border border-slate-200 bg-white">
                                                                                                        <button
                                                                                                                type="button"
                                                                                                                onClick={() => updateQty(item.id, item.qty - 1)}
                                                                                                                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
                                                                                                                aria-label={`Decrease quantity of ${item.name}`}
                                                                                                        >
                                                                                                                <Minus className="h-3.5 w-3.5" />
                                                                                                        </button>
                                                                                                        <span
                                                                                                                className="min-w-[1.5rem] text-center text-sm font-semibold text-slate-800"
                                                                                                                aria-label={`Quantity ${item.qty}`}
                                                                                                        >
                                                                                                                {item.qty}
                                                                                                        </span>
                                                                                                        <button
                                                                                                                type="button"
                                                                                                                onClick={() => updateQty(item.id, item.qty + 1)}
                                                                                                                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
                                                                                                                aria-label={`Increase quantity of ${item.name}`}
                                                                                                        >
                                                                                                                <Plus className="h-3.5 w-3.5" />
                                                                                                        </button>
                                                                                                </div>
                                                                                                <span className="text-sm font-bold text-slate-900">
                                                                                                        ₹{item.qty * item.price}
                                                                                                </span>
                                                                                        </div>
                                                                                </div>
                                                                        </li>
                                                                ))}
                                                        </ul>
                                                </ScrollArea>
                                        )}

                                        {/* Sticky Footer */}
                                        {items.length > 0 && (
                                                <SheetFooter className="gap-3 border-t border-slate-100 bg-white p-4">
                                                        <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between text-slate-600">
                                                                        <span>Subtotal</span>
                                                                        <span className="font-medium text-slate-800">₹{subtotal}</span>
                                                                </div>
                                                                <div className="flex justify-between text-slate-600">
                                                                        <span>GST (5%)</span>
                                                                        <span className="font-medium text-slate-800">₹{taxes}</span>
                                                                </div>
                                                                <Separator className="my-1" />
                                                                <div className="flex justify-between text-base font-bold text-slate-900">
                                                                        <span>Total</span>
                                                                        <span>₹{total}</span>
                                                                </div>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                                {confirmClear ? (
                                                                        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2">
                                                                                <span className="flex-1 text-xs font-medium text-red-700">
                                                                                        Clear all items?
                                                                                </span>
                                                                                <Button
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        onClick={() => setConfirmClear(false)}
                                                                                        className="h-7 text-xs text-slate-600"
                                                                                >
                                                                                        Cancel
                                                                                </Button>
                                                                                <Button
                                                                                        size="sm"
                                                                                        variant="destructive"
                                                                                        onClick={handleClear}
                                                                                        className="h-7 text-xs"
                                                                                >
                                                                                        Yes, clear
                                                                                </Button>
                                                                        </div>
                                                                ) : (
                                                                        <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => setConfirmClear(true)}
                                                                                className="self-start text-xs text-slate-500 hover:text-red-600"
                                                                        >
                                                                                <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear cart
                                                                        </Button>
                                                                )}
                                                                <Button
                                                                        onClick={handleCheckout}
                                                                        className="rounded-xl bg-violet-600 py-3 text-base font-semibold hover:bg-violet-700"
                                                                >
                                                                        Checkout · ₹{total}
                                                                </Button>
                                                                <p className="flex items-center justify-center gap-1 text-xs text-slate-400">
                                                                        <ShieldCheck className="h-3 w-3" /> Secure checkout · UPI, cards
                                                                        &amp; wallets
                                                                </p>
                                                        </div>
                                                </SheetFooter>
                                        )}
                                </SheetContent>
                        </Sheet>

                        {/* Checkout / Lead capture dialog */}
                        <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                                <DialogContent
                                        showCloseButton={!submitting}
                                        className="max-h-[90vh] w-full gap-0 overflow-hidden p-0 sm:max-w-lg"
                                >
                                        {step === "form" ? (
                                                <form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
                                                        <DialogHeader className="border-b border-slate-100 p-5">
                                                                <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                                                                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                                                                <Sparkles className="h-5 w-5" />
                                                                        </span>
                                                                        Almost there!
                                                                </DialogTitle>
                                                                <DialogDescription className="text-sm text-slate-500">
                                                                        Share your details and our team will set up your
                                                                        restaurant on OrderWorder within 24 hours.
                                                                </DialogDescription>
                                                        </DialogHeader>

                                                        <ScrollArea className="flex-1">
                                                                <div className="space-y-5 p-5">
                                                                        {/* Form fields */}
                                                                        <div className="grid gap-3 sm:grid-cols-2">
                                                                                <div className="space-y-1.5 sm:col-span-2">
                                                                                        <Label htmlFor="lead-name" className="text-xs font-medium text-slate-700">
                                                                                                Full name <span className="text-red-500">*</span>
                                                                                        </Label>
                                                                                        <Input
                                                                                                id="lead-name"
                                                                                                type="text"
                                                                                                autoComplete="name"
                                                                                                placeholder="e.g. Priya Sharma"
                                                                                                value={form.name}
                                                                                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                                                                                required
                                                                                                disabled={submitting}
                                                                                        />
                                                                                </div>
                                                                                <div className="space-y-1.5">
                                                                                        <Label htmlFor="lead-email" className="text-xs font-medium text-slate-700">
                                                                                                Email <span className="text-red-500">*</span>
                                                                                        </Label>
                                                                                        <Input
                                                                                                id="lead-email"
                                                                                                type="email"
                                                                                                autoComplete="email"
                                                                                                placeholder="you@restaurant.com"
                                                                                                value={form.email}
                                                                                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                                                                                required
                                                                                                disabled={submitting}
                                                                                        />
                                                                                </div>
                                                                                <div className="space-y-1.5">
                                                                                        <Label htmlFor="lead-phone" className="text-xs font-medium text-slate-700">
                                                                                                Phone <span className="text-red-500">*</span>
                                                                                        </Label>
                                                                                        <Input
                                                                                                id="lead-phone"
                                                                                                type="tel"
                                                                                                autoComplete="tel"
                                                                                                placeholder="+91 98765 43210"
                                                                                                value={form.phone}
                                                                                                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                                                                                required
                                                                                                disabled={submitting}
                                                                                        />
                                                                                </div>
                                                                                <div className="space-y-1.5 sm:col-span-2">
                                                                                        <Label htmlFor="lead-restaurant" className="text-xs font-medium text-slate-700">
                                                                                                Restaurant name{" "}
                                                                                                <span className="font-normal text-slate-400">(optional)</span>
                                                                                        </Label>
                                                                                        <Input
                                                                                                id="lead-restaurant"
                                                                                                type="text"
                                                                                                placeholder="e.g. Spice Route"
                                                                                                value={form.restaurantName}
                                                                                                onChange={(e) => setForm((f) => ({ ...f, restaurantName: e.target.value }))}
                                                                                                disabled={submitting}
                                                                                        />
                                                                                </div>
                                                                        </div>

                                                                        {/* Order summary */}
                                                                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                                                                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                                                        Order summary
                                                                                </p>
                                                                                <ul className="mb-3 space-y-1.5">
                                                                                        {items.map((item) => (
                                                                                                <li
                                                                                                        key={item.id}
                                                                                                        className="flex items-start justify-between gap-2 text-sm"
                                                                                                >
                                                                                                        <span className="flex-1 text-slate-700">
                                                                                                                <span className="font-medium text-slate-900">
                                                                                                                        {item.qty}×
                                                                                                                </span>{" "}
                                                                                                                {item.name}
                                                                                                        </span>
                                                                                                        <span className="shrink-0 font-medium text-slate-700">
                                                                                                                ₹{item.qty * item.price}
                                                                                                        </span>
                                                                                                </li>
                                                                                        ))}
                                                                                        {items.length === 0 && (
                                                                                                <li className="text-sm text-slate-500">
                                                                                                        No items in cart.
                                                                                                </li>
                                                                                        )}
                                                                                </ul>
                                                                                <Separator className="my-2" />
                                                                                <div className="space-y-1 text-sm">
                                                                                        <div className="flex justify-between text-slate-600">
                                                                                                <span>Subtotal</span>
                                                                                                <span className="font-medium text-slate-800">₹{subtotal}</span>
                                                                                        </div>
                                                                                        <div className="flex justify-between text-slate-600">
                                                                                                <span>GST (5%)</span>
                                                                                                <span className="font-medium text-slate-800">₹{taxes}</span>
                                                                                        </div>
                                                                                        <Separator className="my-1.5" />
                                                                                        <div className="flex justify-between text-base font-bold text-slate-900">
                                                                                                <span>Total</span>
                                                                                                <span>₹{total}</span>
                                                                                        </div>
                                                                                </div>
                                                                        </div>

                                                                        <p className="flex items-center gap-1.5 text-xs text-slate-400">
                                                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                                                Your details are safe. We&apos;ll only use them to
                                                                                set up your restaurant.
                                                                        </p>
                                                                </div>
                                                        </ScrollArea>

                                                        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row sm:justify-end">
                                                                <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        onClick={() => setCheckoutOpen(false)}
                                                                        disabled={submitting}
                                                                        className="text-slate-600"
                                                                >
                                                                        Cancel
                                                                </Button>
                                                                <Button
                                                                        type="submit"
                                                                        loading={submitting}
                                                                        className="bg-violet-600 py-2.5 font-semibold hover:bg-violet-700"
                                                                >
                                                                        {submitting ? "Submitting..." : `Request setup · ₹${total}`}
                                                                </Button>
                                                        </div>
                                                </form>
                                        ) : (
                                                <div className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
                                                        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                                                                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-200 opacity-60" />
                                                                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                                <DialogTitle className="text-xl font-semibold text-slate-900">
                                                                        Request received!
                                                                </DialogTitle>
                                                                <DialogDescription className="text-sm text-slate-600">
                                                                        Thanks for your interest in OrderWorder. Our team
                                                                        will contact you within{" "}
                                                                        <span className="font-semibold text-slate-900">24 hours</span>{" "}
                                                                        to set up your restaurant.
                                                                </DialogDescription>
                                                        </div>
                                                        <div className="w-full rounded-xl border border-violet-100 bg-violet-50/60 p-3 text-left">
                                                                <p className="text-xs font-medium uppercase tracking-wider text-violet-600">
                                                                        What happens next
                                                                </p>
                                                                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                                                                        <li>1. We&apos;ll call you on the phone number provided.</li>
                                                                        <li>2. We&apos;ll set up your menu, QR codes, and POS.</li>
                                                                        <li>3. You go live and start taking orders.</li>
                                                                </ul>
                                                        </div>
                                                        <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                                                                <Button
                                                                        onClick={handleSuccessClose}
                                                                        variant="outline"
                                                                        className="flex-1"
                                                                >
                                                                        Keep cart &amp; close
                                                                </Button>
                                                                <Button
                                                                        onClick={handleSuccessClear}
                                                                        className="flex-1 bg-violet-600 hover:bg-violet-700"
                                                                >
                                                                        <Trash2 className="mr-1.5 h-4 w-4" /> Clear cart
                                                                </Button>
                                                        </div>
                                                </div>
                                        )}
                                </DialogContent>
                        </Dialog>
                </>
        );
}
