import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import AIConfig from "#utils/database/models/aiConfig";
import { CatchNextResponse } from "#utils/helper/common";
import { withPermission } from "#utils/helper/rbac";

export const GET = withPermission("settings.manage", async (_req, session) => {
	try {
		const restaurantID = session.username;
		await connectDB();

		const config = await AIConfig.findOne({ restaurantID }).lean();
		const keys = (config as Record<string, unknown> | null)?.providerKeys as Record<string, string> | undefined;

		const configured: Record<string, boolean> = {
			groq: !!keys?.groq || !!process.env.AI_GROQ_KEY,
			cerebras: !!keys?.cerebras || !!process.env.AI_CEREBRAS_KEY,
			google: !!keys?.google || !!process.env.AI_GOOGLE_KEY,
			siliconflow: !!keys?.siliconflow || !!process.env.AI_SILICONFLOW_KEY,
			huggingface: !!keys?.huggingface || !!process.env.AI_HUGGINGFACE_KEY,
		};

		return NextResponse.json({ configured });
	} catch (err) {
		return CatchNextResponse(err);
	}
});

export const POST = withPermission("settings.manage", async (req, session) => {
	try {
		const restaurantID = session.username;
		const body = await req.json();
		const { groq, cerebras, google, siliconflow, huggingface } = body;

		await connectDB();

		const update: Record<string, unknown> = {};
		if (groq !== undefined) update["providerKeys.groq"] = groq || "";
		if (cerebras !== undefined) update["providerKeys.cerebras"] = cerebras || "";
		if (google !== undefined) update["providerKeys.google"] = google || "";
		if (siliconflow !== undefined) update["providerKeys.siliconflow"] = siliconflow || "";
		if (huggingface !== undefined) update["providerKeys.huggingface"] = huggingface || "";
		update["providerKeys.updatedAt"] = new Date();

		await AIConfig.updateOne({ restaurantID }, { $set: update }, { upsert: true });

		return NextResponse.json({ status: 200, message: "AI keys saved" });
	} catch (err) {
		return CatchNextResponse(err);
	}
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
