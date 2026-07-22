import { NextResponse } from "next/server";

/**
 * Twilio IVR gather handler. After the caller presses a digit, Twilio
 * POSTs here with Digits=N. We branch on the digit:
 *   1 — repeat the greeting (redirect back to /api/twilio/voice)
 *   2 — connect the caller to restaurant staff (Twilio <Dial>)
 *
 * In demo mode we just say "you pressed X" and hang up.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		const digits = (formData.get("Digits") as string) || "";

		let twiml: string;
		if (digits === "1") {
			twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect>/api/twilio/voice</Redirect>
</Response>`;
		} else if (digits === "2") {
			const staffNumber = process.env.TWILIO_STAFF_NUMBER;
			if (staffNumber) {
				twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Raveena" language="en-IN">Connecting you to our staff. Please hold.</Say>
  <Dial timeout="30" record="false">${escapeXml(staffNumber)}</Dial>
</Response>`;
			} else {
				twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Raveena" language="en-IN">Our staff is currently unavailable. Please call back later.</Say>
  <Hangup/>
</Response>`;
			}
		} else {
			twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Raveena" language="en-IN">You pressed ${escapeXml(digits)}. That is not a valid option. Goodbye.</Say>
  <Hangup/>
</Response>`;
		}

		return new NextResponse(twiml, {
			status: 200,
			headers: { "Content-Type": "application/xml; charset=utf-8" },
		});
	} catch (err) {
		console.error("Twilio IVR gather error:", err);
		return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>An error occurred. Goodbye.</Say><Hangup/></Response>`, {
			status: 200,
			headers: { "Content-Type": "application/xml" },
		});
	}
}

function escapeXml(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
