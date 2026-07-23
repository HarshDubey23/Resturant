import NextAuth from "next-auth";

import { authOptions } from "#utils/helper/authHelper";
import { rateLimitMiddleware } from "#utils/helper/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const handler = NextAuth(authOptions);

async function wrappedHandler(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
	try {
		const ip = req.headers.get("x-forwarded-for") ?? "unknown";
		const rateLimitResponse = req.method === "POST" ? await rateLimitMiddleware(`auth:${ip}`, 10, 60000) : null;
		if (rateLimitResponse) return rateLimitResponse;

		// NextAuth v4.24 was built for Next.js 13/14 App Router. Under Next.js 16
		// the incoming `req` may be a plain `Request` (not a `NextRequest`), but
		// NextAuth's `NextAuthRouteHandler` reads `req.nextUrl.searchParams` which
		// only exists on `NextRequest`. Reconstruct a `NextRequest` when needed so
		// all the properties NextAuth expects (nextUrl, headers, body stream) are
		// present and consistent. The body is read once here and re-streamed into
		// the new request.
		let reqToPass: Request = req;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (!(req as any).nextUrl) {
			try {
				const host = req.headers.get("host") || "localhost:3050";
				const proto = req.headers.get("x-forwarded-proto") || "http";
				const path = req.url.startsWith("http") ? new URL(req.url).pathname + new URL(req.url).search : req.url;
				const fullUrl = `${proto}://${host}${path}`;
				const { NextRequest } = await import("next/server");
				reqToPass = new NextRequest(fullUrl, {
					method: req.method,
					headers: req.headers,
					body: req.method === "POST" ? await req.text() : undefined,
				});
			} catch {
				// If reconstruction fails, fall back to the original request.
				reqToPass = req;
			}
		}

		return await handler(reqToPass, ctx);
	} catch (e) {
		console.error("Auth route error:", e);
		return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
	}
}

export const GET = wrappedHandler;
export const POST = wrappedHandler;
