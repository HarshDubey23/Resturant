import mongoose, { type HydratedDocument } from "mongoose";

const CouponSchema = new mongoose.Schema<TCoupon>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true, index: true },
		code: { type: String, trim: true, uppercase: true, required: true },
		discountType: { type: String, enum: ["percentage", "flat"], required: true },
		discountValue: { type: Number, required: true },
		minOrderAmount: { type: Number, default: 0 },
		maxDiscountAmount: { type: Number, default: null },
		validFrom: { type: Date, required: true },
		validUntil: { type: Date, required: true },
		usageLimit: { type: Number, default: null },
		usedCount: { type: Number, default: 0 },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

CouponSchema.index({ restaurantID: 1, code: 1 }, { unique: true });

export const Coupons = mongoose.models?.coupons ?? mongoose.model<TCoupon>("coupons", CouponSchema);

export type TCoupon = HydratedDocument<{
	restaurantID: string;
	code: string;
	discountType: "percentage" | "flat";
	discountValue: number;
	minOrderAmount: number;
	maxDiscountAmount: number | null;
	validFrom: Date;
	validUntil: Date;
	usageLimit: number | null;
	usedCount: number;
	isActive: boolean;
}>;
