import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { invalidateRestaurantCache } from "#utils/database/helper/account";
import { Accounts, type TAccount } from "#utils/database/models/account";
import { Profiles } from "#utils/database/models/profile";
import { CatchNextResponse } from "#utils/helper/common";
import { withPermission } from "#utils/helper/rbac";

export const GET = withPermission("settings.manage", async (_req, session) => {
        try {
                await connectDB();

                const account = await Accounts.findOne<TAccount>({ username: session?.username }).populate("profile").populate("tables").populate("menus").lean();

                if (!account) throw { status: 500, message: "Unable to fetch data" };

                return NextResponse.json({
                        profile: account.profile,
                        menus: account.menus,
                        tables: account.tables,
                });
        } catch (err) {
                return CatchNextResponse(err);
        }
});

export const POST = withPermission("settings.manage", async (req, session) => {
        try {
                await connectDB();
                const body = await req.json();
                const account = await Accounts.findOne<TAccount>({ username: session?.username }).populate("profile");
                if (!account) throw { status: 404, message: "Account not found" };

                const profileData = account.profile as { _id: string } | null;
                if (!profileData) throw { status: 404, message: "Profile not found" };

                const updateFields: Record<string, unknown> = {};
                if (body.name !== undefined) updateFields.name = body.name;
                if (body.description !== undefined) updateFields.description = body.description;
                if (body.address !== undefined) updateFields.address = body.address;
                if (body.phone !== undefined) updateFields.phone = body.phone;
                if (body.gstInclusive !== undefined) updateFields.gstInclusive = body.gstInclusive;
                if (body.gstNumber !== undefined) updateFields.gstNumber = body.gstNumber;
                if (body.upiId !== undefined) updateFields.upiId = body.upiId;
                if (body.currency !== undefined) updateFields.currency = body.currency;
                // Extended by the registration wizard — these fields exist on the
                // Profile model but were not previously writeable through this
                // endpoint. Each is optional so existing callers are unaffected.
                if (Array.isArray(body.categories)) updateFields.categories = body.categories;
                if (typeof body.avatar === "string") updateFields.avatar = body.avatar;
                if (typeof body.cover === "string") updateFields.cover = body.cover;
                if (Array.isArray(body.photos)) updateFields.photos = body.photos;
                if (typeof body.logoUrl === "string") updateFields.logoUrl = body.logoUrl;
                if (typeof body.brandColor === "string") updateFields.brandColor = body.brandColor;

                if (Object.keys(updateFields).length > 0) {
                        await Profiles.findByIdAndUpdate(profileData._id, { $set: updateFields });
                        await invalidateRestaurantCache(session.username as string);
                }

                return NextResponse.json({ status: 200, message: "Profile updated" });
        } catch (err) {
                return CatchNextResponse(err);
        }
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
