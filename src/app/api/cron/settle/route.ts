import { NextResponse } from "next/server";
import { inngest } from "#utils/queue/inngest-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
	const authHeader = req.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response("Unauthorized", { status: 401 });
	}

	// Backward compat: enqueue the Inngest scheduled function
	// The actual work is now done by the daily-settlement Inngest function
	await inngest.send({
		name: "inngest/function.invoked",
		data: { fnId: "daily-settlement" },
	});

	return NextResponse.json({ message: "Settlement enqueued via Inngest" });
}
