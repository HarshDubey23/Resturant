"use client";
import { Inbox, MousePointerClick } from "lucide-react";

import { type UIEvent, useEffect, useState } from "react";
import { useAdmin } from "#components/context/useContext";
import type { TOrder } from "#utils/database/models/order";
import OrderDetail from "./OrderDetail";
import OrdersCard from "./OrdersCard";

interface OrderRequestsProps {
	onScroll: (event: UIEvent<HTMLDivElement>) => void;
}

export default function OrderRequests({ onScroll }: OrderRequestsProps) {
	const { orderRequest = [], orderAction, orderActionLoading } = useAdmin();
	const [activeCardID, setActiveCardID] = useState<string>();
	const [activeCardData, setActiveCardData] = useState<TOrder>();
	const [rejectCard, setRejectCard] = useState<{ _id: string | null; details: boolean }>({ _id: null, details: false });

	const onOrderAction = async (orderID: string) => {
		if (orderID === rejectCard._id) return await orderAction(orderID, "reject");
		return await orderAction(orderID, "accept");
	};

	useEffect(() => {
		if (orderRequest.length === 0) {
			setActiveCardID(undefined);
			setActiveCardData(undefined);
		} else if (!orderRequest.some(({ _id }) => _id.toString() === activeCardID)) {
			setActiveCardID(orderRequest[0]?._id.toString());
			setActiveCardData(orderRequest[0]);
		}
	}, [activeCardID, orderRequest]);

	return (
		<div className="flex gap-4 h-full">
			<div className="w-72 shrink-0 space-y-2 overflow-auto" onScroll={onScroll}>
				{orderRequest?.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
						<Inbox className="h-8 w-8 text-muted-foreground/40" />
						<p className="text-sm font-medium">No new requests</p>
						<p className="text-xs text-muted-foreground">New orders will appear here</p>
					</div>
				) : (
					orderRequest?.map?.((data) => (
						<OrdersCard
							key={data._id.toString()}
							actions
							data={data}
							action={onOrderAction}
							reject={rejectCard._id === data._id.toString()}
							setReject={setRejectCard}
							active={activeCardID === data._id.toString()}
							busy={orderActionLoading}
							activate={(orderID) => {
								setActiveCardID(orderID);
								setActiveCardData(orderRequest.find((order) => order._id.toString() === orderID));
							}}
						/>
					))
				)}
			</div>
			<div className="flex-1 overflow-auto">
				{!activeCardData ? (
					<div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
						<MousePointerClick className="h-8 w-8 text-muted-foreground/40" />
						<p className="text-sm font-medium">No order selected</p>
						<p className="text-xs text-muted-foreground">Click an order from the list to see details</p>
					</div>
				) : (
					<OrderDetail
						actions
						data={activeCardData}
						action={onOrderAction}
						setReject={setRejectCard}
						busy={orderActionLoading}
						reject={!!(activeCardData && rejectCard._id === activeCardData._id.toString())}
					/>
				)}
			</div>
		</div>
	);
}
