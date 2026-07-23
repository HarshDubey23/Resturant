import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "#utils/database/connect";
import { Orders, type TOrder } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";
import { createStripeCheckoutSession } from "#utils/payment/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const { orderId } = await req.json();
		if (!orderId) throw { status: 400, message: "orderId is required" };

		await connectDB();
		const order = await Orders.findById<TOrder>(orderId);
		if (!order) throw { status: 404, message: "Order not found" };

		// SECURITY: origin validation must not include localhost in production.
		// Only allow origins from NEXT_PUBLIC_URL (set in env) or NEXTAUTH_URL.
		const publicUrl = process.env.NEXT_PUBLIC_URL;
		const authUrl = process.env.NEXTAUTH_URL;
		if (!publicUrl) throw { status: 500, message: "NEXT_PUBLIC_URL not configured" };
		const allowedOrigins = [publicUrl, authUrl].filter(Boolean);
		const origin = req.headers.get("origin");
		if (!origin || !allowedOrigins.some((allowed) => origin.startsWith(allowed || ""))) {
			throw { status: 400, message: "Invalid origin" };
		}
		const checkoutSession = await createStripeCheckoutSession({
			orderId: order._id.toString(),
			restaurantID: order.restaurantID,
			items: order.products.map((p) => ({
				name: ((p as unknown as Record<string, unknown>).name as string) || "Menu Item",
				quantity: p.quantity,
				price: p.price,
				tax: p.tax,
			})),
			successUrl: `${origin}/order/success`,
			cancelUrl: `${origin}/order/cancel`,
		});

		order.paymentGateway = "stripe";
		order.paymentId = checkoutSession.id;
		await order.save();

		return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id });
	} catch (err) {
		captureError(err, { route: "/api/payment/stripe/create-checkout" });
		return CatchNextResponse(err);
	}
}
