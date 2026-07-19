import { generateText } from "ai";
import AIConfig from "#utils/database/models/aiConfig";
import { models } from "./config";

const PROVIDER_ORDER = Object.keys(models) as (keyof typeof models)[];

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

export const smartGenerateText = async (restaurantID: string, params: Omit<Parameters<typeof generateText>[0], "model">) => {
	let currentProvider = await getAvailableProvider(restaurantID);

	if (!currentProvider) {
		await resetProviders(restaurantID);
		currentProvider = PROVIDER_ORDER[0];
	}

	while (currentProvider) {
		try {
			console.log(`[AI][${restaurantID}] Trying provider: ${currentProvider}`);
			const result = await generateText({
				...params,
				model: models[currentProvider],
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
