import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Campaigns } from "#utils/database/models/campaign";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { sendCampaign } from "#utils/whatsapp/campaign";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		await connectDB();
		const restaurantID = session.username as string;

		const campaign = await Campaigns.findOne({ _id: id, restaurantID }).lean();
		if (!campaign) throw { status: 404, message: "Campaign not found" };

		await Campaigns.updateOne({ _id: id }, { status: "sending", sentCount: 0, failedCount: 0 });
		sendCampaign(id, restaurantID, campaign.message).catch(() => {});

		return NextResponse.json({ status: 200, message: "Retrying campaign send" });
	} catch (err) {
		return CatchNextResponse(err);
	}
}
