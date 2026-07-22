/* eslint-disable no-undef */
/* OrderWorder Workbox service worker — offline caching, push, background sync */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js");

const { registerRoute, setCatchHandler } = workbox.routing;
const { CacheFirst, StaleWhileRevalidate, NetworkFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { precacheAndRoute } = workbox.precaching;

const STATIC_CACHE = "static-assets";
const API_CACHE = "api-cache";
const PENDING_ORDERS_STORE = "pending-orders";
const DB_NAME = "orderworder-offline";
const DB_VERSION = 1;

// Precache the shell and critical icons
precacheAndRoute([
	{ url: "/", revision: "1" },
	{ url: "/manifest.webmanifest", revision: "1" },
	{ url: "/icon-192.png", revision: "1" },
	{ url: "/icon-512.png", revision: "1" },
]);

// Static assets
registerRoute(
	({ request }) => ["style", "script", "font", "image"].includes(request.destination),
	new CacheFirst({
		cacheName: STATIC_CACHE,
		plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 })],
	}),
);

// API routes that can be slightly stale
registerRoute(
	({ url }) => url.pathname.startsWith("/api/menu") || url.pathname.startsWith("/api/restaurant"),
	new StaleWhileRevalidate({
		cacheName: API_CACHE,
		plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 })],
	}),
);

// Critical API routes that must be fresh when online
registerRoute(
	({ url }) => url.pathname.startsWith("/api/order") || url.pathname.startsWith("/api/kitchen"),
	new NetworkFirst({
		cacheName: API_CACHE,
		plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 })],
	}),
);

// Default navigation
registerRoute(
	({ request }) => request.mode === "navigate",
	new NetworkFirst({
		cacheName: "pages",
		plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 })],
	}),
);

setCatchHandler(async ({ event }) => {
	if (event.request?.destination === "document") {
		return caches.match("/");
	}
	return Response.error();
});

// Push notifications
self.addEventListener("push", (event) => {
	if (!event.data) return;
	let payload;
	try {
		payload = event.data.json();
	} catch {
		payload = { title: "OrderWorder", body: event.data.text() };
	}
	const { title, body, icon = "/icon-192.png", badge = "/icon-192.png", data = {} } = payload;
	event.waitUntil(self.registration.showNotification(title || "OrderWorder", { body, icon, badge, data }));
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const url = event.notification?.data?.url || "/";
	event.waitUntil(self.clients.openWindow(url));
});

// Background sync for pending orders
function openDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(PENDING_ORDERS_STORE)) {
				db.createObjectStore(PENDING_ORDERS_STORE, { keyPath: "id", autoIncrement: true });
			}
		};
	});
}

async function getPendingOrders() {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(PENDING_ORDERS_STORE, "readonly");
		const store = tx.objectStore(PENDING_ORDERS_STORE);
		const request = store.getAll();
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

async function removePendingOrder(id) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(PENDING_ORDERS_STORE, "readwrite");
		const store = tx.objectStore(PENDING_ORDERS_STORE);
		const request = store.delete(id);
		request.onsuccess = () => resolve(undefined);
		request.onerror = () => reject(request.error);
	});
}

async function submitPendingOrder(order) {
	const res = await fetch("/api/order/place", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(order),
	});
	if (!res.ok) throw new Error(`Failed to submit order: ${res.status}`);
	return res.json();
}

self.addEventListener("sync", (event) => {
	if (event.tag === "order-sync") {
		event.waitUntil(
			(async () => {
				const pending = await getPendingOrders();
				for (const { id, order } of pending) {
					try {
						await submitPendingOrder(order);
						await removePendingOrder(id);
						self.registration.showNotification("OrderWorder", { body: "An offline order was submitted successfully.", icon: "/icon-192.png" });
					} catch (e) {
						console.error("[SW] background sync failed for order", id, e);
					}
				}
			})(),
		);
	}
});

self.addEventListener("message", (event) => {
	if (event.data && event.data.type === "SKIP_WAITING") {
		self.skipWaiting();
	}
});

console.log("[SW] OrderWorder Workbox service worker active");
