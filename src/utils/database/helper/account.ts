import connectDB from "#utils/database/connect";
import { Accounts, type TAccount } from "#utils/database/models/account";
import { cacheDel, cacheGet, cacheSet } from "#utils/database/redis";

/**
 * Removes credential material before an account record is cached in Redis.
 * Password hashes (account + kitchen logins) must never sit in a fast-access
 * cache — a Redis compromise would otherwise expose every credential at once.
 */
function stripSensitiveFields(data: TAccount | Record<string, unknown>): Record<string, unknown> {
	const safe = JSON.parse(JSON.stringify(data)) as Record<string, unknown> & {
		kitchens?: Array<Record<string, unknown>>;
	};
	delete safe.password;
	if (Array.isArray(safe.kitchens)) {
		safe.kitchens = safe.kitchens.map((k) => {
			const kitchen = { ...k };
			delete kitchen.password;
			return kitchen;
		});
	}
	return safe;
}

export async function getRestaurantData(username: string) {
	await connectDB();
	const cacheKey = `restaurant:${username}`;
	const cached = await cacheGet<Record<string, unknown>>(cacheKey);
	if (cached) return cached;

	const data = await Accounts.findOne<TAccount>({ username }).populate("profile").populate("tables").populate("menus").lean();
	if (data) {
		await cacheSet(cacheKey, stripSensitiveFields(data), 600);
	}
	return data;
}

export async function invalidateRestaurantCache(slug: string) {
	await cacheDel(`restaurant:${slug}`);
}
