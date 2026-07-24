/** @file Suppliers list + create API. Tenant-scoped vendor master.
 * @phase 2
 * @audit-finding n/a
 */
import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Suppliers } from "#utils/database/models/supplier";
import { CatchNextResponse } from "#utils/helper/common";
import { withPermission } from "#utils/helper/rbac";

export const GET = withPermission("settings.manage", async (_req, session) => {
	try {
		await connectDB();
		const restaurantID = session.username as string;
		const suppliers = await Suppliers.find({ restaurantID }).sort({ name: 1 }).lean();
		return NextResponse.json({ suppliers });
	} catch (err) {
		return CatchNextResponse(err);
	}
});

export const POST = withPermission("settings.manage", async (req, session) => {
	try {
		await connectDB();
		const restaurantID = session.username as string;
		const body = await req.json();
		const { name, phone, gstin, items } = body as {
			name?: string;
			phone?: string;
			gstin?: string;
			items?: string[];
		};

		if (!name) throw { status: 400, message: "name is required" };

		const supplier = await Suppliers.create({
			restaurantID,
			name: name.trim(),
			phone: phone?.trim() || undefined,
			gstin: gstin?.trim().toUpperCase() || undefined,
			items: Array.isArray(items) ? items.map((s) => s.trim()).filter(Boolean) : [],
		});

		return NextResponse.json({ supplier }, { status: 201 });
	} catch (err) {
		return CatchNextResponse(err);
	}
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
