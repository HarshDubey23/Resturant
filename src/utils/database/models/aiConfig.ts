import { model, models, Schema } from "mongoose";

export interface IAIConfig {
	restaurantID: string;
	exhaustedProviders: string[];
	cooldownUntil: Date | null;
	dailyBudget: {
		tokenLimit: number;
		costLimit: number;
		tokensUsed: number;
		costUsed: number;
		lastReset: Date;
	};
	dailyTtsChars: number;
	lastTtsReset: Date;
	providerKeys?: {
		groq?: string;
		cerebras?: string;
		google?: string;
		siliconflow?: string;
		huggingface?: string;
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
		dailyBudget: {
			tokenLimit: { type: Number, default: 100000 },
			costLimit: { type: Number, default: 2.0 },
			tokensUsed: { type: Number, default: 0 },
			costUsed: { type: Number, default: 0 },
			lastReset: { type: Date, default: Date.now },
		},
		dailyTtsChars: { type: Number, default: 0 },
		lastTtsReset: { type: Date, default: Date.now },
		providerKeys: {
			groq: { type: String },
			cerebras: { type: String },
			google: { type: String },
			siliconflow: { type: String },
			huggingface: { type: String },
			updatedAt: { type: Date },
		},
	},
	{ timestamps: true },
);

const AIConfig = models.AIConfig || model<IAIConfig>("AIConfig", aiConfigSchema);

export default AIConfig;
