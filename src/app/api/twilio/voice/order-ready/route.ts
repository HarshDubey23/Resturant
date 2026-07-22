import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { Profiles } from "#utils/database/models/profile";
import { generateOrderStatusTwiml } from "#utils/twilio";

/**
 * TwiML endpoint for the outbound "order ready" call. Twilio fetches
 * this URL when the call connects, and we respond with a <Say> block
 * announcing the order status in a synthesized voice.
 *
 * In demo mode (no Twilio configured), outboundCall() never fires, so
 * this endpoint is never hit. But we still need it to exist for prod.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const orderId = url.searchParams.get("orderId");
		const restaurantID = url.searchParams.get("restaurantID");
		if (!orderId || !restaurantID) {
			return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Order ID missing. Goodbye.</Say><Hangup/></Response>`, {
				status: 200,
				headers: { "Content-Type": "application/xml" },
			});
		}

		await connectDB();
		const order = await Orders.findById(orderId).lean();
		const profile = await Profiles.findOne({ restaurantID }).lean().select("name");

		const restaurantName = profile?.name || restaurantID;
		// Derive the highest-priority product status as the order status
		const productStatuses = (order?.products || []).map((p: { kitchenStatus?: string }) => p.kitchenStatus || "pending");
		const status = productStatuses.includes("ready") ? "ready" : productStatuses.includes("preparing") ? "preparing" : "pending";

		const twiml = generateOrderStatusTwiml({
			restaurantName,
			orderId: orderId.slice(-6).toUpperCase(),
			status,
			table: order?.table,
		});

		return new NextResponse(twiml, {
			status: 200,
			headers: { "Content-Type": "application/xml; charset=utf-8" },
		});
	} catch (err) {
		console.error("Twilio order-ready TwiML error:", err);
		return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>An error occurred. Goodbye.</Say><Hangup/></Response>`, {
			status: 200,
			headers: { "Content-Type": "application/xml" },
		});
	}
}
