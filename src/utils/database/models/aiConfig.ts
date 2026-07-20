import { model, models, Schema } from "mongoose";

export interface IAIConfig {
	restaurantID: string;
	exhaustedProviders: string[];
	cooldownUntil: Date | null;
	providerKeys?: {
		groq?: string;
		cerebras?: string;
		google?: string;
		siliconflow?: string;
		updatedAt?: Date;
	};
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
		},
		exhaustedProviders: {
			type: [String],
			default: [],
		},
		cooldownUntil: {
			type: Date,
			default: null,
		},
		providerKeys: {
			groq: { type: String },
			cerebras: { type: String },
			google: { type: String },
			siliconflow: { type: String },
			updatedAt: { type: Date },
		},
	},
	{ timestamps: true },
);

const AIConfig = models.AIConfig || model<IAIConfig>("AIConfig", aiConfigSchema);

export default AIConfig;
