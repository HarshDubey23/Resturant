/** @file Wastage log endpoint. Pushes a journal entry to `wastage[]`, decrements
 *    the live `currentStock`, and appends to the audit chain so every shrinkage
 *    is tamper-evident. reasonCode is required so the Wastage Log tab can group
 *    by spoilage / breakage / expiry / pilferage / etc.
 * @phase 2
 * @audit-finding n/a
 */
import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Inventory } from "#utils/database/models/inventory";
import { appendAuditChain } from "#utils/helper/auditChain";
import { CatchNextResponse } from "#utils/helper/common";
import { withPermission } from "#utils/helper/rbac";

export const POST = withPermission("settings.manage", async (req, session) => {
	try {
		await connectDB();
		const restaurantID = session.username as string;
		const body = await req.json();

		const { inventoryId, qty, reasonCode, note } = body as {
			inventoryId?: string;
			qty?: number;
			reasonCode?: string;
			note?: string;
		};

		if (!inventoryId || !qty || !reasonCode) {
			throw { status: 400, message: "inventoryId, qty and reasonCode are required" };
		}
		if (qty <= 0) throw { status: 400, message: "qty must be > 0" };

		const authorizedBy = (session.username as string) ?? "unknown";

		const existing = await Inventory.findOne({ _id: inventoryId, restaurantID }).lean();
		if (!existing) throw { status: 404, message: "Inventory item not found" };
		if ((existing.currentStock ?? 0) < Number(qty)) {
			throw { status: 409, message: `Cannot waste ${qty} ${existing.unit}; only ${existing.currentStock} in stock` };
		}

		const updated = await Inventory.findOneAndUpdate(
			{ _id: inventoryId, restaurantID },
			{
				$push: {
					wastage: {
						qty: Number(qty),
						reasonCode: reasonCode.trim(),
						authorizedBy,
						note: note?.trim() || undefined,
						date: new Date(),
					},
				},
				$inc: { currentStock: -Number(qty) },
			},
			{ new: true },
		);

		if (!updated) throw { status: 404, message: "Inventory item not found" };

		await appendAuditChain({
			restaurantID,
			actorRole: (session.role as string) ?? "owner",
			actorId: (session as unknown as { id?: string }).id,
			action: "stock_adjust",
			payload: {
				type: "wastage",
				inventoryId,
				name: updated.name,
				qty: Number(qty),
				reasonCode: reasonCode.trim(),
				note,
				authorizedBy,
				newCurrentStock: updated.currentStock,
			},
		});

		return NextResponse.json({ item: updated });
	} catch (err) {
		return CatchNextResponse(err);
	}
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
