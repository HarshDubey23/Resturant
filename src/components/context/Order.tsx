import noop from "lodash/noop";
import pick from "lodash/pick";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createContext, type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import type { TMenu } from "#utils/database/models/menu";
import type { TOrder } from "#utils/database/models/order";
import { fetcher } from "#utils/helper/common";

const OrderDefault: TOrderInitialType = {
	order: undefined,
	loading: false,
	placeOrder: () => new Promise(noop),
	placingOrder: false,
	cancelOrder: noop,
	cancelingOrder: false,
	loginOpen: false,
	setLoginOpen: noop,
};

export const OrderContext = createContext(OrderDefault);
export const OrderProvider = ({ children }: TOrderProviderProps) => {
	const session = useSession();
	const router = useRouter();
	const authenticated = session.status === "authenticated";
	const { data: order, isLoading: loading, mutate } = useSWR(authenticated ? "/api/order" : null, fetcher, { refreshInterval: 5000 });

	const [placingOrder, setPlacingOrder] = useState(false);
	const [cancelingOrder, setCancelingOrder] = useState(false);
	const [loginOpen, setLoginOpen] = useState(false);

	const placeOrder = async (products: Array<TMenuCustom>, paymentMethod?: string, tip?: number) => {
		setPlacingOrder(true);
		try {
			// 3-E2 addition: optional `tip` (in rupees) is forwarded in the body so the
			// server-side order/place flow (or the payment webhook) can record it on
			// `order.tip`. The field was added to the Order model by 2-C; the recording
			// path is server-side. The parameter is optional so existing callers are
			// unaffected.
			const req = await fetch("/api/order/place", {
				method: "POST",
				body: JSON.stringify({
					products: products.map((product) => pick(product, ["_id", "quantity"])),
					paymentMethod: paymentMethod || "razorpay",
					...(typeof tip === "number" && Number.isFinite(tip) && tip > 0 ? { tip } : {}),
				}),
			});
			const res = await req.json();

			if (!req.ok) {
				toast.error(res?.message || "Failed to place order");
				return;
			}

			if (paymentMethod === "cash") {
				toast.success("Order placed. Pay at the counter when ready.");
			} else {
				toast.success("Order placed successfully!");
			}

			// For online payments, the gateway will redirect back to /order/success.
			// For cash / direct orders, we redirect ourselves so the customer sees the
			// success screen with invoice download + tracking.
			const orderId = res?.order?._id || res?._id || res?.orderId;
			if (paymentMethod === "cash" && orderId) {
				router.push(`/order/success?order_id=${orderId}`);
			}

			await mutate();
		} catch {
			toast.error("Network error. Please try again.");
		} finally {
			setPlacingOrder(false);
		}
	};
	const cancelOrder = async () => {
		setCancelingOrder(true);
		const req = await fetch("/api/order/cancel", { method: "POST" });
		const res = await req.json();

		if (!req.ok) toast.error(res?.message);
		await mutate();
		setCancelingOrder(false);
	};

	useEffect(() => {
		mutate();
	}, [mutate]);

	return (
		<OrderContext.Provider value={{ order, loading, placeOrder, placingOrder, cancelOrder, cancelingOrder, loginOpen, setLoginOpen }}>
			{children}
		</OrderContext.Provider>
	);
};

export type TOrderProviderProps = {
	children?: ReactNode;
};

export type TOrderInitialType = {
	order?: TOrder;
	loading: boolean;
	placeOrder: (products: Array<TMenuCustom>, paymentMethod?: string, tip?: number) => Promise<void>;
	placingOrder: boolean;
	cancelOrder: () => void;
	cancelingOrder: boolean;
	loginOpen: boolean;
	setLoginOpen: (open: boolean) => void;
};
type TMenuCustom = TMenu & { quantity: number };
