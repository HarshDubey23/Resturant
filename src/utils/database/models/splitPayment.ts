import mongoose, { type HydratedDocument } from "mongoose";

const splitStatus = ["pending", "paid", "failed", "expired"] as const;

const SplitPaymentSchema = new mongoose.Schema<TSplitPayment>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true, index: true },
		order: { type: mongoose.Schema.Types.ObjectId, ref: "orders", required: true, index: true },
		totalAmount: { type: Number, required: true },
		splits: [
			{
				name: { type: String, trim: true, required: true },
				phone: { type: String, trim: true, required: true },
				email: { type: String, trim: true },
				amount: { type: Number, required: true },
				paymentLinkId: { type: String, trim: true },
				paymentLinkUrl: { type: String, trim: true },
				paymentId: { type: String, trim: true },
				status: { type: String, enum: splitStatus, default: "pending" },
				paidAt: { type: Date },
			},
		],
		status: { type: String, enum: ["open", "settled", "cancelled"], default: "open" },
	},
	{ timestamps: true },
);

SplitPaymentSchema.index({ restaurantID: 1, order: 1, createdAt: -1 });
SplitPaymentSchema.index({ "splits.paymentLinkId": 1 });

export const SplitPayments = mongoose.models?.splitpayments ?? mongoose.model<TSplitPayment>("splitpayments", SplitPaymentSchema);

export type TSplit = {
	name: string;
	phone: string;
	email?: string;
	amount: number;
	paymentLinkId?: string;
	paymentLinkUrl?: string;
	paymentId?: string;
	status: (typeof splitStatus)[number];
	paidAt?: Date;
};

export type TSplitPayment = HydratedDocument<{
	restaurantID: string;
	order: mongoose.Types.ObjectId;
	totalAmount: number;
	splits: TSplit[];
	status: "open" | "settled" | "cancelled";
}>;
