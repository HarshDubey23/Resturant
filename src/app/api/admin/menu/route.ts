import { NextResponse } from "next/server";
import { z } from "zod";

import connectDB from "#utils/database/connect";
import { invalidateRestaurantCache } from "#utils/database/helper/account";
import { Accounts } from "#utils/database/models/account";
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

const createMenuItemSchema = z.object({
        name: z.string().trim().min(1).max(120),
        description: z.string().trim().max(500).optional().default(""),
        category: z.string().trim().min(1),
        price: z.number().positive().max(1_000_000),
        taxPercent: z.number().min(0).max(100).optional().default(5),
        foodType: z.enum(["spicy", "extra-spicy", "sweet"]).optional(),
        veg: z.enum(["veg", "non-veg", "contains-egg"]).optional().default("veg"),
        image: z.union([z.literal(""), z.string().trim().url()]).optional().default(""),
        station: z.enum(["main", "grill", "bar", "pastry"]).optional().default("main"),
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

/** Create a new menu item for the authenticated restaurant. */
export const POST = withPermission("menu.write", async (req, session) => {
        try {
                await connectDB();
                const body = await req.json();
                const parsed = createMenuItemSchema.safeParse(body);
                if (!parsed.success) throw { status: 400, message: parsed.error.issues[0]?.message ?? "Invalid request" };

                const data = parsed.data;

                // Verify category exists on the restaurant profile
                const account = await Accounts.findOne({ username: session.username as string });
                if (!account) throw { status: 404, message: "Restaurant not found" };
                const validCategories = account.profile?.categories ?? [];
                if (!validCategories.includes(data.category)) {
                        throw { status: 400, message: `Invalid category "${data.category}". Add it to your categories first.` };
                }

                // Enforce plan-based menu item limit (default 50)
                const existingCount = await Menus.countDocuments({ restaurantID: session.username as string });
                const maxItems = account.plan === "enterprise" ? 500 : account.plan === "pro" ? 200 : 50;
                if (existingCount >= maxItems) {
                        throw { status: 403, message: `You've reached the ${maxItems}-item limit on the ${account.plan ?? "free"} plan. Upgrade to add more.` };
                }

                const newItem = await Menus.create({
                        restaurantID: session.username as string,
                        name: data.name,
                        description: data.description,
                        category: data.category.toLowerCase(),
                        price: data.price,
                        taxPercent: data.taxPercent,
                        foodType: data.foodType || undefined,
                        veg: data.veg,
                        image: data.image || undefined,
                        station: data.station,
                        hidden: false,
                        rating: 0,
                        reviewCount: 0,
                });

                await invalidateRestaurantCache(session.username as string);

                return NextResponse.json({ status: 201, message: "Menu item created", item: newItem });
        } catch (err) {
                return CatchNextResponse(err);
        }
});
