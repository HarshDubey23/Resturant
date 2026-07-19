import mongoose, { type HydratedDocument } from "mongoose";

const tierEnum = ["silver", "gold", "platinum"] as const;

const LoyaltySchema = new mongoose.Schema<TLoyalty>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true },
		customer: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
		points: { type: Number, default: 0 },
		lifetimePoints: { type: Number, default: 0 },
		tier: { type: String, enum: tierEnum, default: "silver" },
		lastVisit: { type: Date },
		visitCount: { type: Number, default: 0 },
		birthday: { type: Date },
		anniversary: { type: Date },
		preferences: {
			language: { type: String, default: "hi" },
			spiceTolerance: { type: String, enum: ["mild", "medium", "hot", "extra-hot"] },
			allergens: [{ type: String }],
			favoriteDishes: [{ type: mongoose.Schema.Types.ObjectId, ref: "menus" }],
			notes: { type: String },
		},
		offers: [
			{
				title: { type: String },
				description: { type: String },
				discountPercent: { type: Number },
				freeItem: { type: mongoose.Schema.Types.ObjectId, ref: "menus" },
				pointsCost: { type: Number },
				validUntil: { type: Date },
				redeemed: { type: Boolean, default: false },
			},
		],
	},
	{ timestamps: true },
);

LoyaltySchema.index({ restaurantID: 1, customer: 1 }, { unique: true });

export const Loyalties = mongoose.models?.loyalties ?? mongoose.model<TLoyalty>("loyalties", LoyaltySchema);

export type TLoyalty = HydratedDocument<{
	restaurantID: string;
	customer: mongoose.Types.ObjectId;
	points: number;
	lifetimePoints: number;
	tier: (typeof tierEnum)[number];
	lastVisit: Date;
	visitCount: number;
	birthday: Date;
	anniversary: Date;
	preferences: {
		language: string;
		spiceTolerance: "mild" | "medium" | "hot" | "extra-hot";
		allergens: string[];
		favoriteDishes: mongoose.Types.ObjectId[];
		notes: string;
	};
	offers: Array<{
		title: string;
		description: string;
		discountPercent: number;
		freeItem: mongoose.Types.ObjectId;
		pointsCost: number;
		validUntil: Date;
		redeemed: boolean;
	}>;
}>;

export function computeTier(lifetimePoints: number): (typeof tierEnum)[number] {
	if (lifetimePoints >= 5000) return "platinum";
	if (lifetimePoints >= 1000) return "gold";
	return "silver";
}

export function getPointsMultiplier(tier: (typeof tierEnum)[number]): number {
	switch (tier) {
		case "platinum":
			return 1.5;
		case "gold":
			return 1.25;
		default:
			return 1;
	}
}

export function computePoints(amount: number, tier: (typeof tierEnum)[number]): number {
	return Math.floor(amount / 10) * getPointsMultiplier(tier);
}
