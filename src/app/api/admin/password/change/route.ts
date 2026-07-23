import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Accounts, type TAccount } from "#utils/database/models/account";
import { recordAudit } from "#utils/helper/audit";
import { CatchNextResponse } from "#utils/helper/common";
import { hashPassword, verifyPassword } from "#utils/helper/passwordHelper";
import { withPermission } from "#utils/helper/rbac";
import { passwordChangeSchema } from "#utils/helper/validation";

export const POST = withPermission("settings.manage", async (req, session) => {
	try {
		await connectDB();
		const { password, newPassword } = await req.json();

		const parsed = passwordChangeSchema.safeParse({ password, newPassword });
		if (!parsed.success) throw { status: 400, message: parsed.error.issues[0]?.message || "Invalid input" };

		const account = await Accounts.findOne<TAccount>({ username: session?.username });

		if (!account) throw { status: 500, message: "Something went wrong" };

		const valid = await verifyPassword(password, account.password);

		if (valid) {
			account.password = await hashPassword(newPassword);
			await account.save();

			await recordAudit({
				restaurantID: session.username as string,
				session,
				action: "password_change",
				targetType: "account",
				targetId: account._id.toString(),
				ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
				userAgent: req.headers.get("user-agent") ?? undefined,
			});

			return NextResponse.json({ status: 200, message: "Password successfully changed" });
		}

		return NextResponse.json({ status: 403, message: "Password incorrect" });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
