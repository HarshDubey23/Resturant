import { Redis } from "@upstash/redis";

let client: Redis | null = null;

function getRedisClient(): Redis {
	if (!client) {
		const url = process.env.UPSTASH_REDIS_REST_URL;
		const token = process.env.UPSTASH_REDIS_REST_TOKEN;
		if (!url || !token) {
			throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set");
		}
		client = new Redis({ url, token });
	}
	return client;
}

export function getRedis(): Redis {
	return getRedisClient();
}

export async function cacheGet<T>(key: string): Promise<T | null> {
	try {
		const redis = getRedis();
		return await redis.get<T>(key);
	} catch {
		return null;
	}
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
	try {
		const redis = getRedis();
		await redis.setex(key, ttlSeconds, value);
	} catch {}
}

export async function cacheDel(key: string): Promise<void> {
	try {
		const redis = getRedis();
		await redis.del(key);
	} catch {}
}
