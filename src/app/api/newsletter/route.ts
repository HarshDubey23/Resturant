import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(() => null);
		const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
		const source = typeof body?.source === "string" && body.source.trim() ? body.source.trim() : "homepage";

		if (!email) {
			return NextResponse.json({ error: "Email is required" }, { status: 400 });
		}
		if (!EMAIL_REGEX.test(email)) {
			return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
		}

		const existing = await db.newsletterSubscriber.findUnique({
			where: { email },
			select: { id: true },
		});

		if (existing) {
			return NextResponse.json({ ok: true, alreadySubscribed: true });
		}

		await db.newsletterSubscriber.create({
			data: { email, source },
		});

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Newsletter subscription error:", error);
		return NextResponse.json({ error: "Failed to subscribe. Please try again." }, { status: 500 });
	}
}
