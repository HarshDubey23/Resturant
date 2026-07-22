import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "#utils/database/redis";

let redisFailureCount = 0;
let lastCircuitReset = Date.now();
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_RESET_MS = 60_000;
const IN_MEMORY_WINDOW_MS = 60_000;
const inMemoryCounters = new Map<string, { count: number; resetAt: number }>();

function inMemoryRateLimit(key: string, maxRequests: number, windowMs: number): { ok: boolean; remaining: number; resetIn: number } {
	const now = Date.now();
	const existing = inMemoryCounters.get(key);
	if (!existing || now > existing.resetAt) {
		inMemoryCounters.set(key, { count: 1, resetAt: now + windowMs });
		return { ok: true, remaining: maxRequests - 1, resetIn: windowMs };
	}
	if (existing.count >= maxRequests) {
		return { ok: false, remaining: 0, resetIn: existing.resetAt - now };
	}
	existing.count++;
	return { ok: true, remaining: maxRequests - existing.count, resetIn: existing.resetAt - now };
}

export async function rateLimit(key: string, maxRequests: number, windowMs: number): Promise<{ ok: boolean; remaining: number; resetIn: number }> {
	try {
		const redis = getRedis();

		if (redisFailureCount >= CIRCUIT_BREAKER_THRESHOLD) {
			const timeSinceReset = Date.now() - lastCircuitReset;
			if (timeSinceReset < CIRCUIT_BREAKER_RESET_MS) {
				return inMemoryRateLimit(key, maxRequests * 2, windowMs);
			}
			redisFailureCount = 0;
			lastCircuitReset = Date.now();
		}

		const duration: `${number} ms` = `${windowMs} ms`;
		const ratelimit = new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(maxRequests, duration),
			prefix: "ratelimit",
			analytics: false,
		});

		const result = await ratelimit.limit(key);
		redisFailureCount = 0;

		return {
			ok: result.success,
			remaining: result.remaining,
			resetIn: result.reset || windowMs,
		};
	} catch {
		redisFailureCount++;
		lastCircuitReset = Date.now();
		return inMemoryRateLimit(key, maxRequests, IN_MEMORY_WINDOW_MS);
	}
}

function _parseDuration(duration: string): number {
	const match = duration.match(/(\d+)\s*(s|m)/);
	if (!match) return 60_000;
	const value = Number.parseInt(match[1], 10);
	return match[2] === "m" ? value * 60_000 : value * 1000;
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
