import mongoose, { type HydratedDocument } from "mongoose";

const CampaignStatus = ["draft", "sending", "sent", "failed"] as const;

const CampaignSchema = new mongoose.Schema<TCampaign>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true },
		title: { type: String, trim: true, required: true },
		message: { type: String, trim: true, required: true },
		status: { type: String, enum: CampaignStatus, default: "draft" },
		sentCount: { type: Number, default: 0 },
		totalCount: { type: Number, default: 0 },
		failedCount: { type: Number, default: 0 },
		scheduledAt: { type: Date },
		sentAt: { type: Date },
	},
	{ timestamps: true },
);

CampaignSchema.index({ restaurantID: 1, createdAt: -1 });

export const Campaigns = mongoose.models?.campaigns ?? mongoose.model<TCampaign>("campaigns", CampaignSchema);

export type TCampaign = HydratedDocument<{
	restaurantID: string;
	title: string;
	message: string;
	status: (typeof CampaignStatus)[number];
	sentCount: number;
	totalCount: number;
	failedCount: number;
	scheduledAt: Date;
	sentAt: Date;
}>;
