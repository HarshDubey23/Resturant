import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Campaigns } from "#utils/database/models/campaign";
import { Customers } from "#utils/database/models/customer";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { sendWhatsAppText } from "#utils/whatsapp/index";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		await connectDB();
		const restaurantID = session.username;

		const campaigns = await Campaigns.find({ restaurantID })
			.sort({ createdAt: -1 })
			.limit(50)
			.lean();

		return NextResponse.json(campaigns);
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		const body = await req.json() as Record<string, unknown>;
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
			sendCampaign(campaign._id.toString(), restaurantID, msg);
		}

		return NextResponse.json({ status: 200, message: "Campaign created", campaign });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

async function sendCampaign(campaignId: string, restaurantID: string, msg: string) {
	try {
		await connectDB();

		const orders = await Orders.find({ restaurantID }).distinct("customer");
		const optedIn = await Customers.find({
			_id: { $in: orders },
			whatsappOptIn: true,
			phone: { $exists: true, $ne: "" },
		}).lean();

		const phones = Array.from(new Set(optedIn.map((c) => c.phone)));
		let sent = 0;
		let failed = 0;

		await Campaigns.updateOne({ _id: campaignId }, { totalCount: phones.length });

		for (const phone of phones) {
			try {
				await sendWhatsAppText(phone, msg);
				sent++;
			} catch {
				failed++;
			}
		}

		await Campaigns.updateOne(
			{ _id: campaignId },
			{ status: failed === phones.length ? "failed" : "sent", sentCount: sent, failedCount: failed, sentAt: new Date() },
		);
	} catch (err) {
		console.log("Campaign send error:", err);
		await Campaigns.updateOne({ _id: campaignId }, { status: "failed" });
	}
}
