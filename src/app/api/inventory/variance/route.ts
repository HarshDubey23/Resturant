/** @file Variance report endpoint. Returns the theft-detection variance table
 *    for the given date. The UI's VarianceReport component graphs this.
 * @phase 2
 * @audit-finding n/a
 */
import { NextResponse } from "next/server";

import { computeVariance } from "#utils/database/helper/variance";
import { CatchNextResponse } from "#utils/helper/common";
import { withPermission } from "#utils/helper/rbac";

export const GET = withPermission("analytics.view", async (req, session) => {
	try {
		const { searchParams } = new URL(req.url);
		const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
		const restaurantID = session.username as string;

		const rows = await computeVariance(restaurantID, date);
		return NextResponse.json({ date, rows });
	} catch (err) {
		return CatchNextResponse(err);
	}
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
