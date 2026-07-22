"use client";

import { useCallback } from "react";
import { toast } from "sonner";

declare global {
	interface Window {
		Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
	}
}

interface RazorpayOptions {
	key: string;
	amount: number;
	currency: string;
	name: string;
	description?: string;
	order_id: string;
	image?: string;
	prefill?: {
		name?: string;
		email?: string;
		contact?: string;
	};
	notes?: Record<string, string>;
	theme?: {
		color?: string;
	};
	modal?: {
		ondismiss?: () => void;
	};
	handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
}

interface RazorpayInstance {
	open: () => void;
	on: (event: string, handler: () => void) => void;
	close: () => void;
}

function loadRazorpayScript(): Promise<boolean> {
	return new Promise((resolve) => {
		if (window.Razorpay) {
			resolve(true);
			return;
		}
		const script = document.createElement("script");
		script.src = "https://checkout.razorpay.com/v1/checkout.js";
		script.async = true;
		script.onload = () => resolve(true);
		script.onerror = () => resolve(false);
		document.body.appendChild(script);
	});
}

export function useRazorpay() {
	const initiatePayment = useCallback(async (orderId: string) => {
		const loaded = await loadRazorpayScript();
		if (!loaded) {
			toast.error("Failed to load payment gateway. Please try again.");
			return null;
		}

		const res = await fetch("/api/payment/create-order", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ orderId }),
		});

		if (!res.ok) {
			const error = await res.json();
			toast.error(error?.message || "Failed to initiate payment");
			return null;
		}

		const razorpayOrder = await res.json();

		return new Promise<{ success: boolean; paymentId?: string }>((resolve) => {
			const options: RazorpayOptions = {
				key: razorpayOrder.key,
				amount: razorpayOrder.amount,
				currency: razorpayOrder.currency,
				name: "OrderWorder",
				description: `Order #${orderId.slice(-8)}`,
				order_id: razorpayOrder.orderId,
				theme: { color: "#F97316" },
				handler: async (response) => {
					try {
						const verifyRes = await fetch("/api/payment/verify", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								orderId,
								razorpayOrderId: response.razorpay_order_id,
								razorpayPaymentId: response.razorpay_payment_id,
								razorpaySignature: response.razorpay_signature,
							}),
						});

						if (!verifyRes.ok) {
							toast.error("Payment verification failed. Please contact support.");
							resolve({ success: false });
							return;
						}

						resolve({ success: true, paymentId: response.razorpay_payment_id });
					} catch {
						toast.error("Payment verification failed. Please contact support.");
						resolve({ success: false });
					}
				},
				modal: {
					ondismiss: () => {
						resolve({ success: false });
					},
				},
			};

			const rzp = new window.Razorpay(options);
			rzp.open();
		});
	}, []);

	return { initiatePayment };
}
