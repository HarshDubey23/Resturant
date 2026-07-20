import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import AIConfig from "#utils/database/models/aiConfig";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		const restaurantID = session.username;
		await connectDB();

		const config = await AIConfig.findOne({ restaurantID }).lean();
		const keys = (config as Record<string, unknown> | null)?.providerKeys as Record<string, string> | undefined;

		const configured: Record<string, boolean> = {
			groq: !!keys?.groq || !!process.env.AI_GROQ_KEY,
			cerebras: !!keys?.cerebras || !!process.env.AI_CEREBRAS_KEY,
			google: !!keys?.google || !!process.env.AI_GOOGLE_KEY,
			siliconflow: !!keys?.siliconflow || !!process.env.AI_SILICONFLOW_KEY,
		};

		return NextResponse.json({ configured });
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		const restaurantID = session.username;
		const body = await req.json();
		const { groq, cerebras, google, siliconflow } = body;

		await connectDB();

		const update: Record<string, unknown> = {};
		if (groq !== undefined) update["providerKeys.groq"] = groq || "";
		if (cerebras !== undefined) update["providerKeys.cerebras"] = cerebras || "";
		if (google !== undefined) update["providerKeys.google"] = google || "";
		if (siliconflow !== undefined) update["providerKeys.siliconflow"] = siliconflow || "";
		update["providerKeys.updatedAt"] = new Date();

		await AIConfig.updateOne({ restaurantID }, { $set: update }, { upsert: true });

		return NextResponse.json({ status: 200, message: "AI keys saved" });
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
