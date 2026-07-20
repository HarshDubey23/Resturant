import { getRedis } from "#utils/database/redis";

export async function rateLimit(key: string, maxRequests: number, windowMs: number): Promise<{ ok: boolean; remaining: number; resetIn: number }> {
	try {
		const redis = getRedis();
		const now = Date.now();
		const windowKey = `ratelimit:${key}`;
		const windowStart = Math.floor(now / windowMs) * windowMs;
		const countKey = `${windowKey}:${windowStart}`;

		const current = await redis.get<number>(countKey);
		if (current === null) {
			await redis.setex(countKey, Math.ceil(windowMs / 1000), 1);
			return { ok: true, remaining: maxRequests - 1, resetIn: windowMs };
		}

		if (current >= maxRequests) {
			const ttl = await redis.ttl(countKey);
			return { ok: false, remaining: 0, resetIn: ttl > 0 ? ttl * 1000 : windowMs };
		}

		await redis.incr(countKey);
		const ttl = await redis.ttl(countKey);
		return { ok: true, remaining: maxRequests - (current + 1), resetIn: ttl > 0 ? ttl * 1000 : windowMs };
	} catch {
		return { ok: false, remaining: 0, resetIn: windowMs };
	}
}

export async function rateLimitMiddleware(key: string, maxRequests = 10, windowMs = 60000): Promise<Response | null> {
	const result = await rateLimit(key, maxRequests, windowMs);
	if (!result.ok) {
		return Response.json(
			{ message: "Too many requests. Please slow down." },
			{
				status: 429,
				headers: {
					"Retry-After": String(Math.ceil(result.resetIn / 1000)),
					"X-RateLimit-Remaining": "0",
				},
			},
		);
	}
	return null;
}
