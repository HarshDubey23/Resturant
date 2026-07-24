/**
 * @file POST /api/cashier/shift/open — open a new cashier shift.
 * @phase 2
 * @audit-finding n/a
 *
 * Requires auth + role admin/owner/manager/cashier. Creates a `shift` doc
 * with `status: 'open'`, `openedAt: now`, `cashierId`, `cashierName`. Returns
 * 409 if an open shift already exists for this restaurant + cashier. Appends
 * a `create` entry to the billAuditChain for tamper-evidence.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Shifts, type TShift } from "#utils/database/models/shift";
import { appendAuditChain } from "#utils/helper/auditChain";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_ROLES = new Set(["admin", "owner", "manager", "cashier"]);

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication required" };

		const role = (session.role ?? "admin") as string;
		if (!ALLOWED_ROLES.has(role)) throw { status: 403, message: "Forbidden: cashier role required" };

		const body = await req.json();
		const openingCash = Number(body?.openingCash);
		if (!Number.isFinite(openingCash) || openingCash < 0) throw { status: 400, message: "openingCash must be a non-negative number" };

		const restaurantID = (session.username as string) ?? "";
		if (!restaurantID) throw { status: 400, message: "Restaurant username missing from session" };

		await connectDB();

		// The schema's cashierId is an ObjectId ref to accounts. In this codebase
		// the cashier and restaurant admin are the same account (no separate
		// cashier login yet), so we resolve the account _id from the session
		// username.
		const account = await Accounts.findOne({ username: restaurantID }).select("_id").lean();
		if (!account) throw { status: 404, message: "Cashier account not found" };
		const cashierId = account._id;
		const cashierName = (session.email as string) ?? restaurantID;

		const existing = await Shifts.findOne<TShift>({ restaurantID, cashierId, status: "open" });
		if (existing) {
			throw { status: 409, message: "An open shift already exists for this cashier. Close it before opening a new one." };
		}

		const openedAt = new Date();
		const shift = await Shifts.create({
			restaurantID,
			cashierId,
			cashierName,
			openingCash,
			status: "open",
			openedAt,
			countedCash: 0,
			expectedCash: openingCash,
			variance: 0,
			kotCount: 0,
		});

		try {
			await appendAuditChain({
				restaurantID,
				actorRole: role,
				actorId: String(cashierId),
				action: "create",
				payload: { kind: "shift_open", shiftId: String(shift._id), cashierId: String(cashierId), openingCash, openedAt: openedAt.toISOString() },
			});
		} catch (auditErr) {
			captureError(auditErr, { route: "/api/cashier/shift/open", context: "audit chain append failed" });
		}

		return NextResponse.json({ status: 200, shift });
	} catch (err) {
		captureError(err, { route: "/api/cashier/shift/open" });
		return CatchNextResponse(err);
	}
}
