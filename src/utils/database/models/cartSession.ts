import mongoose, { type HydratedDocument } from "mongoose";

const CartSessionSchema = new mongoose.Schema<TCartSession>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true },
		customer: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
		table: { type: String },
		items: [
			{
				menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "menus" },
				name: { type: String },
				quantity: { type: Number, default: 1 },
				price: { type: Number },
				specialInstructions: { type: String },
			},
		],
		total: { type: Number, default: 0 },
		abandonedAt: { type: Date },
		recoveredAt: { type: Date },
		convertedToOrder: { type: mongoose.Schema.Types.ObjectId, ref: "orders" },
	},
	{ timestamps: true },
);

CartSessionSchema.index({ restaurantID: 1, customer: 1 });
CartSessionSchema.index({ abandonedAt: 1 }, { sparse: true });

export const CartSessions = mongoose.models?.cartSessions ?? mongoose.model<TCartSession>("cartSessions", CartSessionSchema);

export type TCartSession = HydratedDocument<{
	restaurantID: string;
	customer: mongoose.Types.ObjectId;
	table?: string;
	items: Array<{
		menuItem: mongoose.Types.ObjectId;
		name: string;
		quantity: number;
		price: number;
		specialInstructions?: string;
	}>;
	total: number;
	abandonedAt?: Date;
	recoveredAt?: Date;
	convertedToOrder?: mongoose.Types.ObjectId;
}>;
