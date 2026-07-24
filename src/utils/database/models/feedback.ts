/** @file Feedback model — extended with rating/tags/comment/order/customer refs and
 *    refund tracking for Phase 3's negative-feedback-inbox flow. Existing fields
 *    (rating, review, foodQuality, serviceSpeed, taste) preserved.
 * @phase 2
 * @audit-finding n/a
 */
import mongoose, { type HydratedDocument } from "mongoose";

const FeedbackSchema = new mongoose.Schema<TFeedback>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true, index: true },
		order: { type: mongoose.Schema.Types.ObjectId, ref: "orders", required: true },
		customer: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
		rating: { type: Number, required: true, min: 1, max: 5 },
		review: { type: String, trim: true, maxlength: 1000 },
		foodQuality: { type: Number, min: 1, max: 5 },
		serviceSpeed: { type: Number, min: 1, max: 5 },
		taste: { type: Number, min: 1, max: 5 },
		// ── Phase 2 additions ────────────────────────────────────────────────
		tags: [{ type: String, trim: true, lowercase: true }],
		comment: { type: String, trim: true, maxlength: 2000 },
		orderId: { type: mongoose.Schema.Types.ObjectId, ref: "orders" },
		customerId: { type: mongoose.Schema.Types.ObjectId, ref: "customers" },
		customerPhone: { type: String, trim: true },
		refunded: { type: Boolean, default: false },
		refundCode: { type: String, trim: true },
		refundAmount: { type: Number, default: 0 },
	},
	{ timestamps: true },
);

FeedbackSchema.index({ restaurantID: 1, order: 1 }, { unique: true });
FeedbackSchema.index({ restaurantID: 1, customer: 1 });
FeedbackSchema.index({ restaurantID: 1, refunded: 1, rating: 1 });

export const Feedbacks = mongoose.models?.feedbacks ?? mongoose.model<TFeedback>("feedbacks", FeedbackSchema);

export type TFeedback = HydratedDocument<{
	restaurantID: string;
	order: mongoose.Types.ObjectId;
	customer: mongoose.Types.ObjectId;
	rating: number;
	review?: string;
	foodQuality?: number;
	serviceSpeed?: number;
	taste?: number;
	tags: string[];
	comment?: string;
	orderId?: mongoose.Types.ObjectId;
	customerId?: mongoose.Types.ObjectId;
	customerPhone?: string;
	refunded: boolean;
	refundCode?: string;
	refundAmount: number;
}>;
