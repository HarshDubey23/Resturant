import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Campaigns } from "#utils/database/models/campaign";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		await connectDB();
		const restaurantID = session.username as string;

		const campaign = await Campaigns.findOne({ _id: id, restaurantID }).lean();
		if (!campaign) throw { status: 404, message: "Campaign not found" };

		return NextResponse.json(campaign);
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		await connectDB();
		const restaurantID = session.username as string;

		const campaign = await Campaigns.findOneAndDelete({ _id: id, restaurantID });
		if (!campaign) throw { status: 404, message: "Campaign not found" };

		return NextResponse.json({ status: 200, message: "Campaign deleted" });
	} catch (err) {
		return CatchNextResponse(err);
	}
}
