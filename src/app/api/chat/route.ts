import { getServerSession } from "next-auth";
import { getSystemPrompt } from "#utils/ai/prompt";
import { smartGenerateText } from "#utils/ai/switcher";
import connectDB from "#utils/database/connect";
import { getRestaurantData } from "#utils/database/helper/account";
import { Accounts } from "#utils/database/models/account";
import AIConfig from "#utils/database/models/aiConfig";
import { Loyalties } from "#utils/database/models/loyalty";
import type { TMenu } from "#utils/database/models/menu";
import { cacheGet, cacheSet } from "#utils/database/redis";
import { authOptions } from "#utils/helper/authHelper";
import { rateLimitMiddleware } from "#utils/helper/rateLimit";
import { sanitizeAiHtml } from "#utils/helper/sanitizeHtml";
import { captureError } from "#utils/helper/sentryWrapper";
import { chatSchema } from "#utils/helper/validation";

const DAILY_TOKEN_BUDGET = 100000;
const DAILY_COST_BUDGET = 2.0;

async function checkDailyBudget(restaurantID: string): Promise<{ allowed: boolean; reason?: string }> {
	try {
		await connectDB();
		let config = await AIConfig.findOne({ restaurantID });
		if (!config) config = await AIConfig.create({ restaurantID });
		const now = new Date();
		const lastReset = config.dailyBudget?.lastReset ?? new Date(0);
		if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
			config.dailyBudget = { tokenLimit: DAILY_TOKEN_BUDGET, costLimit: DAILY_COST_BUDGET, tokensUsed: 0, costUsed: 0, lastReset: now };
			config.dailyTtsChars = 0;
			config.lastTtsReset = now;
			await config.save();
		}
		const budget = config.dailyBudget ?? { tokenLimit: DAILY_TOKEN_BUDGET, costLimit: DAILY_COST_BUDGET, tokensUsed: 0, costUsed: 0, lastReset: now };
		if (budget.tokensUsed >= budget.tokenLimit) return { allowed: false, reason: "Daily AI token budget exceeded" };
		if (budget.costUsed >= budget.costLimit) return { allowed: false, reason: "Daily AI cost budget exceeded" };
		return { allowed: true };
	} catch {
		return { allowed: true };
	}
}

async function recordDailyUsage(restaurantID: string, tokens: number, cost: number): Promise<void> {
	try {
		await AIConfig.findOneAndUpdate({ restaurantID }, { $inc: { "dailyBudget.tokensUsed": tokens, "dailyBudget.costUsed": cost } });
	} catch {}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const ip = req.headers.get("x-forwarded-for") ?? "unknown";
		const rateLimitResponse = await rateLimitMiddleware(`chat:${ip}`, 20, 60000);
		if (rateLimitResponse) return rateLimitResponse;

		const body = await req.json();
		const parsed = chatSchema.safeParse(body);
		if (!parsed.success) {
			return Response.json({ text: "Invalid request", toolResults: [], errors: parsed.error.flatten().fieldErrors }, { status: 400 });
		}

		const { messages, restaurantId } = parsed.data;

		const session = await getServerSession(authOptions);
		if (!session) return Response.json({ text: "Please login to chat with Jarvis", toolResults: [] }, { status: 401 });

		// ── Plan enforcement: AI chat is a Pro feature ──
		const accountPlan = (session as unknown as Record<string, unknown>)?.plan ?? "free";
		if (accountPlan === "free") {
			await connectDB();
			const freshAccount = await Accounts.findOne({ username: restaurantId });
			if (!freshAccount || freshAccount.plan === "free") {
				return Response.json(
					{
						text: "AI chat is a Pro feature. Upgrade your plan to unlock Jarvis.",
						toolResults: [],
						upgradeUrl: "/dashboard?tab=settings&subTab=billing",
					},
					{ status: 402 },
				);
			}
		}

		const name = restaurantId.replace(/\b\w/g, (c: string) => c.toUpperCase()).replace(/[-_]/g, " ");
		const account = await getRestaurantData(restaurantId).catch(() => null);

		if (!account) return Response.json({ text: `Restaurant '${name}' not found`, toolResults: [] }, { status: 404 });

		const items: TMenu[] = account?.menus || [];
		const menuMap = new Map(items.map((i) => [i.name.toLowerCase(), i]));

		const budget = await checkDailyBudget(restaurantId);
		if (!budget.allowed) {
			return Response.json({ text: `I've reached my limit for today. Please try again tomorrow.`, toolResults: [] }, { status: 429 });
		}

		const customerId = session?.customer?._id;
		let memory = null;
		try {
			await connectDB();
			if (restaurantId && customerId) {
				const loyalty = await Loyalties.findOne({ restaurantID: restaurantId, customer: customerId }).populate("preferences.favoriteDishes").lean();
				if (loyalty) {
					memory = {
						isReturning: (loyalty.visitCount || 0) > 1,
						visitCount: loyalty.visitCount || 0,
						tier: loyalty.tier || "silver",
						totalPoints: loyalty.points || 0,
						preferences: {
							language: loyalty.preferences?.language,
							spiceTolerance: loyalty.preferences?.spiceTolerance,
							allergens: loyalty.preferences?.allergens,
							favoriteDishes: loyalty.preferences?.favoriteDishes as Array<{ name: string }> | undefined,
							notes: loyalty.preferences?.notes,
						},
						birthday: loyalty.birthday?.toISOString(),
					};
				}
			}
		} catch {
			console.log("Failed to load customer memory");
		}

		let conversationContext: string[] = [];
		if (customerId) {
			try {
				const saved = await cacheGet<string[]>(`chat:ctx:${restaurantId}:${customerId}`);
				if (saved) conversationContext = saved;
			} catch {}
		}

		const systemPrompt = getSystemPrompt(name, items, session?.customer?.fname, memory);
		const result = await smartGenerateText(restaurantId, {
			system: systemPrompt,
			messages,
		});

		const inputTokens = result.usage?.inputTokens ?? 0;
		const outputTokens = result.usage?.outputTokens ?? 0;
		const totalTokens = inputTokens + outputTokens;
		const estimatedCost = totalTokens * 0.000002;
		recordDailyUsage(restaurantId, totalTokens, estimatedCost).catch(() => {});

		if (customerId) {
			try {
				const updated = [...conversationContext, ...messages.slice(-2).map((m) => `${m.role}:${(m.content || "").slice(0, 200)}`)].slice(-20);
				await cacheSet(`chat:ctx:${restaurantId}:${customerId}`, updated, 86400);
			} catch {}
		}

		// Extract the machine-readable recommendation tag from the RAW model
		// output first — the sanitizer would otherwise escape its angle brackets.
		let text = result.text;
		const toolResults: TMenu[][] = [];
		const match = text.match(/<<<REC:?(.*?)>>>/);

		if (match) {
			text = text.replace(match[0], "").trim();
			try {
				const names = JSON.parse(match[1]);
				if (Array.isArray(names)) {
					const found = names.map((n: string) => menuMap.get(n.toLowerCase())).filter((i): i is TMenu => !!i);
					if (found.length) toolResults.push(found);
				}
			} catch (e) {
				captureError(e instanceof Error ? e : new Error(`Failed to parse recommendation JSON: ${match[1]}`), { route: "chat/recommendation", raw: match[1] });
			}
		}

		// Sanitize AI output server-side before it ever reaches a browser.
		// The model is instructed to respond with limited HTML; anything outside
		// the strict allowlist (scripts, iframes, event handlers, data: URIs)
		// is stripped here as the primary XSS defense.
		text = sanitizeAiHtml(text);

		return Response.json({ text, toolResults });
	} catch (error) {
		console.error("Error in AI Chat API:", error);
		return Response.json({ text: "I apologize, but I'm having trouble connecting right now. Please try again.", toolResults: [] }, { status: 500 });
	}
}
