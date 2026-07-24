/** @file Audit chain verify endpoint. Walks the chain from genesis to head
 *    and returns the first broken sequence number (or ok:true if intact).
 *    Requires payments.reconcile permission OR admin/owner role.
 * @phase 2
 * @audit-finding n/a
 */
import { NextResponse } from "next/server";

import { verifyAuditChain } from "#utils/helper/auditChain";
import { CatchNextResponse } from "#utils/helper/common";
import { requirePermission } from "#utils/helper/rbac";

export async function GET() {
	try {
		const session = await requirePermission("payments.reconcile");
		const restaurantID = session.username as string;
		const result = await verifyAuditChain(restaurantID);
		return NextResponse.json(result);
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
