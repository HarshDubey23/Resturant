import type mongoose from "mongoose";
import { triggerN8nWorkflow } from "#lib/n8n/client";
import connectDB from "#utils/database/connect";
import { Inventory } from "#utils/database/models/inventory";
import { Recipes } from "#utils/database/models/recipe";
import { captureError } from "#utils/helper/sentryWrapper";

/**
 * Deducts recipe ingredients from stock using atomic, conditional MongoDB
 * updates. Each deduction is a single `findOneAndUpdate` with a
 * `currentStock: { $gte: requiredQty }` guard, so two concurrent orders can
 * never both read the same stock level and oversell. If any ingredient is
 * short, every deduction made so far is compensated (rolled back) and a 409
 * is thrown. This replaces both the read-modify-write pattern and the
 * replica-set-only transaction approach.
 */
export async function deductInventoryForOrder(restaurantID: string, products: Array<{ product: mongoose.Types.ObjectId; quantity: number }>): Promise<string[]> {
	await connectDB();
	const deducted: Array<{ id: string; qty: number }> = [];
	const lowStockIds = new Set<string>();

	try {
		for (const p of products) {
			const recipe = await Recipes.findOne({ menuItem: p.product }).lean();
			if (!recipe) continue;

			for (const ing of recipe.ingredients) {
				const requiredQty = ing.quantity * p.quantity;

				const updated = await Inventory.findOneAndUpdate(
					{ _id: ing.inventoryItem, currentStock: { $gte: requiredQty } },
					{ $inc: { currentStock: -requiredQty } },
					{ new: true },
				);

				if (!updated) {
					const inv = await Inventory.findById(ing.inventoryItem).lean();
					throw {
						status: 409,
						message:
							`Insufficient stock for ingredient: ${inv?.name ?? "unknown"} ` +
							`(have ${inv?.currentStock ?? 0} ${inv?.unit ?? ""}, need ${requiredQty} ${inv?.unit ?? ""})`,
					};
				}

				deducted.push({ id: updated._id.toString(), qty: requiredQty });

				if (updated.currentStock <= updated.reorderLevel) {
					lowStockIds.add(updated._id.toString());
				}
			}
		}
	} catch (err) {
		// Compensating rollback: restore everything deducted so far so a
		// partially-deducted order never leaves inventory inconsistent.
		await Promise.all(deducted.map((d) => Inventory.updateOne({ _id: d.id }, { $inc: { currentStock: d.qty } }))).catch((rollbackErr) =>
			captureError(rollbackErr, { context: "inventory-rollback-failed", restaurantID }),
		);
		throw err;
	}

	for (const id of lowStockIds) {
		triggerN8nWorkflow("inventory.low_stock", { inventoryId: id, restaurantID }).catch((e: unknown) => captureError(e, { context: "n8n low-stock alert failed" }));
	}

	return Array.from(lowStockIds);
}

/**
 * Reverse a previous `deductInventoryForOrder` call by re-adding the same
 * recipe quantities back to stock. Used when an order save/delete fails AFTER
 * a successful deduction — the deduction helper's internal rollback only
 * fires on its own errors (insufficient stock mid-loop), not on downstream
 * failures (e.g. order.save() throwing). Without this, a failed order
 * placement would permanently reduce inventory.
 */
export async function restoreInventoryForOrder(restaurantID: string, products: Array<{ product: mongoose.Types.ObjectId; quantity: number }>): Promise<void> {
	await connectDB();
	for (const p of products) {
		const recipe = await Recipes.findOne({ menuItem: p.product }).lean();
		if (!recipe) continue;
		for (const ing of recipe.ingredients) {
			const restoreQty = ing.quantity * p.quantity;
			await Inventory.updateOne({ _id: ing.inventoryItem }, { $inc: { currentStock: restoreQty } }).catch((e: unknown) =>
				captureError(e, { context: "inventory-restore-failed", restaurantID, inventoryItem: ing.inventoryItem?.toString() }),
			);
		}
	}
}
