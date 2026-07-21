import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Campaigns } from "#utils/database/models/campaign";
import { CatchNextResponse } from "#utils/helper/common";
import { sendCampaign } from "#utils/whatsapp/campaign";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
	try {
		await connectDB();

		const now = new Date();
		const due = await Campaigns.find({
			status: "draft",
			scheduledAt: { $lte: now },
		}).lean();

		const processed: string[] = [];

		for (const campaign of due) {
			await Campaigns.updateOne({ _id: campaign._id }, { status: "sending" });
			sendCampaign(campaign._id.toString(), campaign.restaurantID, campaign.message).catch(() => {});
			processed.push(campaign._id.toString());
		}

		return NextResponse.json({ processed: processed.length, campaignIds: processed });
	} catch (err) {
		return CatchNextResponse(err);
	}
}
