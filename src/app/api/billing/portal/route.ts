import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { authOptions } from "#utils/helper/authHelper";
import { rateLimitMiddleware } from "#utils/helper/rateLimit";
import { captureError } from "#utils/helper/sentryWrapper";
import { getStripe } from "#utils/payment/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	const ip = req.headers.get("x-forwarded-for") ?? "unknown";
	const rateLimitResponse = await rateLimitMiddleware(`billing-portal:${ip}`, 10, 60000);
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

		await connectDB();

		const account = await Accounts.findOne({ username: restaurantID });
		if (!account) {
			return Response.json({ message: "Account not found" }, { status: 404 });
		}

		// Tenant ownership check
		if (account.username !== restaurantID) {
			return Response.json({ message: "Forbidden: tenant mismatch" }, { status: 403 });
		}

		if (!account.stripeCustomerId) {
			return Response.json({ message: "No Stripe customer found. Please subscribe first." }, { status: 400 });
		}

		const stripe = getStripe();
		const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

		const portalSession = await stripe.billingPortal.sessions.create({
			customer: account.stripeCustomerId,
			return_url: `${baseUrl}/dashboard?tab=settings&subTab=billing`,
		});

		return Response.json({ url: portalSession.url });
	} catch (error) {
		captureError(error, { route: "billing/portal" });
		return Response.json({ message: "Failed to create portal session" }, { status: 500 });
	}
}
