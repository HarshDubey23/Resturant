import { NextResponse } from "next/server";
import { z } from "zod";
import { CatchNextResponse } from "#utils/helper/common";
import { requirePlatformAdmin } from "#utils/helper/platformAdmin";

export const runtime = "nodejs";

const ImpersonateSchema = z.object({
	accountId: z.string().min(1),
});

export async function POST(req: Request) {
	try {
		const session = await requirePlatformAdmin(req);

		const body = await req.json();
		const parsed = ImpersonateSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
		}

		const { accountId } = parsed.data;

		// Set impersonating cookie with the account ID
		const response = NextResponse.json({ message: "Impersonation started", accountId, impersonatedBy: session.username });

		response.cookies.set("impersonating", accountId, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			path: "/",
			maxAge: 60 * 60, // 1 hour max impersonation session
		});

		return response;
	} catch (err) {
		return CatchNextResponse(err);
	}
}
