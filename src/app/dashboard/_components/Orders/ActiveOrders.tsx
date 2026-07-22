"use client";

import { type UIEvent, useEffect, useState } from "react";
import { useAdmin } from "#components/context/useContext";
import type { TOrder } from "#utils/database/models/order";
import OrderDetail from "./OrderDetail";
import OrdersCard from "./OrdersCard";

interface ActiveOrdersProps {
	onScroll: (event: UIEvent<HTMLDivElement>) => void;
}

export default function ActiveOrders({ onScroll }: ActiveOrdersProps) {
	const { orderActive = [], orderAction, orderActionLoading } = useAdmin();
	const [activeCardID, setActiveCardID] = useState<string>();
	const [activeCardData, setActiveCardData] = useState<TOrder>();
	const [rejectCard, setRejectCard] = useState<{ _id: string | null; details: boolean }>({ _id: null, details: false });

	const onOrderAction = async (orderID: string) => {
		if (orderID === rejectCard._id) return await orderAction(orderID, "rejectOnActive");
		return await orderAction(orderID, "complete");
	};

	useEffect(() => {
		if (orderActive?.length === 0) {
			setActiveCardID(undefined);
			setActiveCardData(undefined);
		} else if (!orderActive.some(({ _id }) => _id.toString() === activeCardID)) {
			setActiveCardID(orderActive[0]?._id.toString());
			setActiveCardData(orderActive[0]);
		}
	}, [activeCardID, orderActive]);

	return (
		<div className="flex gap-4 h-full">
			<div className="w-72 shrink-0 space-y-2 overflow-auto" onScroll={onScroll}>
				{orderActive?.length === 0 ? (
					<p className="text-sm text-muted-foreground py-8 text-center">No active orders</p>
				) : (
					orderActive.map((data) => (
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
								setActiveCardData(orderActive.find((order) => order._id.toString() === orderID));
							}}
						/>
					))
				)}
			</div>
			<div className="flex-1 overflow-auto">
				{!activeCardData ? (
					<p className="text-sm text-muted-foreground py-8 text-center">Select an order to view details</p>
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
