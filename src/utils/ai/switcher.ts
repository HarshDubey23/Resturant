import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import AIConfig from "#utils/database/models/aiConfig";
import { configs, models } from "./config";

const PROVIDER_ORDER = Object.keys(models) as (keyof typeof models)[];

const PROVIDER_URLS: Record<string, string> = {
	groq: "https://api.groq.com/openai/v1",
	cerebras: "https://api.cerebras.ai/v1",
	google: "https://generativelanguage.googleapis.com/v1beta/openai",
	siliconflow: "https://api.siliconflow.com/v1",
	huggingface: "https://api-inference.huggingface.co/v1",
};

const PROVIDER_MODELS: Record<string, string> = {};
for (const c of configs) {
	PROVIDER_MODELS[c.platform] = c.model;
}

const COOLDOWN_MS = 60 * 60 * 1000;

export const getProviderState = async (restaurantID: string) => {
	let config = await AIConfig.findOne({ restaurantID });
	if (!config) config = await AIConfig.create({ restaurantID, exhaustedProviders: [], cooldownUntil: null });
	return config;
};

export const getAvailableProvider = async (restaurantID: string) => {
	const config = await getProviderState(restaurantID);
	const now = new Date();

	if (config.cooldownUntil && config.cooldownUntil > now) {
		return null;
	}

	if (config.cooldownUntil && config.cooldownUntil <= now) {
		config.exhaustedProviders = [];
		config.cooldownUntil = null;
		await config.save();
	}

	const exhausted = new Set(config.exhaustedProviders);
	return PROVIDER_ORDER.find((p) => !exhausted.has(p)) || null;
};

export const markProviderExhausted = async (restaurantID: string, provider: string) => {
	const config = await getProviderState(restaurantID);
	config.exhaustedProviders.push(provider);

	if (config.exhaustedProviders.length >= PROVIDER_ORDER.length) {
		config.cooldownUntil = new Date(Date.now() + COOLDOWN_MS);
	}

	await config.save();
};

export const resetProviders = async (restaurantID: string) => {
	const config = await getProviderState(restaurantID);
	config.exhaustedProviders = [];
	config.cooldownUntil = null;
	await config.save();
};

async function resolveKey(platform: string, restaurantID: string): Promise<string | undefined> {
	try {
		const config = await AIConfig.findOne({ restaurantID }).lean();
		const keys = (config as Record<string, unknown> | null)?.providerKeys as Record<string, string> | undefined;
		if (keys?.[platform]) return keys[platform];
	} catch {}
	return process.env[`AI_${platform.toUpperCase()}_KEY`];
}

export const smartGenerateText = async (restaurantID: string, params: Omit<Parameters<typeof generateText>[0], "model">) => {
	let currentProvider = await getAvailableProvider(restaurantID);

	if (!currentProvider) {
		throw new Error("AI temporarily unavailable. All providers are in cooldown. Please try again later.");
	}

	while (currentProvider) {
		try {
			console.log(`[AI][${restaurantID}] Trying provider: ${currentProvider}`);
			const apiKey = await resolveKey(currentProvider, restaurantID);
			let model = models[currentProvider];

			if (apiKey && apiKey !== process.env[`AI_${currentProvider.toUpperCase()}_KEY`]) {
				const provider = createOpenAICompatible({
					baseURL: PROVIDER_URLS[currentProvider],
					apiKey,
					name: currentProvider,
				});
				model = provider(PROVIDER_MODELS[currentProvider]);
			}

			const result = await generateText({
				...params,
				model,
			} as Parameters<typeof generateText>[0]);
			return result;
		} catch (error) {
			console.error(`[AI][${restaurantID}] Provider ${currentProvider} failed:`, (error as Error).message);
			await markProviderExhausted(restaurantID, currentProvider);
			currentProvider = await getAvailableProvider(restaurantID);
		}
	}
	throw new Error("All AI providers exhausted");
};
