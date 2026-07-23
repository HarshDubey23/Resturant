import { NextResponse } from "next/server";
import { CatchNextResponse } from "#utils/helper/common";
import { inngest } from "#utils/queue/inngest-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
	try {
		const authHeader = req.headers.get("Authorization");
		if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
			throw { status: 401, message: "Unauthorized" };
		}

		// Backward compat: enqueue the Inngest scheduled function
		// The actual work is now done by the birthday-offer Inngest function
		await inngest.send({
			name: "inngest/function.invoked",
			data: { fnId: "birthday-offer" },
		});

		return NextResponse.json({ message: "Birthday offer enqueued via Inngest" });
	} catch (err) {
		return CatchNextResponse(err);
	}
}
