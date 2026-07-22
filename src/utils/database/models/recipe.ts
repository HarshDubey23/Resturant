import mongoose, { type HydratedDocument } from "mongoose";

const RecipeSchema = new mongoose.Schema<TRecipe>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true, index: true },
		menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "menus", required: true, index: true },
		ingredients: [
			{
				inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: "inventory", required: true },
				quantity: { type: Number, required: true },
			},
		],
		computedCost: { type: Number, default: 0 },
	},
	{ timestamps: true },
);

RecipeSchema.index({ restaurantID: 1, menuItem: 1 }, { unique: true });

RecipeSchema.pre("save", async function () {
	const inventoryIds = this.ingredients.map((ing) => ing.inventoryItem);
	const Inventory = mongoose.models?.inventory ?? (await import("#utils/database/models/inventory")).Inventory;
	const items = await Inventory.find({ _id: { $in: inventoryIds } }, "costPerUnit").lean();
	const costMap = new Map(items.map((item: { _id: { toString(): string }; costPerUnit: number }) => [item._id.toString(), item.costPerUnit]));
	this.computedCost = this.ingredients.reduce((sum, ing) => {
		const cost = costMap.get(ing.inventoryItem?.toString() || "") || 0;
		return sum + cost * ing.quantity;
	}, 0);
});

export const Recipes = mongoose.models?.recipes ?? mongoose.model<TRecipe>("recipes", RecipeSchema);

export type TRecipe = HydratedDocument<{
	restaurantID: string;
	menuItem: mongoose.Types.ObjectId;
	ingredients: Array<{
		inventoryItem: mongoose.Types.ObjectId;
		quantity: number;
	}>;
	computedCost: number;
}>;
