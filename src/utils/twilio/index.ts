/**
 * Twilio IVR helper. Provides:
 *   - outboundCall() — initiate an outbound IVR call (e.g. order ready
 *     notification) using Twilio's REST API
 *   - generateOrderStatusTwiml() — build a TwiML response for inbound
 *     calls asking "Press 1 to hear your order status"
 *
 * This module is a NO-OP when TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN /
 * TWILIO_FROM_NUMBER are not set, so the rest of the app degrades
 * gracefully to "no IVR" in dev/demo environments.
 */

const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM = process.env.TWILIO_FROM_NUMBER;

export function isTwilioConfigured(): boolean {
	return Boolean(SID && TOKEN && FROM);
}

/**
 * Initiate an outbound IVR call. Returns Twilio's call object on success,
 * or { skipped: true } when Twilio isn't configured.
 */
export async function outboundCall(params: {
	to: string;
	url: string; // TwiML URL Twilio will fetch when the call connects
	timeout?: number;
}): Promise<{ sid?: string; skipped?: boolean; status?: string }> {
	if (!isTwilioConfigured()) {
		console.debug(`[twilio] outbound call to ${params.to} skipped — not configured`);
		return { skipped: true };
	}

	const auth = Buffer.from(`${SID}:${TOKEN}`).toString("base64");
	const body = new URLSearchParams({
		To: params.to,
		From: FROM as string,
		Url: params.url,
		Timeout: String(params.timeout ?? 30),
	});

	const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Calls.json`, {
		method: "POST",
		headers: {
			Authorization: `Basic ${auth}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body,
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Twilio call failed (${res.status}): ${err.slice(0, 200)}`);
	}

	const json = (await res.json()) as { sid: string; status: string };
	return { sid: json.sid, status: json.status };
}

/**
 * Build TwiML for the inbound IVR webhook. When a customer calls the
 * restaurant's Twilio number, this announces a menu + offers a keypress
 * to repeat.
 */
export function generateInboundTwiml(opts: { restaurantName: string; greeting: string; menuUrl?: string }): string {
	const greetingEscaped = escapeXml(opts.greeting);
	const nameEscaped = escapeXml(opts.restaurantName);
	const menu = opts.menuUrl
		? `<Play>${escapeXml(opts.menuUrl)}</Play>`
		: `<Say voice="Polly.Raveena" language="en-IN">Our menu is available online. Please scan the QR code on your table.</Say>`;
	return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="/api/twilio/ivr/gather" method="POST" timeout="10">
    <Say voice="Polly.Raveena" language="en-IN">Welcome to ${nameEscaped}.</Say>
    <Pause length="1"/>
    <Say voice="Polly.Raveena" language="en-IN">${greetingEscaped}</Say>
    <Pause length="1"/>
    ${menu}
    <Say voice="Polly.Raveena" language="en-IN">Press 1 to repeat. Press 2 to speak to our staff.</Say>
  </Gather>
  <Say voice="Polly.Raveena" language="en-IN">We did not receive your input. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

/**
 * Build TwiML for the order-status outbound call. Used by the order
 * ready notification flow.
 */
export function generateOrderStatusTwiml(opts: { restaurantName: string; orderId: string; status: string; table?: string }): string {
	const statusText: Record<string, string> = {
		pending: "your order has been received and is being prepared.",
		preparing: "your order is being prepared now.",
		ready: "your order is ready. Please collect it from the counter.",
		served: "your order has been served. Thank you for dining with us.",
	};
	const msg = statusText[opts.status] ?? `your order status is ${opts.status}.`;
	const tableMsg = opts.table ? `for table ${escapeXml(opts.table)}. ` : "";
	return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Raveena" language="en-IN">
    Hello, this is ${escapeXml(opts.restaurantName)} calling. Order number ${escapeXml(opts.orderId)}, ${tableMsg}${msg}
  </Say>
  <Pause length="1"/>
  <Say voice="Polly.Raveena" language="en-IN">Thank you. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

function escapeXml(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export class NoopTwilioClient {
	async outboundCall(to: string, _url: string) {
		console.debug(`[twilio] outbound call to ${to} skipped — not configured`);
		return { success: true, skipped: true };
	}
}
