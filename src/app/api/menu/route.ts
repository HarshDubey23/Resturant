import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
	try {
		const items = await db.menuItem.findMany({
			where: { available: true },
			orderBy: { createdAt: "asc" },
		});

		return NextResponse.json({ items });
	} catch (err) {
		console.error("Menu fetch error:", err);
		return NextResponse.json(
			{ items: [], error: "Failed to load menu" },
			{ status: 500 },
		);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
