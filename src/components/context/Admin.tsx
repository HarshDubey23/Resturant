import noop from "lodash/noop";
import { useSearchParams } from "next/navigation";
import { createContext, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import type { TMenu } from "#utils/database/models/menu";
import type { TOrder } from "#utils/database/models/order";
import type { TProfile } from "#utils/database/models/profile";
import type { TTable } from "#utils/database/models/table";
import { fetcher } from "#utils/helper/common";

const AdminDefault: TAdminInitialType = {
	profile: undefined,
	menus: [],
	tables: [],
	profileLoading: false,
	profileMutate: () => new Promise(noop),
	orderRequest: [],
	orderActive: [],
	orderHistory: [],
	orderAction: () => new Promise(noop),
	orderActionLoading: false,
	orderLoading: false,
	sseStatus: "connecting",
};

const sortByDate = (a: { updatedAt: string | number | Date }, b: { updatedAt: string | number | Date }) =>
	new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

export const AdminContext = createContext(AdminDefault);
export const AdminProvider = ({ children }: TAdminProviderProps) => {
	const params = useSearchParams();
	const _tab = params.get("tab");
	const _subTab = params.get("subTab");
	const { data: { profile, menus = [], tables = [] } = {}, isLoading: profileLoading, mutate: profileMutate } = useSWR("/api/admin", fetcher);
	const { data: orderData = { orders: [] }, isLoading: orderLoading, mutate } = useSWR("/api/admin/order", fetcher, { refreshInterval: 60000 });
	const [orderActionLoading, setOrderActionLoading] = useState(false);
	const [sseStatus, setSseStatus] = useState<"connected" | "connecting" | "reconnecting">("connecting");
	const eventSourceRef = useRef<EventSource | null>(null);

	// SSE with automatic reconnection (exponential backoff capped at 30s).
	// Previously a dropped connection closed silently and the dashboard
	// stopped receiving live orders until a manual refresh — unacceptable in
	// a kitchen during dinner rush. After every reconnect we revalidate to
	// recover any events missed while offline.
	useEffect(() => {
		let retryCount = 0;
		let retryTimer: ReturnType<typeof setTimeout> | null = null;
		let disposed = false;

		const connect = () => {
			if (disposed) return;
			const es = new EventSource("/api/order/stream");
			eventSourceRef.current = es;

			es.onopen = () => {
				retryCount = 0;
				setSseStatus("connected");
				// Recover anything missed during a previous outage.
				mutate();
			};

			es.addEventListener("order", (e: Event) => {
				try {
					const payload = JSON.parse((e as MessageEvent).data);
					if (payload.type === "orders") {
						mutate(payload.data, { revalidate: false });
					}
				} catch {
					mutate();
				}
			});

			es.onerror = () => {
				es.close();
				eventSourceRef.current = null;
				if (disposed) return;
				setSseStatus("reconnecting");
				const delay = Math.min(1000 * 2 ** retryCount, 30000);
				retryCount += 1;
				retryTimer = setTimeout(connect, delay);
			};
		};

		connect();

		return () => {
			disposed = true;
			if (retryTimer) clearTimeout(retryTimer);
			eventSourceRef.current?.close();
			eventSourceRef.current = null;
		};
	}, [mutate]);

	// Classification invariant: an order appears in EXACTLY ONE tab.
	// - Request: active order with at least one product awaiting approval
	// - Active:  active order with every product approved
	// - History: anything not active
	// Previously an order with mixed approval states showed in BOTH Request
	// and Active, causing staff to process the same order twice.
	const orders = orderData?.orders ?? [];
	const { orderRequest, orderActive, orderHistory } =
		orders.reduce?.(
			(acc: { orderRequest: TOrder[]; orderActive: TOrder[]; orderHistory: TOrder[] }, order: TOrder) => {
				if (order.state !== "active") {
					acc.orderHistory.push(order);
				} else if (order.products.some(({ adminApproved }) => !adminApproved)) {
					acc.orderRequest.push(order);
				} else {
					acc.orderActive.push(order);
				}
				return acc;
			},
			{ orderRequest: [], orderActive: [], orderHistory: [] },
		) ?? {};

	[orderRequest, orderActive, orderHistory].forEach((arr) => arr?.sort?.(sortByDate));

	const orderAction = useCallback(
		async (orderID: string, action: TOrderAction) => {
			if (orderActionLoading) return;
			setOrderActionLoading(true);
			try {
				const req = await fetch("/api/admin/order/action", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderID, action }),
			});
				const res = await req.json();
				if (!req.ok) toast.error(res?.message);
				await mutate();
			} finally {
				setOrderActionLoading(false);
			}
		},
		[orderActionLoading, mutate],
	);

	useEffect(() => {
		mutate();
	}, [mutate]);

	return (
		<AdminContext.Provider
			value={{
				profile,
				menus,
				tables,
				profileLoading,
				profileMutate,
				orderRequest,
				orderActive,
				orderHistory,
				orderAction,
				orderActionLoading,
				orderLoading,
				sseStatus,
			}}>
			{children}
		</AdminContext.Provider>
	);
};

export type TAdminProviderProps = {
	children?: ReactNode;
};

export type TAdminInitialType = {
	profile?: TProfile;
	menus: TMenu[];
	tables: TTable[];
	profileLoading: boolean;
	profileMutate: () => Promise<void>;
	orderRequest: TOrder[];
	orderActive: TOrder[];
	orderHistory: TOrder[];
	orderAction: (orderID: string, action: TOrderAction) => Promise<void>;
	orderActionLoading: boolean;
	orderLoading: boolean;
	sseStatus: "connected" | "connecting" | "reconnecting";
};

export type TOrderAction = "accept" | "complete" | "reject" | "rejectOnActive";
