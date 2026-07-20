import { getServerSession } from "next-auth";
import { getSystemPrompt } from "#utils/ai/prompt";
import { smartGenerateText } from "#utils/ai/switcher";
import { captureError } from "#utils/helper/sentryWrapper";
import connectDB from "#utils/database/connect";
import { getRestaurantData } from "#utils/database/helper/account";
import { Loyalties } from "#utils/database/models/loyalty";
import type { TMenu } from "#utils/database/models/menu";
import { authOptions } from "#utils/helper/authHelper";
import { rateLimitMiddleware } from "#utils/helper/rateLimit";
import { chatSchema } from "#utils/helper/validation";

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

		const name = restaurantId.replace(/\b\w/g, (c: string) => c.toUpperCase()).replace(/[-_]/g, " ");
		const account = await getRestaurantData(restaurantId).catch(() => null);

		if (!account) return Response.json({ text: `Restaurant '${name}' not found`, toolResults: [] }, { status: 404 });

		const items: TMenu[] = account?.menus || [];
		const menuMap = new Map(items.map((i) => [i.name.toLowerCase(), i]));

		let memory = null;
		try {
			await connectDB();
			const customerId = session?.customer?._id;
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

		const result = await smartGenerateText(restaurantId, {
			system: getSystemPrompt(name, items, session?.customer?.fname, memory),
			messages,
		});

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

		return Response.json({ text, toolResults });
	} catch (error) {
		console.error("Error in AI Chat API:", error);
		return Response.json({ text: "I apologize, but I'm having trouble connecting right now. Please try again.", toolResults: [] }, { status: 500 });
	}
}
