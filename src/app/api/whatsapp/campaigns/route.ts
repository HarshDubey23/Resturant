import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Campaigns } from "#utils/database/models/campaign";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { sendCampaign } from "#utils/whatsapp/campaign";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		await connectDB();
		const restaurantID = session.username as string;

		const { searchParams } = new URL(req.url);
		const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
		const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
		const skip = (page - 1) * limit;

		const [campaigns, total] = await Promise.all([
			Campaigns.find({ restaurantID }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
			Campaigns.countDocuments({ restaurantID }),
		]);

		return NextResponse.json({
			campaigns,
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		});
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		const body = (await req.json()) as Record<string, unknown>;
		const title = String(body.title || "");
		const msg = String(body.message || "");
		if (!title || !msg) throw { status: 400, message: "title and message required" };

		await connectDB();
		const restaurantID = session.username as string;

		const campaign = await Campaigns.create({
			restaurantID,
			title,
			message: msg,
			status: body.scheduledAt ? "draft" : "sending",
			scheduledAt: body.scheduledAt ? new Date(body.scheduledAt as string) : undefined,
		});

		if (!body.scheduledAt) {
			sendCampaign(campaign._id.toString(), restaurantID, msg).catch(() => {});
		}

		return NextResponse.json({ status: 200, message: "Campaign created", campaign });
	} catch (err) {
		return CatchNextResponse(err);
	}
}
