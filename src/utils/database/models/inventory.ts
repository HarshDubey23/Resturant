import mongoose, { type HydratedDocument } from "mongoose";

const InventorySchema = new mongoose.Schema<TInventory>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true, index: true },
		name: { type: String, trim: true, required: true },
		unit: { type: String, enum: ["g", "kg", "ml", "l", "pcs", "tsp", "tbsp"], required: true },
		currentStock: { type: Number, default: 0, required: true },
		reorderLevel: { type: Number, default: 0, required: true },
		costPerUnit: { type: Number, default: 0, required: true },
		supplier: { type: String, trim: true },
		lastRestockedAt: { type: Date },
	},
	{ timestamps: true },
);

InventorySchema.index({ restaurantID: 1, name: 1 }, { unique: true });

InventorySchema.virtual("isLowStock").get(function () {
	return this.currentStock <= this.reorderLevel;
});

InventorySchema.set("toJSON", { virtuals: true });
InventorySchema.set("toObject", { virtuals: true });

export const Inventory = mongoose.models?.inventory ?? mongoose.model<TInventory>("inventory", InventorySchema);

export type TInventory = HydratedDocument<{
	restaurantID: string;
	name: string;
	unit: "g" | "kg" | "ml" | "l" | "pcs" | "tsp" | "tbsp";
	currentStock: number;
	reorderLevel: number;
	costPerUnit: number;
	supplier?: string;
	lastRestockedAt?: Date;
	isLowStock: boolean;
}>;
