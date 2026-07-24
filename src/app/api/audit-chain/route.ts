/** @file Audit chain list endpoint. Paginated list of billAuditChain entries
 *    for the SettingsAuditChain UI. Supports filtering by billId and a
 *    `summary=true` mode that returns just the head-of-chain summary used by
 *    the GST reconciliation card.
 * @phase 2
 * @audit-finding n/a
 */
import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { BillAuditChains } from "#utils/database/models/billAuditChain";
import { CatchNextResponse } from "#utils/helper/common";
import { requirePermission } from "#utils/helper/rbac";

export async function GET(req: Request) {
	try {
		const session = await requirePermission("settings.manage");
		const restaurantID = session.username as string;
		await connectDB();

		const { searchParams } = new URL(req.url);
		const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
		const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10)));
		const billIdFilter = searchParams.get("billId") || undefined;
		const summary = searchParams.get("summary") === "true";

		if (summary) {
			const head = await BillAuditChains.findOne({ restaurantID }).sort({ sequenceNo: -1 }).lean();
			const total = await BillAuditChains.countDocuments({ restaurantID });
			return NextResponse.json({
				head: head
					? {
							sequenceNo: head.sequenceNo,
							hash: head.hash,
							timestamp: head.timestamp,
							action: head.action,
						}
					: null,
				total,
			});
		}

		const filter: Record<string, unknown> = { restaurantID };
		if (billIdFilter) filter.billId = billIdFilter;

		const skip = (page - 1) * limit;
		const [entries, total] = await Promise.all([
			BillAuditChains.find(filter).sort({ sequenceNo: -1 }).skip(skip).limit(limit).lean(),
			BillAuditChains.countDocuments(filter),
		]);

		return NextResponse.json({
			entries,
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		});
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
