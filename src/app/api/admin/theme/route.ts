import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isValidThemeColor } from "xtreme-ui";

import connectDB from "#utils/database/connect";
import { Profiles, type TProfile } from "#utils/database/models/profile";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";
import { themeUpdateSchema } from "#utils/helper/validation";

export async function POST(req: Request) {
	try {
		await connectDB();
		const session = await getServerSession(authOptions);
		const body = await req.json();

		if (!session) throw { status: 401, message: "Authentication Required" };

		const parsed = themeUpdateSchema.safeParse(body);
		if (!parsed.success) throw { status: 400, message: "Valid theme color is required" };

		const { themeColor } = parsed.data;
		if (!isValidThemeColor(themeColor)) throw { status: 400, message: "Valid theme color is required" };

		const profile = await Profiles.findOne<TProfile>({ restaurantID: session?.username });

		if (!profile) throw { status: 500, message: "Something went wrong" };

		profile.themeColor = themeColor;
		await profile.save();

		return NextResponse.json({ status: 200, message: "Theme applied successfully" });
	} catch (err) {
		captureError(err, { route: "/api/admin/theme" });
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
