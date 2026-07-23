"use client";

import { Check, DollarSign, Phone, User, Wallet, X, Utensils as PlateIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "#components/context/useContext";
import type { TMenu } from "#utils/database/models/menu";
import type { TOrder } from "#utils/database/models/order";
import { formatCurrency } from "#utils/helper/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type TMenuCustom = TMenu & { quantity: number; kitchenStatus?: string; veg?: string };

interface OrderDetailProps {
        data: TOrder;
        actions?: boolean;
        action: (id: string) => void;
        busy: boolean;
        reject: boolean;
        setReject: (props: { _id: string | null; details: boolean }) => void;
}

const KITCHEN_STATUS_BADGES: Record<string, { label: string; className: string }> = {
        pending: { label: "Pending", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
        preparing: { label: "Preparing", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
        ready: { label: "Ready", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
        served: { label: "Served", className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" },
};

const PAYMENT_STATUS_BADGES: Record<string, { label: string; className: string }> = {
        pending: { label: "Pending", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
        paid: { label: "Paid", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
        failed: { label: "Failed", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
        refunded: { label: "Refunded", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
};

export default function OrderDetail({ data, actions, busy, reject, setReject, action }: OrderDetailProps) {
        const queryParams = useSearchParams();
        const subTab = queryParams.get("subTab") ?? "";
        const { profile } = useAdmin();
        const currency = profile?.currency || "INR";
        const [settling, setSettling] = useState(false);
        const [settled, setSettled] = useState(false);

        const { approvedItems, requestedItems } = useMemo(
                () => ({
                        approvedItems: data.products.filter(({ adminApproved }) => adminApproved),
                        requestedItems: data.products.filter(({ adminApproved }) => !adminApproved),
                }),
                [data.products],
        );

        const totalWithTax = (data.orderTotal ?? 0) + (data.taxTotal ?? 0);
        const paymentBadge = PAYMENT_STATUS_BADGES[data.paymentStatus ?? "pending"];

        const handleSettle = async () => {
                const ownerVpa = profile?.upiId;
                if (!ownerVpa) {
                        toast.error("Set UPI ID in Business Settings first");
                        return;
                }
                setSettling(true);
                try {
                        const res = await fetch("/api/payment/route/settle", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ orderId: data._id.toString(), amount: totalWithTax, ownerVpa }),
                        });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json?.message || "Settle failed");
                        toast.success("Payout initiated — funds will arrive in your UPI within minutes.");
                        setSettled(true);
                } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Settle failed");
                } finally {
                        setSettling(false);
                }
        };

        return (
                <div className="space-y-4">
                        <div className={reject ? "opacity-60" : ""}>
                                <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-semibold">{reject ? "Are you sure?" : `Table ${data.table}`}</h3>
                                                        {paymentBadge && <Badge className={`text-[10px] px-1.5 py-0.5 h-auto ${paymentBadge.className}`}>{paymentBadge.label}</Badge>}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <User className="h-3 w-3" />
                                                        {data?.customer?.fname} {data?.customer?.lname}
                                                </div>
                                                {data?.customer?.phone && (
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <Phone className="h-3 w-3" />
                                                                {data.customer.phone}
                                                        </div>
                                                )}
                                                {data?.orderTotal != null && (
                                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                                                <DollarSign className="h-3 w-3" />
                                                                {formatCurrency(totalWithTax, currency)}
                                                                {data.taxTotal != null && data.taxTotal > 0 && (
                                                                        <span className="text-[10px] text-muted-foreground font-normal">(incl. GST {formatCurrency(data.taxTotal, currency)})</span>
                                                                )}
                                                        </div>
                                                )}
                                        </div>

                                        {actions && (
                                                <div className="flex items-center gap-2">
                                                        <Button variant="destructive" size="sm" onClick={() => setReject({ _id: !reject ? data._id.toString() : null, details: true })}>
                                                                <X className="h-4 w-4 mr-1" />
                                                                {reject ? "No" : subTab === "active" ? "Cancel" : "Reject"}
                                                        </Button>
                                                        <Button size="sm" loading={busy} onClick={() => action(data._id.toString())}>
                                                                <Check className="h-4 w-4 mr-1" />
                                                                {reject ? "Yes" : subTab === "active" ? "Complete" : "Accept"}
                                                        </Button>
                                                        {data.paymentStatus === "paid" && !settled && (
                                                                <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        loading={settling}
                                                                        onClick={handleSettle}
                                                                        title={`Settle ${formatCurrency(totalWithTax, currency)} to owner UPI`}>
                                                                        <Wallet className="h-4 w-4 mr-1" />
                                                                        Settle
                                                                </Button>
                                                        )}
                                                        {settled && (
                                                                <Badge className="text-[10px] px-1.5 py-0.5 h-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                                        <Wallet className="h-3 w-3 mr-1" />
                                                                        Settled
                                                                </Badge>
                                                        )}
                                                </div>
                                        )}
                                </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                                {data?.products?.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                                                <PlateIcon className="h-8 w-8 text-muted-foreground/40" />
                                                <p className="text-sm text-muted-foreground">No items in this order</p>
                                        </div>
                                ) : subTab !== "requests" || !approvedItems.length ? (
                                        data.products.map((product, i) => <OrderItemCard key={product._id?.toString() ?? i} item={product as unknown as TMenuCustom} currency={currency} />)
                                ) : (
                                        <>
                                                {approvedItems.length > 0 && (
                                                        <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                        <Badge variant="secondary">{approvedItems.length}</Badge>
                                                                        <span className="text-xs font-medium text-muted-foreground">Approved</span>
                                                                </div>
                                                                {approvedItems.map((product, i) => (
                                                                        <OrderItemCard key={product._id?.toString() ?? i} item={product as unknown as TMenuCustom} currency={currency} />
                                                                ))}
                                                        </div>
                                                )}
                                                <Separator />
                                                <div className="space-y-2">
                                                        {requestedItems.map((product, i) => (
                                                                <OrderItemCard key={product._id?.toString() ?? i} item={product as unknown as TMenuCustom} currency={currency} />
                                                        ))}
                                                </div>
                                        </>
                                )}
                        </div>
                </div>
        );
}

function OrderItemCard({ item, currency }: { item: TMenuCustom; currency: string }) {
        const kitchenBadge = KITCHEN_STATUS_BADGES[item.kitchenStatus ?? "pending"];
        const vegType = item.veg === "veg" ? "veg" : item.veg === "non-veg" ? "non-veg" : "egg";
        const VEG_STYLES: Record<string, string> = {
                "veg": "bg-emerald-500",
                "non-veg": "bg-red-500",
                "egg": "bg-yellow-500",
        };
        return (
                <div className="flex items-center justify-between rounded-lg border bg-card/50 p-3 transition-colors hover:bg-accent/30">
                        <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                        <span aria-label={vegType} className={`inline-block h-2.5 w-2.5 rounded-sm border border-foreground/30 ${VEG_STYLES[vegType]}`} />
                                        <p className="text-sm font-medium truncate">{item.name}</p>
                                </div>
                                <p className="text-xs text-muted-foreground tabular-nums">
                                        {formatCurrency(item.price, currency)} × {item.quantity}
                                </p>
                                {kitchenBadge && <Badge className={`text-[9px] px-1.5 py-0 h-auto ${kitchenBadge.className}`}>{kitchenBadge.label}</Badge>}
                        </div>
                        <div className="text-sm font-semibold shrink-0 ml-2 tabular-nums">{formatCurrency(item.price * item.quantity, currency)}</div>
                </div>
        );
}
