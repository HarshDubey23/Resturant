import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cacheGet } from "#utils/database/redis";
import { rateLimitMiddleware } from "#utils/helper/rateLimit";

const CSRF_SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
const CSRF_EXEMPT_PATHS = [
	"/api/auth/",
	"/api/payment/webhook",
	"/api/payment/stripe/webhook",
	"/api/billing/webhook", // Stripe billing webhook — no CSRF cookie
	"/api/webhooks/n8n",
	"/api/inngest", // Inngest serve handler — signed requests
];

/** Routes that genuinely need CORS for cross-origin access (public read APIs). */
const _CORS_PUBLIC_PATHS = ["/api/menu", "/api/feedback", "/api/health"];

function isCsrfExempt(pathname: string): boolean {
	return CSRF_EXEMPT_PATHS.some((p) => pathname.startsWith(p));
}

function isCorsPublicPath(pathname: string): boolean {
	// Exact match for /api/menu, prefix match for /api/feedback, /api/health
	if (pathname === "/api/menu") return true;
	if (pathname.startsWith("/api/feedback")) return true;
	if (pathname.startsWith("/api/health")) return true;
	return false;
}

function generateNonce(): string {
	const array = new Uint8Array(16);
	crypto.getRandomValues(array);
	return btoa(String.fromCharCode(...array));
}

function generateCsrfToken(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison for the edge runtime (no node:crypto). */
function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diff === 0;
}

/**
 * Parse ALLOWED_ORIGINS env var (comma-separated).
 * Defaults to the dashboard domain only in production; falls back to "*" in dev.
 */
function getAllowedOrigins(): string[] {
	const env = process.env.ALLOWED_ORIGINS;
	if (env) return env.split(",").map((o) => o.trim());
	if (process.env.NODE_ENV === "development") return ["*"];
	// Production default: only the main dashboard domain
	const url = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_URL || "";
	return url ? [url] : [];
}

function buildCsp(nonce: string, isDev: boolean): string {
	// Development needs eval for HMR/source-maps and inline bootstrap scripts.
	if (isDev) {
		return [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: blob: https:",
			"font-src 'self' data:",
			"connect-src 'self' https: wss: ws:",
			"worker-src 'self' blob:",
			"media-src 'self' blob:",
			"frame-src 'self' blob: https://checkout.razorpay.com https://api.razorpay.com https://js.stripe.com https://hooks.stripe.com https://maps.google.com https://www.google.com",
			"object-src 'none'",
			"base-uri 'self'",
			"form-action 'self'",
		].join("; ");
	}

	// Production: strict nonce-based policy. Next.js reads the nonce from this
	// header (forwarded on the request below) and applies it to every script it
	// renders; 'strict-dynamic' then trusts anything those scripts load
	// (Razorpay checkout.js, Stripe.js). Host entries are a fallback for
	// browsers without 'strict-dynamic' support.
	return [
		"default-src 'self'",
		`script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob: https:",
		"font-src 'self' data:",
		"connect-src 'self' https: wss:",
		"worker-src 'self' blob:",
		"media-src 'self' blob:",
		"frame-src 'self' blob: https://checkout.razorpay.com https://api.razorpay.com https://js.stripe.com https://hooks.stripe.com https://maps.google.com https://www.google.com",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
		"upgrade-insecure-requests",
	].join("; ");
}

export async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	const method = req.method;
	const isDev = process.env.NODE_ENV === "development";

	// ──── Subdomain tenancy routing ────
	const host = req.headers.get("host") || "";
	const rootDomain = process.env.ROOT_DOMAIN || "orderworder.com";
	// If host matches *.rootDomain (but not www, app, or the bare domain)
	if (host !== rootDomain && host !== `www.${rootDomain}` && host !== `app.${rootDomain}` && host.endsWith(`.${rootDomain}`)) {
		const slug = host.slice(0, host.length - rootDomain.length - 1);
		// Look up slug in Redis cache (TTL 5 min) — confirms the slug exists
		const cacheKey = `subdomain:${slug}`;
		const cached = await cacheGet<boolean>(cacheKey);
		if (cached === true) {
			// Slug is known — rewrite URL to /{slug}{path}
			const url = req.nextUrl.clone();
			url.pathname = `/${slug}${url.pathname}`;
			return NextResponse.rewrite(url);
		}
		// Not in cache — still rewrite; the /[restaurant] route will handle 404
		// if slug doesn't exist. The cache is populated by the route handler or
		// a separate warm-up process.
		const url = req.nextUrl.clone();
		url.pathname = `/${slug}${url.pathname}`;
		return NextResponse.rewrite(url);
	}

	// ──── CSRF protection ────
	// CSRF protection for state-changing API requests (double-submit cookie).
	// Runs before NextResponse.next() so rejected requests never hit handlers.
	if (pathname.startsWith("/api/") && !isCsrfExempt(pathname) && !CSRF_SAFE_METHODS.includes(method)) {
		const existingToken = req.cookies.get("csrf-token")?.value;
		const headerToken = req.headers.get("X-CSRF-Token");

		if (!existingToken || !headerToken || !timingSafeEqual(existingToken, headerToken)) {
			return NextResponse.json({ message: "Invalid CSRF token" }, { status: 403 });
		}
	}

	// CSP nonce must be forwarded on the REQUEST headers so Next.js can apply
	// it to the inline scripts it renders, then mirrored on the response.
	const nonce = generateNonce();
	const csp = buildCsp(nonce, isDev);
	const requestHeaders = new Headers(req.headers);
	requestHeaders.set("x-nonce", nonce);
	requestHeaders.set("Content-Security-Policy", csp);

	const response = NextResponse.next({ request: { headers: requestHeaders } });
	response.headers.set("Content-Security-Policy", csp);
	response.headers.set("Permissions-Policy", "camera=(), microphone=(self), geolocation=(self), payment=(self)");

	// CORS: only apply Access-Control-Allow-Origin to genuinely public API routes.
	// Authenticated /api/* routes must NOT send CORS headers — they rely on
	// same-origin + CSRF cookie instead.
	if (isCorsPublicPath(pathname)) {
		const origins = getAllowedOrigins();
		const origin = req.headers.get("origin") || "";
		const allowedOrigin = origins.includes("*") ? "*" : origins.includes(origin) ? origin : origins[0] || "";
		response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
		response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
		response.headers.set("Access-Control-Allow-Headers", "Content-Type");
		response.headers.set("Access-Control-Max-Age", "86400");
		if (method === "OPTIONS") {
			return new NextResponse(null, { status: 204, headers: response.headers });
		}
	}

	// Refresh / set CSRF token cookie (always, even for public routes so the
	// cookie is available for subsequent state-changing requests).
	const csrfToken = req.cookies.get("csrf-token")?.value || generateCsrfToken();
	response.cookies.set("csrf-token", csrfToken, {
		httpOnly: false,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		path: "/",
		maxAge: 60 * 60 * 24 * 365,
	});

	// ──── Rate limiting ────
	const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anonymous";
	if (pathname === "/api/menu" && method === "GET") {
		const limit = await rateLimitMiddleware(`menu:${clientIp}`, 100, 60_000);
		if (limit) {
			if (limit.status === 429) limit.headers.set("Retry-After", "60");
			return limit;
		}
	}
	if (pathname.startsWith("/api/admin/order")) {
		const limit = await rateLimitMiddleware(`admin-order:${clientIp}`, 60, 60_000);
		if (limit) {
			if (limit.status === 429) limit.headers.set("Retry-After", "60");
			return limit;
		}
	}
	if (pathname.startsWith("/api/kitchen")) {
		const limit = await rateLimitMiddleware(`kitchen:${clientIp}`, 60, 60_000);
		if (limit) {
			if (limit.status === 429) limit.headers.set("Retry-After", "60");
			return limit;
		}
	}
	if (pathname === "/api/auth/send-otp" && method === "POST") {
		const limit = await rateLimitMiddleware(`send-otp:${clientIp}`, 5, 60_000);
		if (limit) {
			if (limit.status === 429) limit.headers.set("Retry-After", "60");
			return limit;
		}
	}
	if (pathname === "/api/order/place" && method === "POST") {
		const limit = await rateLimitMiddleware(`order-place:${clientIp}`, 30, 60_000);
		if (limit) {
			if (limit.status === 429) limit.headers.set("Retry-After", "60");
			return limit;
		}
	}

	return response;
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|sw.js|icon-192.png|icon-512.png).*)"],
};
