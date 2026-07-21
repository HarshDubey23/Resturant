import connectDB from "#utils/database/connect";
import { Accounts, type TAccount } from "#utils/database/models/account";
import { cacheDel, cacheGet, cacheSet } from "#utils/database/redis";

export async function getRestaurantData(username: string) {
	await connectDB();
	const cacheKey = `restaurant:${username}`;
	const cached = await cacheGet<TAccount>(cacheKey);
	if (cached) return cached;

	const data = await Accounts.findOne<TAccount>({ username }).populate("profile").populate("tables").populate("menus").lean();
	if (data) {
		await cacheSet(cacheKey, data, 600);
	}
	return data;
}

export async function invalidateRestaurantCache(slug: string) {
	await cacheDel(`restaurant:${slug}`);
}
