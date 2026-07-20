import mongoose, { type HydratedDocument } from "mongoose";

import type { TCustomer } from "./customer";
import type { TMenu } from "./menu";

const orderState = ["active", "reject", "cancel", "complete"] as const;
const paymentStatus = ["pending", "paid", "failed", "refunded", "partially_refunded"] as const;

const OrderSchema = new mongoose.Schema<TOrder>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true },
		table: { type: String, trim: true, lowercase: true, required: true },
		customer: { type: mongoose.Schema.Types.ObjectId, ref: "customers" },
		state: { type: String, trim: true, lowercase: true, enum: orderState, default: "active" },
		paymentStatus: { type: String, trim: true, lowercase: true, enum: paymentStatus, default: "pending" },
		paymentId: { type: String, trim: true },
		paymentGateway: { type: String, enum: ["razorpay", "stripe", "cash"], default: "razorpay" },
		orderTotal: { type: Number },
		taxTotal: { type: Number },
		refundedAmount: { type: Number, default: 0 },
		n8nEventId: { type: String, index: true },
		invoiceNumber: { type: String, index: true },
		cartSnapshot: {
			items: [
				{
					name: String,
					price: Number,
					tax: Number,
					quantity: Number,
					veg: String,
				},
			],
			subtotal: Number,
			taxTotal: Number,
			grandTotal: Number,
		},
		settledAt: { type: Date },
		products: [
			{
				product: { type: mongoose.Schema.Types.ObjectId, ref: "menus" },
				quantity: { type: Number, default: 1 },
				price: { type: Number, required: true },
				tax: { type: Number, required: true },
				adminApproved: { type: Boolean, default: false },
				fulfilled: { type: Boolean, default: false },
				kitchenStatus: { type: String, enum: ["pending", "preparing", "ready", "served"], default: "pending" },
				station: { type: String, default: "main" },
			},
		],
	},
	{ timestamps: true },
);

OrderSchema.pre("save", function () {
	if (this.isModified("products")) {
		this.orderTotal = 0;
		this.taxTotal = 0;
		this?.products?.forEach(({ quantity, price, tax }) => {
			this.orderTotal += price * quantity;
			this.taxTotal += tax;
		});
	}
});

export const Orders = mongoose.models?.orders ?? mongoose.model<TOrder>("orders", OrderSchema);
export type TOrder = HydratedDocument<{
	restaurantID: string;
	table: string;
	customer: TCustomer;
	state: (typeof orderState)[number];
	paymentStatus: (typeof paymentStatus)[number];
	paymentId: string;
	paymentGateway: "razorpay" | "stripe" | "cash";
	orderTotal: number;
	taxTotal: number;
	refundedAmount: number;
	n8nEventId: string;
	invoiceNumber: string;
	cartSnapshot:
		| {
				items: Array<{ name: string; price: number; tax: number; quantity: number; veg: string }>;
				subtotal: number;
				taxTotal: number;
				grandTotal: number;
		  }
		| undefined;
	settledAt: Date;
	products: Array<TProduct>;
}>;

export type TProduct = TMenu & {
	_id: mongoose.Types.ObjectId;
	product: TMenu;
	quantity: number;
	price: number;
	tax: number;
	fulfilled: boolean;
	adminApproved: boolean;
	kitchenStatus: "pending" | "preparing" | "ready" | "served";
	station: string;
};
