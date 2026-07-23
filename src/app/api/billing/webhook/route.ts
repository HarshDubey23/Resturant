import type Stripe from "stripe";

import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { captureError } from "#utils/helper/sentryWrapper";
import { verifyStripeWebhookSignature } from "#utils/payment/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Map a Stripe Price ID back to a plan name and its associated limits.
 *  Looks up the env vars dynamically so price IDs can change without code changes. */
function lookupPlanFromPriceId(priceId: string): { plan: "free" | "pro" | "enterprise"; maxTables: number; maxMenuItems: number } | null {
	const priceMap: Record<string, { envKey: string; plan: "pro" | "enterprise"; maxTables: number; maxMenuItems: number }> = {
		[process.env.STRIPE_PRICE_PRO_IN ?? ""]: { envKey: "STRIPE_PRICE_PRO_IN", plan: "pro", maxTables: 20, maxMenuItems: 200 },
		[process.env.STRIPE_PRICE_PRO_USD ?? ""]: { envKey: "STRIPE_PRICE_PRO_USD", plan: "pro", maxTables: 20, maxMenuItems: 200 },
		[process.env.STRIPE_PRICE_ENT_IN ?? ""]: { envKey: "STRIPE_PRICE_ENT_IN", plan: "enterprise", maxTables: 999999, maxMenuItems: 999999 },
		[process.env.STRIPE_PRICE_ENT_USD ?? ""]: { envKey: "STRIPE_PRICE_ENT_USD", plan: "enterprise", maxTables: 999999, maxMenuItems: 999999 },
	};

	return priceMap[priceId] ?? null;
}

const FREE_TIER_LIMITS = { maxTables: 5, maxMenuItems: 20 };

async function handleSubscriptionCreatedOrUpdated(event: Stripe.Event) {
	const subscription = event.data.object as Stripe.Subscription;
	const customerId = subscription.customer as string;

	await connectDB();

	const account = await Accounts.findOne({ stripeCustomerId: customerId });
	if (!account) {
		captureError(new Error(`Account not found for Stripe customer: ${customerId}`), { route: "billing/webhook", event: event.type });
		return;
	}

	// Find the plan from the subscription's price ID
	const priceId = subscription.items.data[0]?.price?.id;
	if (!priceId) {
		captureError(new Error(`No price ID on subscription: ${subscription.id}`), { route: "billing/webhook", event: event.type });
		return;
	}

	const planInfo = lookupPlanFromPriceId(priceId);
	if (!planInfo) {
		captureError(new Error(`Unknown price ID: ${priceId}`), { route: "billing/webhook", event: event.type });
		return;
	}

	account.subscriptionActive = true;
	account.plan = planInfo.plan;
	account.maxTables = planInfo.maxTables;
	account.maxMenuItems = planInfo.maxMenuItems;
	await account.save();
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
	const subscription = event.data.object as Stripe.Subscription;
	const customerId = subscription.customer as string;

	await connectDB();

	const account = await Accounts.findOne({ stripeCustomerId: customerId });
	if (!account) {
		captureError(new Error(`Account not found for Stripe customer: ${customerId}`), { route: "billing/webhook", event: event.type });
		return;
	}

	// Revert to free tier — DO NOT delete tenant data.
	account.subscriptionActive = false;
	account.plan = "free";
	account.maxTables = FREE_TIER_LIMITS.maxTables;
	account.maxMenuItems = FREE_TIER_LIMITS.maxMenuItems;
	await account.save();
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
	const invoice = event.data.object as Stripe.Invoice;
	const customerId = invoice.customer as string;

	await connectDB();

	const account = await Accounts.findOne({ stripeCustomerId: customerId });
	if (!account) {
		captureError(new Error(`Account not found for Stripe customer: ${customerId}`), { route: "billing/webhook", event: event.type });
		return;
	}

	account.subscriptionActive = true;
	await account.save();
}

async function handleInvoicePaymentFailed(event: Stripe.Event) {
	const invoice = event.data.object as Stripe.Invoice;
	const customerId = invoice.customer as string;

	// Log warning but keep current state — don't immediately downgrade.
	captureError(new Error(`Payment failed for Stripe customer: ${customerId}, invoice: ${invoice.id}`), { route: "billing/webhook", event: event.type });
}

// Map event types to handlers
const EVENT_HANDLERS: Record<string, (event: Stripe.Event) => Promise<void>> = {
	"customer.subscription.created": handleSubscriptionCreatedOrUpdated,
	"customer.subscription.updated": handleSubscriptionCreatedOrUpdated,
	"customer.subscription.deleted": handleSubscriptionDeleted,
	"invoice.payment_succeeded": handleInvoicePaymentSucceeded,
	"invoice.payment_failed": handleInvoicePaymentFailed,
};

export async function POST(req: Request) {
	try {
		const body = await req.text();
		const sig = req.headers.get("stripe-signature");
		const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

		if (!sig || !webhookSecret) {
			captureError(new Error("Missing Stripe webhook signature or secret"), { route: "billing/webhook" });
			return Response.json({ message: "Webhook configuration error" }, { status: 400 });
		}

		const event = verifyStripeWebhookSignature(body, sig, webhookSecret);

		const handler = EVENT_HANDLERS[event.type];
		if (handler) {
			await handler(event);
		}

		// Return 200 for all valid webhook events (even unhandled ones)
		return Response.json({ received: true });
	} catch (error) {
		captureError(error, { route: "billing/webhook" });
		return Response.json({ message: "Webhook signature verification failed" }, { status: 400 });
	}
}
