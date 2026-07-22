import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Accounts, type TAccount } from "#utils/database/models/account";
import { CatchNextResponse } from "#utils/helper/common";
import { verifyPassword } from "#utils/helper/passwordHelper";
import { withPermission } from "#utils/helper/rbac";

export const POST = withPermission("settings.manage", async (req, session) => {
	try {
		await connectDB();
		const { password } = await req.json();

		if (!password) throw { status: 400, message: "Password Required" };

		const account = await Accounts.findOne<TAccount>({ username: session?.username });

		if (!account) throw { status: 500, message: "Something went wrong" };

		if (await verifyPassword(password, account?.password)) return NextResponse.json({ status: 200, message: "Authentication Successful" });

		return NextResponse.json({ status: 403, message: "Password incorrect" });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
