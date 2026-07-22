import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Campaigns } from "#utils/database/models/campaign";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { timingSafeStringEqual } from "#utils/helper/crypto";
import { sendCampaign } from "#utils/whatsapp/campaign";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Processes due scheduled campaigns. Invoked by an external cron scheduler
 * (Vercel Cron, GitHub Actions, etc.) which must present the CRON_SECRET as a
 * Bearer token. Admin users may also trigger it from the dashboard.
 * Unauthenticated invocation is rejected — previously this endpoint was fully
 * open, allowing anyone to blast WhatsApp campaigns and exhaust quotas.
 */
async function isAuthorized(req: Request): Promise<boolean> {
	const cronSecret = process.env.CRON_SECRET;
	if (cronSecret) {
		const authHeader = req.headers.get("authorization") ?? "";
		const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
		if (token && timingSafeStringEqual(token, cronSecret)) return true;
	}
	// Fall back to an authenticated admin session (manual trigger from dashboard)
	const session = await getServerSession(authOptions);
	return session?.role === "admin";
}

export async function GET(req: Request) {
	try {
		if (!(await isAuthorized(req))) throw { status: 401, message: "Unauthorized" };

		await connectDB();

		const now = new Date();
		const due = await Campaigns.find({
			status: "draft",
			scheduledAt: { $lte: now },
		}).lean();

		const processed: string[] = [];

		for (const campaign of due) {
			// Atomic claim: only one concurrent invocation may move a campaign
			// out of "draft", preventing duplicate sends from racing crons.
			const claimed = await Campaigns.findOneAndUpdate({ _id: campaign._id, status: "draft" }, { $set: { status: "sending" } }, { new: true });
			if (!claimed) continue;
			sendCampaign(campaign._id.toString(), campaign.restaurantID, campaign.message).catch(() => {});
			processed.push(campaign._id.toString());
		}

		return NextResponse.json({ processed: processed.length, campaignIds: processed });
	} catch (err) {
		return CatchNextResponse(err);
	}
}
