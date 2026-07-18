import NextAuth from "next-auth";

import { authOptions } from "#utils/helper/authHelper";
import { rateLimitMiddleware } from "#utils/helper/rateLimit";

const handler = NextAuth(authOptions);

async function wrappedHandler(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
	const ip = req.headers.get("x-forwarded-for") ?? "unknown";
	const rateLimitResponse = req.method === "POST" ? rateLimitMiddleware(`auth:${ip}`, 10, 60000) : null;
	if (rateLimitResponse) return rateLimitResponse;

	return handler(req, ctx);
}

export { wrappedHandler as GET, wrappedHandler as POST };
