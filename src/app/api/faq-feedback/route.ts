import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(() => null);
		const question = typeof body?.question === "string" ? body.question.trim() : "";
		const helpful = body?.helpful === true;

		if (!question) {
			return NextResponse.json({ error: "Question is required" }, { status: 400 });
		}
		if (typeof body?.helpful !== "boolean") {
			return NextResponse.json({ error: "Helpful flag must be a boolean" }, { status: 400 });
		}

		await db.faqFeedback.create({
			data: { question, helpful },
		});

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("FAQ feedback error:", error);
		return NextResponse.json({ error: "Failed to record feedback" }, { status: 500 });
	}
}
