import { NextResponse } from "next/server";
import { env as n8nEnv } from "#lib/n8n/env";
import connectDB from "#utils/database/connect";
import { getRedis } from "#utils/database/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
	const checks: Record<string, "ok" | "fail" | "skip"> = {
		mongo: "skip",
		redis: "skip",
		aiProviders: "skip",
		n8n: "skip",
		stripe: "skip",
		razorpay: "skip",
	};

	try {
		await connectDB();
		checks.mongo = "ok";
	} catch {
		checks.mongo = "fail";
	}

	try {
		await getRedis().ping();
		checks.redis = "ok";
	} catch {
		checks.redis = "fail";
	}

	const aiKeys = ["AI_GROQ_KEY", "AI_CEREBRAS_KEY", "AI_GOOGLE_KEY", "AI_SILICONFLOW_KEY"];
	checks.aiProviders = aiKeys.some((k) => process.env[k]) ? "ok" : "fail";

	checks.n8n = n8nEnv.N8N_WEBHOOK_URL && n8nEnv.N8N_WEBHOOK_SECRET ? "ok" : "skip";
	checks.stripe = process.env.STRIPE_SECRET_KEY ? "ok" : "skip";
	checks.razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? "ok" : "skip";

	const allOk = Object.values(checks).every((v) => v !== "fail");
	return NextResponse.json(
		{ status: allOk ? "ok" : "degraded", checks, ts: Date.now() },
		{
			status: allOk ? 200 : 503,
		},
	);
}
