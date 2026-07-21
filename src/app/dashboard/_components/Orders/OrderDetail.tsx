"use client";

import { Check, DollarSign, Phone, User, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useAdmin } from "#components/context/useContext";
import type { TMenu } from "#utils/database/models/menu";
import type { TOrder } from "#utils/database/models/order";
import { formatCurrency } from "#utils/helper/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type TMenuCustom = TMenu & { quantity: number };

interface OrderDetailProps {
	data: TOrder;
	actions?: boolean;
	action: (id: string) => void;
	busy: boolean;
	reject: boolean;
	setReject: (props: { _id: string | null; details: boolean }) => void;
}

export default function OrderDetail({ data, actions, busy, reject, setReject, action }: OrderDetailProps) {
	const queryParams = useSearchParams();
	const subTab = queryParams.get("subTab") ?? "";
	const { profile } = useAdmin();
	const currency = profile?.currency || "INR";

	const { approvedItems, requestedItems } = useMemo(
		() => ({
			approvedItems: data.products.filter(({ adminApproved }) => adminApproved),
			requestedItems: data.products.filter(({ adminApproved }) => !adminApproved),
		}),
		[data.products],
	);

	return (
		<div className="space-y-4">
			<div className={reject ? "opacity-60" : ""}>
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-1">
						<h3 className="text-lg font-semibold">{reject ? "Are you sure?" : `Table: ${data.table}`}</h3>
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
								{formatCurrency(data.orderTotal, currency)}
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
						</div>
					)}
				</div>
			</div>

			<Separator />

			<div className="space-y-3">
				{data?.products?.length === 0 ? (
					<p className="text-sm text-muted-foreground py-8 text-center">No items in this order</p>
				) : subTab !== "requests" || !approvedItems.length ? (
					data.products.map((product, i) => <OrderItemCard key={i} item={product as unknown as TMenuCustom} />)
				) : (
					<>
						{approvedItems.length > 0 && (
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Badge variant="secondary">{approvedItems.length}</Badge>
									<span className="text-xs font-medium text-muted-foreground">Approved</span>
								</div>
								{approvedItems.map((product, i) => (
									<OrderItemCard key={i} item={product as unknown as TMenuCustom} />
								))}
							</div>
						)}
						<Separator />
						<div className="space-y-2">
							{requestedItems.map((product, i) => (
								<OrderItemCard key={i} item={product as unknown as TMenuCustom} />
							))}
						</div>
					</>
				)}
			</div>
		</div>
	);
}

function OrderItemCard({ item }: { item: TMenuCustom }) {
	const currency = "INR";
	return (
		<div className="flex items-center justify-between rounded-lg border bg-card/50 p-3">
			<div className="min-w-0 flex-1">
				<p className="text-sm font-medium truncate">{item.name}</p>
				<p className="text-xs text-muted-foreground">
					{formatCurrency(item.price, currency)} × {item.quantity}
				</p>
			</div>
			<div className="text-sm font-semibold shrink-0 ml-2">{formatCurrency(item.price * item.quantity, currency)}</div>
		</div>
	);
}
