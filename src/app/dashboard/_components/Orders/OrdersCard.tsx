"use client";

import { Check, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAdmin } from "#components/context/useContext";
import type { TOrder } from "#utils/database/models/order";
import { formatCurrency } from "#utils/helper/currency";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OrdersCardProps {
	data: TOrder;
	actions?: boolean;
	history?: boolean;
	active?: boolean;
	reject?: boolean;
	setReject?: (props: { _id: string | null; details: boolean }) => void;
	busy?: boolean;
	details?: boolean;
	action?: (id: string) => void;
	showDetails?: (value: boolean) => void;
	activate: (id: string) => void;
}

export default function OrdersCard({ data, actions, history, active, reject, setReject, busy, action, activate }: OrdersCardProps) {
	const queryParams = useSearchParams();
	const subTab = queryParams.get("subTab") ?? "";
	const { profile } = useAdmin();
	const currency = profile?.currency || "INR";
	const tableName = data.table;
	const customerName = `${data?.customer?.fname ?? ""} ${data?.customer?.lname ?? ""}`.trim();

	const handleAction = () => {
		if (!action) return;
		if (subTab === "active") {
			action(reject ? data._id.toString() : data._id.toString());
		} else {
			action(data._id.toString());
		}
	};

	const handleRejectToggle = () => {
		if (!setReject) return;
		setReject({
			_id: !reject ? data._id.toString() : null,
			details: false,
		});
	};

	const isRejectActive = reject && setReject;

	return (
		<div
			onClick={() => {
				if (!active && !history) setReject?.({ _id: null, details: false });
				activate(data._id.toString());
			}}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(data._id.toString()); } }}
			className={cn(
				"w-full rounded-lg border bg-card p-3 text-left transition-all text-sm cursor-pointer",
				active && "ring-1 ring-primary",
				isRejectActive && "ring-1 ring-destructive",
				busy && "opacity-60 pointer-events-none",
			)}>
			<div className="flex items-center justify-between gap-2">
				<div className="min-w-0 flex-1">
					<p className="font-medium truncate">{isRejectActive ? "Are you sure?" : `Table: ${tableName}`}</p>
					<p className="text-xs text-muted-foreground truncate">{isRejectActive ? `Table: ${tableName}` : customerName || "Guest"}</p>
					{data?.products?.length ? (
						<p className="text-xs font-semibold mt-1">{formatCurrency(data?.orderTotal ?? 0, currency)}</p>
					) : (
						<p className="text-xs text-muted-foreground mt-1">No orders yet</p>
					)}
				</div>

				{actions && (
					<div className="flex items-center gap-1 shrink-0">
						{subTab === "active" ? (
							<>
								<Button
									size="xs"
									variant="outline"
									onClick={(e) => {
										e.stopPropagation();
										handleAction();
									}}
									loading={busy}>
									<Check className="h-3 w-3" />
									{reject ? "Yes" : "Complete"}
								</Button>
								{!busy && (
									<Button
										size="xs"
										variant="destructive"
										onClick={(e) => {
											e.stopPropagation();
											handleRejectToggle();
										}}>
										<X className="h-3 w-3" />
										{reject ? "No" : "Cancel"}
									</Button>
								)}
							</>
						) : (
							<>
								<Button
									size="xs"
									variant="default"
									onClick={(e) => {
										e.stopPropagation();
										handleAction();
									}}
									loading={busy}>
									<Check className="h-3 w-3" />
									{reject ? "Yes" : "Accept"}
								</Button>
								{!busy && (
									<Button
										size="xs"
										variant="destructive"
										onClick={(e) => {
											e.stopPropagation();
											handleRejectToggle();
										}}>
										<X className="h-3 w-3" />
										{reject ? "No" : "Reject"}
									</Button>
								)}
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
