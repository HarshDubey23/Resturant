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

		return await handler(req, ctx);
	} catch (e) {
		console.error("Auth route error:", e);
		return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
	}
}

export const GET = wrappedHandler;
export const POST = wrappedHandler;
