import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripeClient(): Promise<Stripe | null> {
	if (!stripePromise) {
		const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
		if (!key) {
			console.error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
			return Promise.resolve(null);
		}
		stripePromise = loadStripe(key);
	}
	return stripePromise;
}

export async function redirectToStripeCheckout(orderId: string): Promise<void> {
	const res = await fetch("/api/payment/stripe/create-checkout", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ orderId }),
	});
	if (!res.ok) throw new Error("Failed to create Stripe Checkout session");
	const { url } = await res.json();
	if (!url) throw new Error("Stripe did not return a checkout URL");
	window.location.href = url;
}
