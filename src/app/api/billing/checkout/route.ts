import { getServerSession } from "next-auth";
import { z } from "zod";

import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { recordAudit } from "#utils/helper/audit";
import { authOptions } from "#utils/helper/authHelper";
import { rateLimitMiddleware } from "#utils/helper/rateLimit";
import { captureError } from "#utils/helper/sentryWrapper";
import { getStripe } from "#utils/payment/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const checkoutSchema = z.object({
	plan: z.enum(["pro", "enterprise"]),
	interval: z.enum(["month", "year"]).default("month"),
});

/** Price ID lookup: plan + interval → env var key → value.
 *  Currently both month & year use the IN price ID. When yearly-specific
 *  prices are added (env vars STRIPE_PRICE_*_IN_YEAR), this function will
 *  route to the correct one automatically. */
function getPriceId(plan: "pro" | "enterprise", interval: "month" | "year"): string {
	// Look for a yearly-specific price first; fall back to the monthly (IN) price.
	const suffix = interval === "year" ? "IN_YEAR" : "IN";
	const envKey = `STRIPE_PRICE_${plan.toUpperCase()}_${suffix}`;
	const priceId = process.env[envKey];
	if (priceId) return priceId;

	// Fallback: use the standard IN monthly price for both intervals.
	const fallbackKey = `STRIPE_PRICE_${plan.toUpperCase()}_IN`;
	const fallback = process.env[fallbackKey];
	if (!fallback) throw new Error(`Missing Stripe price env var: ${fallbackKey}`);
	return fallback;
}

const PLAN_LIMITS: Record<string, { maxTables: number; maxMenuItems: number }> = {
	pro: { maxTables: 20, maxMenuItems: 200 },
	enterprise: { maxTables: 999999, maxMenuItems: 999999 },
};

export async function POST(req: Request) {
	const ip = req.headers.get("x-forwarded-for") ?? "unknown";
	const rateLimitResponse = await rateLimitMiddleware(`billing-checkout:${ip}`, 10, 60000);
	if (rateLimitResponse) return rateLimitResponse;

	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") {
			return Response.json({ message: "Unauthorized. Admin access required." }, { status: 401 });
		}

		const restaurantID = session.username;
		if (!restaurantID) {
			return Response.json({ message: "Unable to identify tenant" }, { status: 400 });
		}

		const body = await req.json();
		const parsed = checkoutSchema.safeParse(body);
		if (!parsed.success) {
			return Response.json({ message: "Invalid request", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
		}

		const { plan, interval } = parsed.data;

		await connectDB();

		const account = await Accounts.findOne({ username: restaurantID });
		if (!account) {
			return Response.json({ message: "Account not found" }, { status: 404 });
		}

		// Tenant ownership check: session.username must match account.username
		if (account.username !== restaurantID) {
			return Response.json({ message: "Forbidden: tenant mismatch" }, { status: 403 });
		}

		const stripe = getStripe();

		// Create or reuse Stripe Customer
		let customerId = account.stripeCustomerId;
		if (!customerId) {
			const customer = await stripe.customers.create({
				email: account.email,
				name: restaurantID,
				metadata: { restaurantID },
			});
			customerId = customer.id;
			account.stripeCustomerId = customerId;
			await account.save();
		}

		const priceId = getPriceId(plan, interval);

		const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

		const checkoutSession = await stripe.checkout.sessions.create({
			mode: "subscription",
			customer: customerId,
			line_items: [{ price: priceId, quantity: 1 }],
			success_url: `${baseUrl}/dashboard?tab=settings&subTab=billing&checkout=success`,
			cancel_url: `${baseUrl}/dashboard?tab=settings&subTab=billing&checkout=cancelled`,
			metadata: {
				restaurantID,
				plan,
				interval,
				maxTables: String(PLAN_LIMITS[plan].maxTables),
				maxMenuItems: String(PLAN_LIMITS[plan].maxMenuItems),
			},
			subscription_data: {
				metadata: {
					restaurantID,
					plan,
				},
			},
		});

		await recordAudit({
			restaurantID,
			session: { username: session.username as string, role: session.role },
			action: "billing_checkout",
			targetType: "account",
			targetId: account._id.toString(),
			metadata: { plan, interval },
			ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
			userAgent: req.headers.get("user-agent") ?? undefined,
		});

		return Response.json({ url: checkoutSession.url });
	} catch (error) {
		captureError(error, { route: "billing/checkout" });
		return Response.json({ message: "Failed to create checkout session" }, { status: 500 });
	}
}
