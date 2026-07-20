import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Accounts, type TAccount } from "#utils/database/models/account";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { hashPassword, verifyPassword } from "#utils/helper/passwordHelper";
import { passwordChangeSchema } from "#utils/helper/validation";

export async function POST(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		const { password, newPassword } = await req.json();

		if (!session) throw { status: 401, message: "Authentication Required" };

		const parsed = passwordChangeSchema.safeParse({ password, newPassword });
		if (!parsed.success) throw { status: 400, message: parsed.error.issues[0]?.message || "Invalid input" };

		const account = await Accounts.findOne<TAccount>({ username: session?.username });

		if (!account) throw { status: 500, message: "Something went wrong" };

		const valid = await verifyPassword(password, account.password);

		if (valid) {
			account.password = await hashPassword(newPassword);
			await account.save();
			return NextResponse.json({ status: 200, message: "Password successfully changed" });
		}

		return NextResponse.json({ status: 403, message: "Password incorrect" });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
