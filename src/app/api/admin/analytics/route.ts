import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { smartGenerateText } from "#utils/ai/switcher";
import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";

type AnalyticsData = {
	todayRevenue: number;
	weekRevenue: number;
	monthRevenue: number;
	topDishes: Array<{ name: string; count: number }>;
	avgTicket: number;
	repeatRate: number;
	gstCollected: number;
};

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		await connectDB();
		const restaurantID = session.username;
		if (!restaurantID) throw { status: 400, message: "Restaurant ID required" };

		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 86400000);
		const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 86400000);
		const _ninetyDaysAgo = new Date(todayStart.getTime() - 90 * 86400000);

		const allOrders = await Orders.find({ restaurantID }).populate("customer").lean();

		const todayOrders = allOrders.filter((o) => new Date(o.createdAt || "") >= todayStart);
		const recentOrders = allOrders.filter((o) => new Date(o.createdAt || "") >= sevenDaysAgo);
		const monthOrders = allOrders.filter((o) => new Date(o.createdAt || "") >= thirtyDaysAgo);

		const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.orderTotal || 0) + (o.taxTotal || 0), 0);
		const weekRevenue = recentOrders.reduce((sum, o) => sum + (o.orderTotal || 0) + (o.taxTotal || 0), 0);
		const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.orderTotal || 0) + (o.taxTotal || 0), 0);

		const completedToday = todayOrders.filter((o) => o.state === "complete").length;

		const productCounts: Record<string, number> = {};
		for (const order of monthOrders) {
			for (const product of order.products) {
				const name = ((product as unknown as Record<string, unknown>).name as string) || product.product?.toString() || "unknown";
				productCounts[name] = (productCounts[name] || 0) + product.quantity;
			}
		}

		const topDishes = Object.entries(productCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10)
			.map(([name, count]) => ({ name, count }));

		const uniqueCustomers = new Set(allOrders.map((o) => o.customer?.toString()).filter(Boolean));
		const returningCustomers = allOrders.reduce<Record<string, number>>((acc, o) => {
			const id = o.customer?.toString();
			if (id) acc[id] = (acc[id] || 0) + 1;
			return acc;
		}, {});
		const repeatCount = Object.values(returningCustomers).filter((c) => c > 1).length;
		const repeatRate = uniqueCustomers.size > 0 ? (repeatCount / uniqueCustomers.size) * 100 : 0;

		const avgTicket = monthOrders.length > 0 ? monthOrders.reduce((sum, o) => sum + (o.orderTotal || 0) + (o.taxTotal || 0), 0) / monthOrders.length : 0;
		const gstCollected = monthOrders.reduce((sum, o) => sum + (o.taxTotal || 0), 0);

		const analyticsData: AnalyticsData = { todayRevenue, weekRevenue, monthRevenue, topDishes, avgTicket, repeatRate, gstCollected };
		const aiCommentary = await generateAICommentary(analyticsData, restaurantID);

		return NextResponse.json({
			live: {
				todayRevenue,
				todayOrders: todayOrders.length,
				completedToday,
				weekRevenue,
				monthRevenue,
				repeatRate: Math.round(repeatRate * 100) / 100,
				avgTicket: Math.round(avgTicket * 100) / 100,
				gstCollected: Math.round(gstCollected * 100) / 100,
			},
			topDishes,
			peakHours: [],
			topCustomers: [],
			churnedCustomers: [],
			aiCommentary,
		});
	} catch (err) {
		captureError(err, { route: "/api/admin/analytics" });
		return CatchNextResponse(err);
	}
}

async function generateAICommentary(data: AnalyticsData, restaurantID: string): Promise<string[]> {
	const prompt = `You are a restaurant business analyst. Given these metrics, return 3-5 actionable insights as a JSON array of strings.
Today revenue: ₹${data.todayRevenue}, Week: ₹${data.weekRevenue}, Month: ₹${data.monthRevenue}
Top dish: ${data.topDishes[0]?.name ?? "N/A"} (${data.topDishes[0]?.count ?? 0} orders)
Repeat rate: ${data.repeatRate.toFixed(1)}%, Avg ticket: ₹${data.avgTicket.toFixed(0)}
GST collected today: ₹${data.gstCollected.toFixed(0)}

Return ONLY a JSON array of strings, no preamble.`;

	try {
		const result = await smartGenerateText(restaurantID, {
			messages: [
				{ role: "system", content: "You are a JSON-only responder. Return a JSON array of strings." },
				{ role: "user", content: prompt },
			],
		} as Parameters<typeof smartGenerateText>[1]);
		return JSON.parse(result.text);
	} catch (err) {
		captureError(err, { route: "analytics/commentary" });
		return fallbackRuleBasedCommentary(data);
	}
}

function fallbackRuleBasedCommentary(data: AnalyticsData): string[] {
	const comments: string[] = [];
	const top = data.topDishes[0];
	if (top && top.count > 10) {
		comments.push(`${top.name} is your top seller this month (${top.count} orders). Consider featuring it prominently.`);
	}
	if (data.repeatRate < 20) {
		comments.push(`Repeat customer rate is ${data.repeatRate.toFixed(0)}%. Launch a loyalty program to improve retention.`);
	}
	if (data.avgTicket < 300) {
		comments.push(`Average ticket is ₹${data.avgTicket.toFixed(0)}. Try bundling combos or suggesting add-ons.`);
	}
	if (data.todayRevenue > (data.weekRevenue / 7) * 1.3) {
		comments.push("Today's revenue is 30% above your weekly average — great momentum!");
	}
	if (comments.length === 0) {
		comments.push("Your restaurant is performing steadily. Check back after more orders for AI insights.");
	}
	return comments;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
