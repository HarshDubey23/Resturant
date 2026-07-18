const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, maxRequests: number, windowMs: number): { ok: boolean; remaining: number; resetIn: number } {
	const now = Date.now();
	const entry = store.get(key);

	if (!entry || now > entry.resetAt) {
		store.set(key, { count: 1, resetAt: now + windowMs });
		return { ok: true, remaining: maxRequests - 1, resetIn: windowMs };
	}

	entry.count++;

	if (entry.count > maxRequests) {
		return { ok: false, remaining: 0, resetIn: entry.resetAt - now };
	}

	return { ok: true, remaining: maxRequests - entry.count, resetIn: entry.resetAt - now };
}

export function rateLimitMiddleware(key: string, maxRequests = 10, windowMs = 60000) {
	const result = rateLimit(key, maxRequests, windowMs);
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
