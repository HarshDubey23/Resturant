import { Redis } from "@upstash/redis";
import { MemoryRedis } from "./redis-memory";

let client: Redis | null = null;
let memoryClient: MemoryRedis | null = null;
let warned = false;

type RedisClient = Redis | MemoryRedis;

function getRedisClient(): RedisClient {
	const url = process.env.UPSTASH_REDIS_REST_URL;
	const token = process.env.UPSTASH_REDIS_REST_TOKEN;
	if (url && token) {
		if (!client) {
			client = new Redis({ url, token });
		}
		return client;
	}
	if (!warned) {
		console.warn("[redis] UPSTASH_REDIS_REST_URL not configured — using in-memory fallback. For multi-instance deployments, configure Upstash or self-hosted Redis.");
		warned = true;
	}
	if (!memoryClient) {
		memoryClient = new MemoryRedis();
	}
	return memoryClient;
}

export function getRedis(): RedisClient {
	return getRedisClient();
}

export async function cacheGet<T>(key: string): Promise<T | null> {
	try {
		const r = getRedis();
		return await r.get<T>(key);
	} catch {
		return null;
	}
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
	try {
		const r = getRedis();
		await r.setex(key, ttlSeconds, value);
	} catch {}
}

export async function cacheDel(key: string): Promise<void> {
	try {
		const r = getRedis();
		await r.del(key);
	} catch {}
}
