import mongoose, { type HydratedDocument } from "mongoose";

const aggregatorEnum = ["zomato", "swiggy", "manual"] as const;

const AggregatorOrderSchema = new mongoose.Schema<TAggregatorOrder>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true },
		source: { type: String, enum: aggregatorEnum, required: true },
		externalOrderId: { type: String, trim: true },
		customerName: { type: String, trim: true },
		customerPhone: { type: String, trim: true },
		deliveryAddress: { type: String, trim: true },
		items: [
			{
				name: { type: String, required: true },
				quantity: { type: Number, default: 1 },
				price: { type: Number },
			},
		],
		totalAmount: { type: Number },
		status: {
			type: String,
			enum: ["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"],
			default: "pending",
		},
		notes: { type: String, trim: true },
	},
	{ timestamps: true },
);

AggregatorOrderSchema.index({ restaurantID: 1, createdAt: -1 });

export const AggregatorOrders = mongoose.models?.aggregatorOrders ?? mongoose.model<TAggregatorOrder>("aggregatorOrders", AggregatorOrderSchema);

export type TAggregatorOrder = HydratedDocument<{
	restaurantID: string;
	source: (typeof aggregatorEnum)[number];
	externalOrderId: string;
	customerName: string;
	customerPhone: string;
	deliveryAddress: string;
	items: Array<{
		name: string;
		quantity: number;
		price: number;
	}>;
	totalAmount: number;
	status: string;
	notes: string;
}>;
