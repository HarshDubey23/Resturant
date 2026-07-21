import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "#utils/helper/rateLimit";

const CSRF_SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
const CSRF_EXEMPT_PATHS = ["/api/auth/[...nextauth]", "/api/payment/webhook", "/api/payment/stripe/webhook", "/api/webhooks/n8n"];

function isCsrfExempt(pathname: string): boolean {
	return CSRF_EXEMPT_PATHS.some((p) => pathname.startsWith(p.replace("[...nextauth]", "")));
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

export async function proxy(req: NextRequest) {
	const { pathname } = req.nextUrl;
	const method = req.method;

	const response = NextResponse.next();

	// CSP nonce + security headers
	const nonce = generateNonce();
	response.headers.set(
		"Content-Security-Policy",
		`default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self' blob:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
	);
	response.headers.set("Permissions-Policy", "camera=(), microphone=(self), geolocation=(self), payment=(self)");

	// CORS for API routes
	if (pathname.startsWith("/api/")) {
		response.headers.set("Access-Control-Allow-Origin", "*");
		response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
		response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token");
		response.headers.set("Access-Control-Max-Age", "86400");
		if (method === "OPTIONS") {
			return new NextResponse(null, { status: 204, headers: response.headers });
		}
	}

	// CSRF protection for state-changing API requests
	if (pathname.startsWith("/api/") && !isCsrfExempt(pathname) && !CSRF_SAFE_METHODS.includes(method)) {
		const existingToken = req.cookies.get("csrf-token")?.value;
		const headerToken = req.headers.get("X-CSRF-Token");

		if (!existingToken || !headerToken || existingToken !== headerToken) {
			return NextResponse.json({ message: "Invalid CSRF token" }, { status: 403 });
		}
	}

	// Refresh / set CSRF token cookie
	const csrfToken = req.cookies.get("csrf-token")?.value || generateCsrfToken();
	response.cookies.set("csrf-token", csrfToken, {
		httpOnly: false,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		path: "/",
		maxAge: 60 * 60 * 24 * 365,
	});

	// Rate limiting on hot routes
	const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anonymous";
	if (pathname === "/api/menu" && method === "GET") {
		const limit = await rateLimitMiddleware(`menu:${clientIp}`, 100, 60_000);
		if (limit) return limit;
	}
	if (pathname.startsWith("/api/admin/order")) {
		const limit = await rateLimitMiddleware(`admin-order:${clientIp}`, 60, 60_000);
		if (limit) return limit;
	}
	if (pathname.startsWith("/api/kitchen")) {
		const limit = await rateLimitMiddleware(`kitchen:${clientIp}`, 60, 60_000);
		if (limit) return limit;
	}
	if (pathname === "/api/auth/send-otp" && method === "POST") {
		const limit = await rateLimitMiddleware(`send-otp:${clientIp}`, 5, 60_000);
		if (limit) return limit;
	}
	if (pathname === "/api/order/place" && method === "POST") {
		const limit = await rateLimitMiddleware(`order-place:${clientIp}`, 30, 60_000);
		if (limit) return limit;
	}

	return response;
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)"],
};
