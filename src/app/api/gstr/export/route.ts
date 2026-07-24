/** @file GSTR export endpoint. POST `{ month, type: 'gstr1'|'gstr3b' }` returns
 *    the official JSON shape; `?format=csv` collapses to a flat CSV. Reuse for
 *    the SettingsGST UI preview/download.
 * @phase 2
 * @audit-finding n/a
 */
import { NextResponse } from "next/server";

import { exportGstr1, exportGstr3b, reconcileWithChain } from "#utils/gst/gstrExport";
import { CatchNextResponse } from "#utils/helper/common";
import { requirePermission } from "#utils/helper/rbac";

function toCsv(value: unknown, parentKey = ""): Array<{ key: string; value: string }> {
	const rows: Array<{ key: string; value: string }> = [];
	if (value === null || value === undefined) {
		rows.push({ key: parentKey, value: "" });
		return rows;
	}
	if (typeof value !== "object") {
		rows.push({ key: parentKey, value: String(value) });
		return rows;
	}
	if (Array.isArray(value)) {
		value.forEach((v, i) => {
			rows.push(...toCsv(v, parentKey ? `${parentKey}[${i}]` : `[${i}]`));
		});
		return rows;
	}
	const obj = value as Record<string, unknown>;
	for (const k of Object.keys(obj)) {
		rows.push(...toCsv(obj[k], parentKey ? `${parentKey}.${k}` : k));
	}
	return rows;
}

export async function POST(req: Request) {
	try {
		const session = await requirePermission("analytics.export");
		const restaurantID = session.username as string;
		const url = new URL(req.url);
		const format = url.searchParams.get("format") ?? "json";

		const body = await req.json();
		const { month, type } = body as { month?: string; type?: "gstr1" | "gstr3b" };

		if (!month || !/^\d{4}-\d{2}$/.test(month)) {
			throw { status: 400, message: "month is required in 'YYYY-MM' format" };
		}
		if (type !== "gstr1" && type !== "gstr3b") {
			throw { status: 400, message: "type must be 'gstr1' or 'gstr3b'" };
		}

		const payload = type === "gstr1" ? await exportGstr1(restaurantID, month) : await exportGstr3b(restaurantID, month);
		const reconciliation = await reconcileWithChain(restaurantID, month);

		if (format === "csv") {
			const rows = toCsv({ ...payload, reconciliation });
			const csv = ["key,value", ...rows.map((r) => `"${r.key.replace(/"/g, '""')}","${r.value.replace(/"/g, '""')}"`)].join("\n");
			return new NextResponse(csv, {
				headers: {
					"Content-Type": "text/csv",
					"Content-Disposition": `attachment; filename="gstr-${type}-${month}.csv"`,
				},
			});
		}

		return NextResponse.json({ type, month, payload, reconciliation });
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
