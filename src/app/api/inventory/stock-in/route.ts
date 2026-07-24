/** @file Stock-In / GRN endpoint. Pushes a journal entry to `stockIn[]`,
 *    increments the live `currentStock`, refreshes `costPerUnit` to the latest
 *    purchase rate, and appends an entry to the bill audit chain so every
 *    inward is tamper-evident.
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

		const { inventoryId, qty, rate, supplier, invoiceRef } = body as {
			inventoryId?: string;
			qty?: number;
			rate?: number;
			supplier?: string;
			invoiceRef?: string;
		};

		if (!inventoryId || !qty || !rate) {
			throw { status: 400, message: "inventoryId, qty and rate are required" };
		}
		if (qty <= 0 || rate < 0) {
			throw { status: 400, message: "qty must be > 0 and rate must be >= 0" };
		}

		const receivedBy = (session.username as string) ?? "unknown";
		const updated = await Inventory.findOneAndUpdate(
			{ _id: inventoryId, restaurantID },
			{
				$push: {
					stockIn: {
						qty: Number(qty),
						rate: Number(rate),
						supplier: supplier?.trim() || undefined,
						invoiceRef: invoiceRef?.trim() || undefined,
						receivedBy,
						date: new Date(),
					},
				},
				$inc: { currentStock: Number(qty) },
				$set: {
					costPerUnit: Number(rate),
					lastRestockedAt: new Date(),
					...(supplier ? { supplier: supplier.trim() } : {}),
				},
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
				type: "stock_in",
				inventoryId,
				name: updated.name,
				qty: Number(qty),
				rate: Number(rate),
				supplier,
				invoiceRef,
				receivedBy,
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
