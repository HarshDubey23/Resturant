import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { invalidateRestaurantCache } from "#utils/database/helper/account";
import { Menus, type TMenu } from "#utils/database/models/menu";
import { recordAudit } from "#utils/helper/audit";
import { CatchNextResponse } from "#utils/helper/common";
import { withPermission } from "#utils/helper/rbac";

export const POST = withPermission("menu.write", async (req, session) => {
	try {
		await connectDB();
		const { itemId, hidden } = await req.json();

		if (!itemId) throw { status: 400, message: "Menu item id is required" };
		if (hidden === undefined) throw { status: 400, message: "Hidden value required" };

		const menuItem = await Menus.findById<TMenu>(itemId);

		if (!menuItem) throw { status: 404, message: `Menu item with id: ${itemId}, not found` };
		if (menuItem.restaurantID !== session.username) throw { status: 403, message: "Access denied. Menu item belongs to another restaurant." };

		menuItem.hidden = hidden;

		await menuItem.save();
		await invalidateRestaurantCache(session.username as string);

		await recordAudit({
			restaurantID: session.username as string,
			session,
			action: "menu_toggle_visibility",
			targetType: "menu",
			targetId: menuItem._id.toString(),
			metadata: { hidden },
			ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
			userAgent: req.headers.get("user-agent") ?? undefined,
		});

		return NextResponse.json({ status: 200, message: hidden ? "Menu item is now hidden" : "Menu item is now visible to customers" });
	} catch (err) {
		return CatchNextResponse(err);
	}
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
