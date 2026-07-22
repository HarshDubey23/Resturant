import { NextResponse } from "next/server";

import { generateInboundTwiml } from "#utils/twilio";

/**
 * Twilio inbound voice webhook. When a customer calls the restaurant's
 * Twilio number, Twilio POSTs the call SID + the number called here.
 *
 * We look up the restaurant by the Twilio number (stored on the
 * account profile's `twilioNumber` field) and respond with TwiML that
 * greets the caller and offers them IVR options.
 *
 * If Twilio isn't configured, we still respond with a generic TwiML
 * greeting so the webhook doesn't 500 in dev/demo mode.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		// The number the caller dialed — we'll use this to look up the
		// restaurant once we add a twilioNumber field to the profile.
		const _calledNumber = formData.get("Called") as string | null;
		void _calledNumber;

		const restaurantName = "our restaurant";
		const greeting = "Thank you for calling. Our hours and menu are available on our website.";

		return new NextResponse(generateInboundTwiml({ restaurantName, greeting }), {
			status: 200,
			headers: { "Content-Type": "application/xml; charset=utf-8" },
		});
	} catch (err) {
		console.error("Twilio IVR webhook error:", err);
		return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>An error occurred. Goodbye.</Say><Hangup/></Response>`, {
			status: 200,
			headers: { "Content-Type": "application/xml" },
		});
	}
}

export async function GET() {
	return NextResponse.json({
		status: 200,
		message: "Twilio IVR webhook endpoint. Configure this URL in your Twilio phone number's voice webhook.",
	});
}
