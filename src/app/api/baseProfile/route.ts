import pick from "lodash/pick";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Accounts, type TAccount } from "#utils/database/models/account";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";

const PUBLIC_FIELDS = ["name", "themeColor", "avatar", "address", "description"];
const ADMIN_FIELDS = ["name", "address", "themeColor", "avatar", "email", "phone", "description"];

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		const email = new URL(req.url).searchParams.get("email");
		if (!email) throw { status: 400, message: "Email query parameter is required" };

		await connectDB();
		const account = await Accounts.findOne<TAccount>({ email }).populate("profile");
		if (!account) throw { status: 404, message: "Restaurant not found" };

		const profile = account.profile as unknown as Record<string, unknown>;

		if (session?.role === "admin") {
			return NextResponse.json(pick(profile, ADMIN_FIELDS));
		}

		return NextResponse.json(pick(profile, PUBLIC_FIELDS));
	} catch (err) {
		captureError(err);
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
