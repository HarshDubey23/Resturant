import { NextResponse } from "next/server";
import { z } from "zod";
import QRCode from "qrcode";

import connectDB from "#utils/database/connect";
import { invalidateRestaurantCache } from "#utils/database/helper/account";
import { Accounts } from "#utils/database/models/account";
import { Tables } from "#utils/database/models/table";
import { CatchNextResponse } from "#utils/helper/common";
import { withPermission } from "#utils/helper/rbac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const addTableSchema = z.object({
	prefix: z.string().trim().max(3).optional().default("T"),
});

/** Add a single new table to the authenticated restaurant.
 *  Picks the next sequential number based on existing tables. */
export const POST = withPermission("settings.manage", async (req, session) => {
	try {
		await connectDB();
		const body = await req.json().catch(() => ({}));
		const parsed = addTableSchema.safeParse(body);
		if (!parsed.success) throw { status: 400, message: parsed.error.issues[0]?.message ?? "Invalid request" };

		const { prefix } = parsed.data;
		const restaurantID = session.username as string;

		const account = await Accounts.findOne({ username: restaurantID });
		if (!account) throw { status: 404, message: "Restaurant not found" };

		// Find the highest existing table number with this prefix
		const existingTables = await Tables.find({ restaurantID }).lean();
		let maxNum = 0;
		for (const t of existingTables) {
			const match = String(t.name).match(new RegExp(`^${prefix}(\\d+)$`));
			if (match) {
				const n = Number(match[1]);
				if (n > maxNum) maxNum = n;
			}
		}
		const nextNum = maxNum + 1;
		const tableName = `${prefix}${nextNum}`;

		// Check plan-based table limit
		const maxTables = account.plan === "enterprise" ? 200 : account.plan === "pro" ? 50 : 10;
		if (existingTables.length >= maxTables) {
			throw { status: 403, message: `You've reached the ${maxTables}-table limit on the ${account.plan ?? "free"} plan. Upgrade to add more.` };
		}

		await Tables.create({
			name: tableName,
			username: tableName,
			restaurantID,
		});

		// Generate QR for immediate display
		const baseUrl = process.env.NEXT_PUBLIC_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
		const tableUrl = `${baseUrl}/${restaurantID}?table=${tableName}`;
		const qr = await QRCode.toDataURL(tableUrl, { width: 400, margin: 2 });

		await invalidateRestaurantCache(restaurantID);

		return NextResponse.json({
			status: 201,
			message: `Table ${tableName} added`,
			table: { name: tableName, username: tableName, qr },
		});
	} catch (err) {
		return CatchNextResponse(err);
	}
});

const deleteTableSchema = z.object({
	tableId: z.string().min(1),
});

/** Delete a table (soft — sets inactive flag, or hard removes if no orders depend on it). */
export const DELETE = withPermission("settings.manage", async (req, session) => {
	try {
		await connectDB();
		const body = await req.json().catch(() => ({}));
		const parsed = deleteTableSchema.safeParse(body);
		if (!parsed.success) throw { status: 400, message: parsed.error.issues[0]?.message ?? "Invalid request" };

		const { tableId } = parsed.data;
		const restaurantID = session.username as string;

		const table = await Tables.findById(tableId);
		if (!table) throw { status: 404, message: "Table not found" };
		if (table.restaurantID !== restaurantID) throw { status: 403, message: "Access denied" };

		await Tables.findByIdAndDelete(tableId);
		await invalidateRestaurantCache(restaurantID);

		return NextResponse.json({ status: 200, message: `Table ${table.name} removed` });
	} catch (err) {
		return CatchNextResponse(err);
	}
});
