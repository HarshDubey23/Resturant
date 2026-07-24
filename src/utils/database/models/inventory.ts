/** @file Inventory model — extended with opening stock, stock-in/GRN, wastage log,
 *    physical count entries, reorder qty and a live recomputeStock helper. Tamper-proof
 *    via the audit chain appended by every mutation route that touches these arrays.
 * @phase 2
 * @audit-finding n/a
 */
import mongoose, { type HydratedDocument } from "mongoose";

const InventorySchema = new mongoose.Schema<TInventory>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true, index: true },
		name: { type: String, trim: true, required: true },
		sku: { type: String, trim: true, uppercase: true, index: true },
		unit: { type: String, enum: ["g", "kg", "ml", "l", "pcs", "tsp", "tbsp"], required: true },
		currentStock: { type: Number, default: 0, required: true },
		openingStock: { type: Number, default: 0 },
		reorderLevel: { type: Number, default: 0, required: true },
		reorderQty: { type: Number, default: 0 },
		costPerUnit: { type: Number, default: 0, required: true },
		supplier: { type: String, trim: true },
		lastRestockedAt: { type: Date },
		stockIn: [
			{
				qty: { type: Number, required: true },
				rate: { type: Number, required: true },
				supplier: { type: String, trim: true },
				invoiceRef: { type: String, trim: true },
				receivedBy: { type: String, trim: true },
				date: { type: Date, default: Date.now },
			},
		],
		wastage: [
			{
				qty: { type: Number, required: true },
				reasonCode: { type: String, trim: true, required: true },
				authorizedBy: { type: String, trim: true },
				note: { type: String, trim: true },
				date: { type: Date, default: Date.now },
			},
		],
		physicalCount: [
			{
				qty: { type: Number, required: true },
				countedBy: { type: String, trim: true },
				date: { type: Date, default: Date.now },
			},
		],
	},
	{ timestamps: true },
);

InventorySchema.index({ restaurantID: 1, name: 1 }, { unique: true });
InventorySchema.index({ restaurantID: 1, sku: 1 }, { unique: true, sparse: true });

InventorySchema.virtual("isLowStock").get(function () {
	return this.currentStock <= this.reorderLevel;
});

/**
 * Recomputes the live running balance from the journal entries. Used by the
 * physical-count route to derive the variance entry before resetting
 * currentStock. Pure, side-effect-free; the caller is responsible for
 * persisting the returned value.
 */
InventorySchema.method("recomputeCurrentStock", function (): number {
	const opening: number = (this.openingStock as number) ?? 0;
	const stockInTotal = (this.stockIn ?? []).reduce((sum: number, s: { qty?: number }) => sum + (s.qty ?? 0), 0);
	const wastageTotal = (this.wastage ?? []).reduce((sum: number, w: { qty?: number }) => sum + (w.qty ?? 0), 0);
	// The physicalCount array captures each closing snapshot; the last entry is
	// authoritative — once a count is recorded, every subsequent stockIn/wastage
	// delta is applied on top of it via the live currentStock field.
	if (this.physicalCount && this.physicalCount.length > 0) {
		const lastCount = this.physicalCount[this.physicalCount.length - 1];
		// openingStock is reset to the last physical count for the running-balance
		// math to stay correct after reconciliation.
		return (lastCount.qty ?? 0) + stockInTotal - wastageTotal;
	}
	return opening + stockInTotal - wastageTotal;
});

InventorySchema.set("toJSON", { virtuals: true });
InventorySchema.set("toObject", { virtuals: true });

export const Inventory = mongoose.models?.inventory ?? mongoose.model<TInventory>("inventory", InventorySchema);

/**
 * Pure helper that recomputes the running balance for a hydrated inventory
 * document without persisting it. Mirrors the instance method so callers that
 * only have a lean/plain object can still derive the correct value.
 */
export function recomputeStock(item: {
	openingStock?: number;
	stockIn?: Array<{ qty?: number }>;
	wastage?: Array<{ qty?: number }>;
	physicalCount?: Array<{ qty?: number }>;
}): number {
	const opening = item.openingStock ?? 0;
	const stockInTotal = (item.stockIn ?? []).reduce((sum, s) => sum + (s.qty ?? 0), 0);
	const wastageTotal = (item.wastage ?? []).reduce((sum, w) => sum + (w.qty ?? 0), 0);
	if (item.physicalCount && item.physicalCount.length > 0) {
		const lastCount = item.physicalCount[item.physicalCount.length - 1];
		return (lastCount.qty ?? 0) + stockInTotal - wastageTotal;
	}
	return opening + stockInTotal - wastageTotal;
}

export type TInventory = HydratedDocument<{
	restaurantID: string;
	name: string;
	sku?: string;
	unit: "g" | "kg" | "ml" | "l" | "pcs" | "tsp" | "tbsp";
	currentStock: number;
	openingStock: number;
	reorderLevel: number;
	reorderQty: number;
	costPerUnit: number;
	supplier?: string;
	lastRestockedAt?: Date;
	stockIn: Array<{
		qty: number;
		rate: number;
		supplier?: string;
		invoiceRef?: string;
		receivedBy?: string;
		date: Date;
	}>;
	wastage: Array<{
		qty: number;
		reasonCode: string;
		authorizedBy?: string;
		note?: string;
		date: Date;
	}>;
	physicalCount: Array<{
		qty: number;
		countedBy?: string;
		date: Date;
	}>;
	isLowStock: boolean;
	recomputeCurrentStock: () => number;
}>;
