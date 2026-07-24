/** @file Internal daily-summary endpoint. Protected by N8N_WEBHOOK_SECRET via
 *    constant-time HMAC compare. Returns the aggregated daily KPIs the 11PM
 *    WhatsApp report needs: gross/net sales, tax split, payment breakdown,
 *    voids, refunds, low-stock items, theft alerts, shift variance, top items
 *    and new vs returning customers.
 *
 *    Auth accepts EITHER (a) `X-N8N-Signature` = HMAC-SHA256(rawBody, secret)
 *    — the original 2-C scheme, OR (b) `X-N8N-Secret` = the raw secret compared
 *    in constant time — the Phase 3 n8n workflow scheme. Both use timingSafeEqual.
 * @phase 2
 * @audit-finding n/a
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { computeVariance, type VarianceRow } from "#utils/database/helper/variance";
import { Customers } from "#utils/database/models/customer";
import { Inventory } from "#utils/database/models/inventory";
import { Invoices } from "#utils/database/models/invoice";
import { Orders } from "#utils/database/models/order";
import { Shifts } from "#utils/database/models/shift";
import { captureError } from "#utils/helper/sentryWrapper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyHmac(rawBody: string, signature: string, secret: string): boolean {
	if (!signature || !secret) return false;
	const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
	const a = Buffer.from(signature);
	const b = Buffer.from(expected);
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

function verifyRawSecret(headerValue: string, secret: string): boolean {
	if (!headerValue || !secret) return false;
	const a = Buffer.from(headerValue);
	const b = Buffer.from(secret);
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

interface DailySummaryBody {
	restaurantID?: string;
	date?: string;
}

export async function POST(req: Request) {
	const secret = process.env.N8N_WEBHOOK_SECRET ?? "";
	if (!secret) {
		return NextResponse.json({ error: "missing_secret" }, { status: 500 });
	}

	const rawBody = await req.text();
	const signature = req.headers.get("x-n8n-signature") ?? "";
	const rawSecret = req.headers.get("x-n8n-secret") ?? "";

	const hmacOk = verifyHmac(rawBody, signature, secret);
	const rawOk = verifyRawSecret(rawSecret, secret);
	if (!hmacOk && !rawOk) {
		captureError(new Error("Invalid auth on /api/internal/daily-summary"), { route: "internal/daily-summary" });
		return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
	}

	let body: DailySummaryBody;
	try {
		body = JSON.parse(rawBody) as DailySummaryBody;
	} catch {
		return NextResponse.json({ error: "invalid_json" }, { status: 400 });
	}

	const { restaurantID, date: dateStr } = body;
	if (!restaurantID || !dateStr) {
		return NextResponse.json({ error: "restaurantID and date are required" }, { status: 400 });
	}

	await connectDB();

	const start = new Date(`${dateStr}T00:00:00.000Z`);
	const end = new Date(`${dateStr}T23:59:59.999Z`);

	const [orders, invoices, lowStockItems, varianceRows, shifts, customersToday, customersTotal] = await Promise.all([
		Orders.find({
			restaurantID,
			createdAt: { $gte: start, $lte: end },
		}).lean(),
		Invoices.find({
			restaurantID,
			generatedAt: { $gte: start, $lte: end },
		}).lean(),
		Inventory.find({ restaurantID, currentStock: { $lte: 0 } })
			.select("name unit currentStock reorderLevel")
			.lean(),
		computeVariance(restaurantID, dateStr).catch((err: unknown) => {
			captureError(err, { route: "internal/daily-summary/variance", restaurantID, dateStr });
			return [];
		}),
		Shifts.find({
			restaurantID,
			closedAt: { $gte: start, $lte: end },
			status: { $in: ["closed", "flagged"] },
		})
			.select("variance cashierName")
			.lean(),
		Customers.find({ restaurantID, createdAt: { $gte: start, $lte: end } })
			.select("_id")
			.lean(),
		Customers.countDocuments({ restaurantID }),
	]);

	let grossSales = 0;
	let netSales = 0;
	let cgst = 0;
	let sgst = 0;
	let igst = 0;
	let voids = 0;
	let refunds = 0;
	const paymentBreakdown = { cash: 0, upi: 0, card: 0 };
	const itemQtyMap = new Map<string, { name: string; qty: number; revenue: number }>();

	for (const o of orders) {
		grossSales += o.orderTotal ?? 0;
		if (o.state === "cancel") voids += 1;
		if (o.paymentStatus === "refunded" || o.paymentStatus === "partially_refunded") {
			refunds += (o.refundedAmount ?? 0) > 0 ? 1 : 0;
		}
		netSales += Math.max(0, (o.orderTotal ?? 0) - (o.refundedAmount ?? 0));

		const method = o.paymentGateway;
		if (method === "cash") paymentBreakdown.cash += o.orderTotal ?? 0;
		else if (method === "razorpay") paymentBreakdown.upi += o.orderTotal ?? 0;
		else if (method === "stripe") paymentBreakdown.card += o.orderTotal ?? 0;

		for (const p of o.products ?? []) {
			const name = (p as { product?: { name?: string }; name?: string }).name ?? (p as { product?: { name?: string } }).product?.name ?? "Unknown";
			const qty = (p as { quantity?: number }).quantity ?? 0;
			const price = (p as { price?: number }).price ?? 0;
			const key = name;
			const prev = itemQtyMap.get(key) ?? { name, qty: 0, revenue: 0 };
			prev.qty += qty;
			prev.revenue += qty * price;
			itemQtyMap.set(key, prev);
		}
	}

	for (const inv of invoices) {
		cgst += inv.cgst ?? 0;
		sgst += inv.sgst ?? 0;
		igst += inv.igst ?? 0;
	}

	const topItems = Array.from(itemQtyMap.values())
		.sort((a, b) => b.qty - a.qty)
		.slice(0, 5)
		.map((i: { name: string; qty: number; revenue: number }) => ({ name: i.name, qty: i.qty, revenue: i.revenue }));

	const theftAlerts = varianceRows
		.filter((r: VarianceRow) => r.threshold)
		.map((r: VarianceRow) => ({
			name: r.name,
			varianceQty: r.varianceQty,
			varianceRupees: r.varianceRupees,
		}));

	const shiftVariance = shifts.reduce((sum: number, s: { variance?: number }) => sum + (s.variance ?? 0), 0);

	const newCustomers = customersToday.length;
	const returningCustomers = Math.max(0, customersTotal - newCustomers);

	return NextResponse.json({
		restaurantID,
		date: dateStr,
		totalBills: invoices.length,
		grossSales,
		netSales,
		cgst,
		sgst,
		igst,
		paymentBreakdown,
		voids,
		refunds,
		lowStockItems: lowStockItems.map((i: { name?: string; currentStock?: number; unit?: string }) => ({
			name: i.name,
			currentStock: i.currentStock,
			unit: i.unit,
		})),
		theftAlerts,
		shiftVariance,
		topItems,
		newCustomers,
		returningCustomers,
	});
}
