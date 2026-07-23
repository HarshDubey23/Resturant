import { z } from "zod";

import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { getRedis } from "#utils/database/redis";
import { captureError } from "#utils/helper/sentryWrapper";

const confirmSchema = z.object({
	token: z.string().min(1, "Token is required"),
	newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export async function POST(req: Request): Promise<Response> {
	try {
		const body = await req.json();
		const parsed = confirmSchema.safeParse(body);
		if (!parsed.success) {
			return Response.json({ message: "Validation failed", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
		}

		const { token, newPassword } = parsed.data;

		const redis = getRedis();
		const stored = await redis.get<string>(`pwd-reset:${token}`);
		if (!stored) {
			return Response.json({ message: "Token not found or expired. Please request a new reset link." }, { status: 400 });
		}

		const tokenData = JSON.parse(stored) as { email: string; name: string };
		const { email } = tokenData;

		await connectDB();
		const account = await Accounts.findOne({ email });
		if (!account) {
			return Response.json({ message: "Account not found" }, { status: 400 });
		}

		account.password = newPassword;
		await account.save(); // pre-save hook will hash the password

		await redis.del(`pwd-reset:${token}`);

		return Response.json({ message: "Password reset successful" });
	} catch (err) {
		captureError(err, { route: "/api/auth/password/reset/confirm" });
		return Response.json({ message: "Internal server error" }, { status: 500 });
	}
}
