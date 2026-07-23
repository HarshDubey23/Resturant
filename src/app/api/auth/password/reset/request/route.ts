import crypto from "node:crypto";

import { z } from "zod";

import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { getRedis } from "#utils/database/redis";
import { sendEmail } from "#utils/email";
import { captureError } from "#utils/helper/sentryWrapper";

const requestSchema = z.object({
	email: z.string().email("A valid email address is required"),
});

const RESET_TTL_SECONDS = 30 * 60; // 30 minutes

export async function POST(req: Request): Promise<Response> {
	try {
		const body = await req.json();
		const parsed = requestSchema.safeParse(body);
		if (!parsed.success) {
			return Response.json({ message: "Validation failed", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
		}

		const { email } = parsed.data;

		await connectDB();
		const account = await Accounts.findOne({ email: email.toLowerCase() }).lean();
		if (!account) {
			// Return success even if account doesn't exist — prevents email enumeration
			return Response.json({ message: "Reset email sent" });
		}

		if (!account.accountActive) {
			return Response.json({ message: "Reset email sent" });
		}

		const token = crypto.randomBytes(32).toString("hex");
		const redis = getRedis();
		await redis.set(`pwd-reset:${token}`, JSON.stringify({ email: account.email, name: account.username }), { ex: RESET_TTL_SECONDS });

		await sendEmail({
			to: account.email,
			template: "password-reset",
			params: { token, name: account.username },
		});

		return Response.json({ message: "Reset email sent" });
	} catch (err) {
		captureError(err, { route: "/api/auth/password/reset/request" });
		return Response.json({ message: "Internal server error" }, { status: 500 });
	}
}
