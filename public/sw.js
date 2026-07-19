const CACHE = "orderworder-v1";
const STATIC_ASSETS = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE).then((cache) => {
			return cache.addAll(STATIC_ASSETS);
		}),
	);
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
		}),
	);
	self.clients.claim();
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	if (url.pathname.startsWith("/api/")) {
		event.respondWith(networkFirst(request));
		return;
	}

	if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/__nextjs/")) {
		event.respondWith(cacheFirst(request));
		return;
	}

	if (request.destination === "image" || request.destination === "font" || request.destination === "style" || request.destination === "script") {
		event.respondWith(cacheFirst(request));
		return;
	}

	if (request.mode === "navigate") {
		event.respondWith(networkFirst(request));
		return;
	}

	event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
	const cached = await caches.match(request);
	if (cached) return cached;
	try {
		const response = await fetch(request);
		if (response.ok) {
			const cache = await caches.open(CACHE);
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		return new Response("Offline", { status: 503 });
	}
}

async function networkFirst(request) {
	try {
		const response = await fetch(request);
		if (response.ok) {
			const cache = await caches.open(CACHE);
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		const cached = await caches.match(request);
		if (cached) return cached;
		if (request.mode === "navigate") {
			return caches.match("/");
		}
		return new Response("Offline", { status: 503 });
	}
}
