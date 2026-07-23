import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { AuditLogs } from "#utils/database/models/auditLog";
import { CatchNextResponse } from "#utils/helper/common";
import { withPermission } from "#utils/helper/rbac";

export const GET = withPermission("settings.manage", async (req, session) => {
	try {
		await connectDB();

		const { searchParams } = new URL(req.url);
		const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
		const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10)));
		const actionFilter = searchParams.get("action") || undefined;
		const fromDate = searchParams.get("from") || undefined;
		const toDate = searchParams.get("to") || undefined;

		const restaurantID = session.username as string;

		const filter: Record<string, unknown> = { restaurantID };
		if (actionFilter) filter.action = actionFilter;
		if (fromDate || toDate) {
			const dateFilter: Record<string, unknown> = {};
			if (fromDate) dateFilter.$gte = new Date(fromDate);
			if (toDate) dateFilter.$lte = new Date(toDate);
			filter.createdAt = dateFilter;
		}

		const skip = (page - 1) * limit;

		const [logs, total] = await Promise.all([AuditLogs.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), AuditLogs.countDocuments(filter)]);

		return NextResponse.json({
			logs,
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		});
	} catch (err) {
		return CatchNextResponse(err);
	}
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
