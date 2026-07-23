import { NextResponse } from "next/server";
import { isValidThemeColor } from "xtreme-ui";

import connectDB from "#utils/database/connect";
import { invalidateRestaurantCache } from "#utils/database/helper/account";
import { Profiles, type TProfile } from "#utils/database/models/profile";
import { recordAudit } from "#utils/helper/audit";
import { CatchNextResponse } from "#utils/helper/common";
import { withPermission } from "#utils/helper/rbac";
import { captureError } from "#utils/helper/sentryWrapper";
import { themeUpdateSchema } from "#utils/helper/validation";

export const POST = withPermission("settings.manage", async (req, session) => {
	try {
		await connectDB();
		const body = await req.json();

		const parsed = themeUpdateSchema.safeParse(body);
		if (!parsed.success) throw { status: 400, message: "Valid theme color is required" };

		const { themeColor } = parsed.data;
		if (!isValidThemeColor(themeColor)) throw { status: 400, message: "Valid theme color is required" };

		const profile = await Profiles.findOne<TProfile>({ restaurantID: session?.username });

		if (!profile) throw { status: 500, message: "Something went wrong" };

		profile.themeColor = themeColor;
		await profile.save();
		await invalidateRestaurantCache(session.username as string);

		await recordAudit({
			restaurantID: session.username as string,
			session,
			action: "theme_update",
			targetType: "profile",
			targetId: profile._id.toString(),
			metadata: { themeColor },
			ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
			userAgent: req.headers.get("user-agent") ?? undefined,
		});

		return NextResponse.json({ status: 200, message: "Theme applied successfully" });
	} catch (err) {
		captureError(err, { route: "/api/admin/theme" });
		return CatchNextResponse(err);
	}
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
