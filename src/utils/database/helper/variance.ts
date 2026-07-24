/** @file variance — theft detection. Computes theoretical consumption from
 *    recipe BOM × order-line quantities, actual consumption from inventory
 *    journals, and the variance between them. Positive variance (theoretical >
 *    actual) implies missing stock — i.e. theft or unrecorded wastage. Flagged
 *    items fire `inventory.theft_suspected` to n8n for the daily 11PM report.
 * @phase 2
 * @audit-finding n/a
 */
import type mongoose from "mongoose";
import { triggerN8nWorkflow } from "#lib/n8n/client";
import connectDB from "#utils/database/connect";
import { Inventory } from "#utils/database/models/inventory";
import { Orders } from "#utils/database/models/order";
import { Profiles } from "#utils/database/models/profile";
import { Recipes } from "#utils/database/models/recipe";
import { captureError } from "#utils/helper/sentryWrapper";

type ObjectIdLike = mongoose.Types.ObjectId | string;

export interface TheoreticalConsumptionEntry {
	name: string;
	qty: number;
	unit: string;
}

export type TheoreticalConsumptionMap = Record<string, TheoreticalConsumptionEntry>;

/**
 * Theoretical consumption = Σ(recipeBOM.qty × orderLine.qty) for every order
 * placed on the given date. Reads recipe + orders models, joins menu item _ids
 * to recipes, and aggregates ingredient quantities per inventory item.
 */
export async function computeTheoreticalConsumption(restaurantID: string, date: string): Promise<TheoreticalConsumptionMap> {
	await connectDB();

	const start = new Date(`${date}T00:00:00.000Z`);
	const end = new Date(`${date}T23:59:59.999Z`);

	const orders = await Orders.find({
		restaurantID,
		createdAt: { $gte: start, $lte: end },
		state: { $in: ["active", "complete"] },
	})
		.select("products")
		.lean();

	// Flatten to (menuItem, qty) pairs.
	const lineItems: Array<{ menuItem: ObjectIdLike; qty: number }> = [];
	for (const o of orders) {
		for (const p of o.products ?? []) {
			if (!p.product) continue;
			lineItems.push({ menuItem: p.product as ObjectIdLike, qty: p.quantity ?? 0 });
		}
	}

	if (lineItems.length === 0) return {};

	// Pull recipes for every ordered menu item in one shot.
	const menuItemIds = Array.from(new Set(lineItems.map((l) => l.menuItem.toString())));
	const recipes = await Recipes.find({
		restaurantID,
		menuItem: { $in: menuItemIds },
	}).lean();

	const recipeByMenu = new Map<string, Array<{ inventoryItem: ObjectIdLike; quantity: number }>>();
	for (const r of recipes) {
		recipeByMenu.set(
			(r.menuItem as ObjectIdLike).toString(),
			(r.ingredients ?? []).map((ing: { inventoryItem: ObjectIdLike; quantity?: number }) => ({
				inventoryItem: ing.inventoryItem as ObjectIdLike,
				quantity: ing.quantity ?? 0,
			})),
		);
	}

	// Aggregate.
	const consumption: TheoreticalConsumptionMap = {};
	const inventoryIds = new Set<string>();
	for (const line of lineItems) {
		const ings = recipeByMenu.get(line.menuItem.toString());
		if (!ings) continue;
		for (const ing of ings) {
			const idStr = ing.inventoryItem.toString();
			inventoryIds.add(idStr);
			consumption[idStr] = consumption[idStr] ?? { name: "", qty: 0, unit: "" };
			consumption[idStr].qty += ing.quantity * line.qty;
		}
	}

	// Hydrate inventory metadata so callers get a friendly name + unit.
	if (inventoryIds.size > 0) {
		const inv = await Inventory.find({ _id: { $in: Array.from(inventoryIds) } })
			.select("name unit")
			.lean();
		for (const item of inv) {
			const idStr = item._id.toString();
			if (consumption[idStr]) {
				consumption[idStr].name = item.name;
				consumption[idStr].unit = item.unit;
			}
		}
	}

	return consumption;
}

export interface ActualConsumptionEntry {
	opening: number;
	stockIn: number;
	wastage: number;
	physicalCount: number;
	actual: number;
}

export type ActualConsumptionMap = Record<string, ActualConsumptionEntry>;

/**
 * Actual consumption for the day = openingStock + Σ(stockIn.qty for today) −
 * Σ(wastage.qty for today) − closing physicalCount.qty. The "actual" field is
 * the closing balance implied by the journals — when compared to theoretical
 * consumption, the gap is the theft signal.
 */
export async function computeActualConsumption(restaurantID: string, date: string): Promise<ActualConsumptionMap> {
	await connectDB();

	const start = new Date(`${date}T00:00:00.000Z`);
	const end = new Date(`${date}T23:59:59.999Z`);

	const items = await Inventory.find({ restaurantID }).lean();
	const result: ActualConsumptionMap = {};

	for (const item of items) {
		const idStr = item._id.toString();
		const opening = (item.openingStock as number) ?? 0;
		const stockInToday = (item.stockIn ?? [])
			.filter((s: { date?: Date; qty?: number }) => {
				const d = new Date(s.date ?? 0);
				return d >= start && d <= end;
			})
			.reduce((sum: number, s: { qty?: number }) => sum + (s.qty ?? 0), 0);
		const wastageToday = (item.wastage ?? [])
			.filter((w: { date?: Date; qty?: number }) => {
				const d = new Date(w.date ?? 0);
				return d >= start && d <= end;
			})
			.reduce((sum: number, w: { qty?: number }) => sum + (w.qty ?? 0), 0);
		const lastCount = (item.physicalCount ?? []).slice(-1)[0];
		const closingPhysical = lastCount ? (lastCount.qty ?? 0) : ((item.currentStock as number) ?? 0);

		const actual = opening + stockInToday - wastageToday - closingPhysical;
		result[idStr] = {
			opening,
			stockIn: stockInToday,
			wastage: wastageToday,
			physicalCount: closingPhysical,
			actual,
		};
	}

	return result;
}

export interface VarianceRow {
	inventoryId: string;
	name: string;
	unit: string;
	theoretical: number;
	actual: number;
	varianceQty: number;
	variancePercent: number;
	varianceRupees: number;
	threshold: boolean;
	lastPurchaseRate: number;
}

/**
 * Computes the variance report for the given date. Positive varianceQty
 * (theoretical > actual) = missing stock — i.e. theft or unrecorded wastage.
 * Thresholds come from `profile.settings.varianceThreshold{Percent,Rupees}`.
 */
export async function computeVariance(restaurantID: string, date: string): Promise<VarianceRow[]> {
	await connectDB();

	const [theoretical, actual, profile] = await Promise.all([
		computeTheoreticalConsumption(restaurantID, date),
		computeActualConsumption(restaurantID, date),
		Profiles.findOne({ restaurantID }).lean(),
	]);

	const thresholdPercent = (profile?.settings?.varianceThresholdPercent as number) ?? 3;
	const thresholdRupees = (profile?.settings?.varianceThresholdRupees as number) ?? 500;

	// Pull last purchase rate per inventory item from the most recent stockIn.
	const allInvIds = new Set<string>([...Object.keys(theoretical), ...Object.keys(actual)]);
	const invDocs = await Inventory.find({ _id: { $in: Array.from(allInvIds) } })
		.select("name unit costPerUnit stockIn")
		.lean();
	const invMeta = new Map<string, { name: string; unit: string; rate: number }>();
	for (const inv of invDocs) {
		const lastStockIn = (inv.stockIn ?? []).slice(-1)[0];
		const rate = lastStockIn ? (lastStockIn.rate ?? inv.costPerUnit ?? 0) : (inv.costPerUnit ?? 0);
		invMeta.set(inv._id.toString(), { name: inv.name, unit: inv.unit, rate });
	}

	const rows: VarianceRow[] = [];
	for (const idStr of allInvIds) {
		const t = theoretical[idStr]?.qty ?? 0;
		const a = actual[idStr]?.actual ?? 0;
		const varianceQty = t - a;
		const variancePercent = t > 0 ? (varianceQty / t) * 100 : 0;
		const meta = invMeta.get(idStr);
		const rate = meta?.rate ?? 0;
		const varianceRupees = Math.abs(varianceQty) * rate;
		const threshold = Math.abs(variancePercent) > thresholdPercent || varianceRupees > thresholdRupees;

		rows.push({
			inventoryId: idStr,
			name: meta?.name ?? theoretical[idStr]?.name ?? "Unknown",
			unit: meta?.unit ?? theoretical[idStr]?.unit ?? "",
			theoretical: t,
			actual: a,
			varianceQty,
			variancePercent,
			varianceRupees,
			threshold,
			lastPurchaseRate: rate,
		});
	}

	// Sort: most-flagged first, then by absolute ₹ value descending.
	rows.sort((a, b) => {
		if (a.threshold !== b.threshold) return a.threshold ? -1 : 1;
		return Math.abs(b.varianceRupees) - Math.abs(a.varianceRupees);
	});

	return rows;
}

/**
 * Fires `inventory.theft_suspected` to n8n for every flagged row. Best-effort —
 * a failed dispatch is captured to Sentry but does not block the caller.
 */
export async function dispatchTheftAlert(restaurantID: string, date: string, variances: VarianceRow[]): Promise<void> {
	const flagged = variances.filter((v) => v.threshold);
	if (flagged.length === 0) return;

	const payload = {
		restaurantID,
		date,
		flaggedCount: flagged.length,
		items: flagged.map((v) => ({
			inventoryId: v.inventoryId,
			name: v.name,
			varianceQty: v.varianceQty,
			variancePercent: v.variancePercent,
			varianceRupees: v.varianceRupees,
			theoretical: v.theoretical,
			actual: v.actual,
		})),
	};

	try {
		await triggerN8nWorkflow("inventory.theft_suspected", payload);
	} catch (err) {
		captureError(err, { route: "variance/dispatchTheftAlert", restaurantID, date });
	}
}
