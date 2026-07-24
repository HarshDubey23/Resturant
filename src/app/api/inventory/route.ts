/** @file Inventory list + create API. Stock items are tenant-scoped. POST also
 *    accepts an optional openingStock that seeds both `openingStock` and
 *    `currentStock` so the running balance starts correct.
 * @phase 2
 * @audit-finding n/a
 */
import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Inventory } from "#utils/database/models/inventory";
import { CatchNextResponse } from "#utils/helper/common";
import { withPermission } from "#utils/helper/rbac";

export const GET = withPermission("settings.manage", async (_req, session) => {
	try {
		await connectDB();
		const restaurantID = session.username as string;
		const items = await Inventory.find({ restaurantID }).sort({ name: 1 }).lean();
		return NextResponse.json({ items });
	} catch (err) {
		return CatchNextResponse(err);
	}
});

export const POST = withPermission("settings.manage", async (req, session) => {
	try {
		await connectDB();
		const restaurantID = session.username as string;
		const body = await req.json();

		const { name, sku, unit, currentStock, openingStock, reorderLevel, reorderQty, costPerUnit, supplier } =
			body as {
				name?: string;
				sku?: string;
				unit?: string;
				currentStock?: number;
				openingStock?: number;
				reorderLevel?: number;
				reorderQty?: number;
				costPerUnit?: number;
				supplier?: string;
			};

		if (!name || !unit) throw { status: 400, message: "name and unit are required" };

		const open = Number(openingStock ?? 0);
		const live = Number(currentStock ?? open);

		const item = await Inventory.create({
			restaurantID,
			name,
			sku: sku?.trim() || undefined,
			unit,
			openingStock: open,
			currentStock: live,
			reorderLevel: Number(reorderLevel ?? 0),
			reorderQty: Number(reorderQty ?? 0),
			costPerUnit: Number(costPerUnit ?? 0),
			supplier: supplier?.trim() || undefined,
		});

		return NextResponse.json({ item }, { status: 201 });
	} catch (err) {
		return CatchNextResponse(err);
	}
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
