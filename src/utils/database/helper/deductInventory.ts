import mongoose from "mongoose";
import { triggerN8nWorkflow } from "#lib/n8n/client";
import { Inventory } from "#utils/database/models/inventory";
import { Recipes } from "#utils/database/models/recipe";
import { captureError } from "#utils/helper/sentryWrapper";

export async function deductInventoryForOrder(restaurantID: string, products: Array<{ product: mongoose.Types.ObjectId; quantity: number }>): Promise<string[]> {
	const session = await mongoose.startSession();
	const lowStockIds: string[] = [];

	try {
		await session.withTransaction(async () => {
			for (const p of products) {
				const recipe = await Recipes.findOne({ menuItem: p.product }).session(session);
				if (!recipe) continue;

				for (const ing of recipe.ingredients) {
					const inv = await Inventory.findById(ing.inventoryItem).session(session);
					if (!inv) continue;

					const requiredQty = ing.quantity * p.quantity;
					if (inv.currentStock < requiredQty) {
						throw {
							status: 409,
							message: `Insufficient stock for ingredient: ${inv.name} ` + `(have ${inv.currentStock} ${inv.unit}, need ${requiredQty} ${inv.unit})`,
						};
					}
					inv.currentStock -= requiredQty;
					await inv.save({ session });

					if (inv.currentStock <= inv.reorderLevel) {
						lowStockIds.push(inv._id.toString());
					}
				}
			}
		});
	} finally {
		await session.endSession();
	}

	for (const id of lowStockIds) {
		triggerN8nWorkflow("inventory.low_stock", { inventoryId: id, restaurantID }).catch((e: unknown) => captureError(e, { context: "n8n low-stock alert failed" }));
	}

	return lowStockIds;
}
