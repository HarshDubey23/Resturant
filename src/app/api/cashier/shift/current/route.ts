/**
 * @file GET /api/cashier/shift/current — return the current open shift.
 * @phase 2
 * @audit-finding n/a
 *
 * Returns the cashier's open shift, or `{ shift: null }` if no shift is open.
 * Used by the CashierBilling UI to gate the screen behind the ShiftOpen modal.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Shifts, type TShift } from "#utils/database/models/shift";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication required" };

		const restaurantID = (session.username as string) ?? "";
		if (!restaurantID) throw { status: 400, message: "Restaurant username missing from session" };

		await connectDB();

		const account = await Accounts.findOne({ username: restaurantID }).select("_id").lean();
		if (!account) return NextResponse.json({ status: 200, shift: null });

		const shift = await Shifts.findOne<TShift>({ restaurantID, cashierId: account._id, status: "open" }).lean();
		return NextResponse.json({ status: 200, shift });
	} catch (err) {
		captureError(err, { route: "/api/cashier/shift/current" });
		return CatchNextResponse(err);
	}
}
