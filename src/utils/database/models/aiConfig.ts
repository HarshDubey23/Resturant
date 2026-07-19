import { model, models, Schema } from "mongoose";

export interface IAIConfig {
	restaurantID: string;
	exhaustedProviders: string[];
	cooldownUntil: Date | null;
}

const aiConfigSchema = new Schema<IAIConfig>(
	{
		restaurantID: {
			type: String,
			trim: true,
			lowercase: true,
			required: true,
			unique: true,
			sparse: true,
			index: { unique: true },
		},
		exhaustedProviders: {
			type: [String],
			default: [],
		},
		cooldownUntil: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true },
);

const AIConfig = models.AIConfig || model<IAIConfig>("AIConfig", aiConfigSchema);

export default AIConfig;
