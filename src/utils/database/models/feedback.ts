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
	},
	{ timestamps: true },
);

FeedbackSchema.index({ restaurantID: 1, order: 1 }, { unique: true });
FeedbackSchema.index({ restaurantID: 1, customer: 1 });

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
}>;
