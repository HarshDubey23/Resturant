const store = new Map<string, { value: unknown; expiresAt?: number }>();

function now() {
	return Date.now();
}

function _sweep() {
	const t = now();
	for (const [key, entry] of store) {
		if (entry.expiresAt && entry.expiresAt <= t) {
			store.delete(key);
		}
	}
}

export class MemoryRedis {
	async get<T = unknown>(key: string): Promise<T | null> {
		const entry = store.get(key);
		if (!entry) return null;
		if (entry.expiresAt && entry.expiresAt <= now()) {
			store.delete(key);
			return null;
		}
		return entry.value as T;
	}

	async set(key: string, value: unknown): Promise<"OK"> {
		store.set(key, { value });
		return "OK";
	}

	async setex(key: string, ttlSeconds: number, value: unknown): Promise<"OK"> {
		store.set(key, { value, expiresAt: now() + ttlSeconds * 1000 });
		return "OK";
	}

	async del(...keys: string[]): Promise<number> {
		let count = 0;
		for (const key of keys) {
			if (store.delete(key)) count++;
		}
		return count;
	}

	async ping(): Promise<string> {
		return "PONG";
	}

	async ttl(key: string): Promise<number> {
		const entry = store.get(key);
		if (!entry) return -2;
		if (!entry.expiresAt) return -1;
		const remaining = Math.ceil((entry.expiresAt - now()) / 1000);
		if (remaining <= 0) {
			store.delete(key);
			return -2;
		}
		return remaining;
	}

	async incr(key: string): Promise<number> {
		const entry = store.get(key);
		const current = (entry?.value as number) || 0;
		const next = current + 1;
		store.set(key, { value: next, expiresAt: entry?.expiresAt });
		return next;
	}

	async expire(key: string, ttlSeconds: number): Promise<number> {
		const entry = store.get(key);
		if (!entry) return 0;
		entry.expiresAt = now() + ttlSeconds * 1000;
		return 1;
	}

	// biome-ignore lint/suspicious/noExplicitAny: match @upstash/redis signature
	async evalsha<TData = unknown>(_sha: string, _keys: string[], _args: any[]): Promise<TData> {
		return null as TData;
	}

	// biome-ignore lint/suspicious/noExplicitAny: match @upstash/redis signature
	async multi(): Promise<any> {
		return this;
	}

	// biome-ignore lint/suspicious/noExplicitAny: match @upstash/redis signature
	async exec(): Promise<any[]> {
		return [];
	}
}
