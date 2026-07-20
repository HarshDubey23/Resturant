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
	await this.populate("ingredients.inventoryItem", "costPerUnit");
	this.computedCost = this.ingredients.reduce((sum, ing) => sum + ((ing.inventoryItem as { costPerUnit?: number })?.costPerUnit ?? 0) * ing.quantity, 0);
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
