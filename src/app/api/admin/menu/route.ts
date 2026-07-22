import { NextResponse } from "next/server";
import { z } from "zod";

import connectDB from "#utils/database/connect";
import { invalidateRestaurantCache } from "#utils/database/helper/account";
import { Menus, type TMenu } from "#utils/database/models/menu";
import { CatchNextResponse } from "#utils/helper/common";
import { withPermission } from "#utils/helper/rbac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const updateMenuItemSchema = z.object({
	itemId: z.string().min(1),
	name: z.string().trim().min(1).max(120).optional(),
	description: z.string().trim().max(500).optional(),
	category: z.string().trim().lowercase().min(1).optional(),
	price: z.number().positive().max(1_000_000).optional(),
	taxPercent: z.number().min(0).max(100).optional(),
	foodType: z.enum(["spicy", "extra-spicy", "sweet"]).optional(),
	veg: z.enum(["veg", "non-veg", "contains-egg"]).optional(),
	image: z.union([z.literal(""), z.string().trim().url()]).optional(),
	trackStock: z.boolean().optional(),
	stockCount: z.number().min(0).nullable().optional(),
	costPrice: z.number().min(0).optional(),
});

/** Update a menu item. Previously the dashboard could only hide items —
 *  editing existed in the UI as dead state with no backing endpoint. */
export const PATCH = withPermission("menu.write", async (req, session) => {
	try {
		await connectDB();
		const body = await req.json();
		const parsed = updateMenuItemSchema.safeParse(body);
		if (!parsed.success) throw { status: 400, message: parsed.error.issues[0]?.message ?? "Invalid request" };

		const { itemId, ...updates } = parsed.data;

		const menuItem = await Menus.findById<TMenu>(itemId);
		if (!menuItem) throw { status: 404, message: `Menu item with id: ${itemId}, not found` };
		if (menuItem.restaurantID !== session.username) throw { status: 403, message: "Access denied. Menu item belongs to another restaurant." };

		// Apply only the provided fields; the schema pre-save hook validates
		// that any new category exists on the restaurant profile.
		for (const [key, value] of Object.entries(updates)) {
			if (value !== undefined) {
				(menuItem as unknown as Record<string, unknown>)[key] = value;
			}
		}

		await menuItem.save();
		await invalidateRestaurantCache(session.username as string);

		return NextResponse.json({ status: 200, message: "Menu item updated", item: menuItem });
	} catch (err) {
		return CatchNextResponse(err);
	}
});
