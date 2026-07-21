import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
	if (stripeInstance) return stripeInstance;
	if (!process.env.STRIPE_SECRET_KEY) {
		throw new Error("STRIPE_SECRET_KEY environment variable is required");
	}
	stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
		apiVersion: "2025-02-24.acacia",
		typescript: true,
	});
	return stripeInstance;
}

export async function createStripeCheckoutSession(params: {
	orderId: string;
	restaurantID: string;
	items: Array<{ name: string; quantity: number; price: number; tax: number }>;
	successUrl: string;
	cancelUrl: string;
	currency?: string;
}): Promise<Stripe.Checkout.Session> {
	const stripe = getStripe();

	const lineItems = params.items.map((item) => ({
		price_data: {
			currency: params.currency?.toLowerCase() || "inr",
			product_data: {
				name: item.name,
			},
			unit_amount: Math.round((item.price + item.tax) * 100),
		},
		quantity: item.quantity,
	}));

	return stripe.checkout.sessions.create({
		mode: "payment",
		line_items: lineItems,
		success_url: `${params.successUrl}?order_id=${params.orderId}`,
		cancel_url: params.cancelUrl,
		metadata: {
			orderId: params.orderId,
			restaurantID: params.restaurantID,
		},
	});
}

export function verifyStripeWebhookSignature(payload: string | Buffer, signature: string, endpointSecret: string): Stripe.Event {
	const stripe = getStripe();
	return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
}
