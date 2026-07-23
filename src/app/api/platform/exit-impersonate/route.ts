import { NextResponse } from "next/server";
import { CatchNextResponse } from "#utils/helper/common";
import { requirePlatformAdmin } from "#utils/helper/platformAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		await requirePlatformAdmin(req);

		const response = NextResponse.json({ message: "Impersonation ended" });

		response.cookies.set("impersonating", "", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			path: "/",
			maxAge: 0, // Expire immediately
		});

		return response;
	} catch (err) {
		return CatchNextResponse(err);
	}
}
