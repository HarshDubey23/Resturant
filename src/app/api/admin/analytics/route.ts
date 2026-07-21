import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { smartGenerateText } from "#utils/ai/switcher";
import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { currencySymbol } from "#utils/helper/currency";
import { getRestaurantCurrency } from "#utils/helper/currency-server";
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

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") throw { status: 401, message: "Admin access required" };

		await connectDB();
		const restaurantID = session.username;
		if (!restaurantID) throw { status: 400, message: "Restaurant ID required" };

		const currency = await getRestaurantCurrency(restaurantID);

		const { searchParams } = new URL(req.url);
		const range = searchParams.get("range") || "30d";

		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const dayRanges: Record<string, number> = { today: 0, "7d": 7, "30d": 30, "90d": 90 };
		const rangeDays = dayRanges[range] ?? 30;

		const rangeStart = rangeDays > 0 ? new Date(todayStart.getTime() - rangeDays * 86400000) : todayStart;

		const todayAgg = await Orders.aggregate([
			{ $match: { restaurantID, createdAt: { $gte: todayStart } } },
			{ $group: { _id: null, revenue: { $sum: { $add: ["$orderTotal", "$taxTotal"] } }, count: { $sum: 1 }, gst: { $sum: "$taxTotal" } } },
		]);

		const weekAgg = await Orders.aggregate([
			{ $match: { restaurantID, createdAt: { $gte: new Date(todayStart.getTime() - 7 * 86400000) } } },
			{ $group: { _id: null, revenue: { $sum: { $add: ["$orderTotal", "$taxTotal"] } }, count: { $sum: 1 } } },
		]);

		const monthAgg = await Orders.aggregate([
			{ $match: { restaurantID, createdAt: { $gte: rangeStart } } },
			{ $group: { _id: null, revenue: { $sum: { $add: ["$orderTotal", "$taxTotal"] } }, count: { $sum: 1 }, gst: { $sum: "$taxTotal" } } },
		]);

		const topDishesAgg = await Orders.aggregate([
			{ $match: { restaurantID, createdAt: { $gte: rangeStart } } },
			{ $unwind: "$products" },
			{ $group: { _id: "$products.name", count: { $sum: "$products.quantity" } } },
			{ $sort: { count: -1 } },
			{ $limit: 10 },
			{ $project: { _id: 0, name: "$_id", count: 1 } },
		]);

		const repeatAgg = await Orders.aggregate([
			{ $match: { restaurantID, createdAt: { $gte: rangeStart }, customer: { $exists: true, $ne: null } } },
			{ $group: { _id: "$customer", count: { $sum: 1 } } },
			{ $group: { _id: null, total: { $sum: 1 }, repeat: { $sum: { $cond: [{ $gte: ["$count", 2] }, 1, 0] } } } },
		]);

		const todayData = todayAgg[0] || { revenue: 0, count: 0, gst: 0 };
		const weekData = weekAgg[0] || { revenue: 0, count: 0 };
		const monthData = monthAgg[0] || { revenue: 0, count: 0, gst: 0 };
		const repeatData = repeatAgg[0] || { total: 0, repeat: 0 };

		const avgTicket = monthData.count > 0 ? monthData.revenue / monthData.count : 0;
		const repeatRate = repeatData.total > 0 ? (repeatData.repeat / repeatData.total) * 100 : 0;

		const completedToday = await Orders.countDocuments({ restaurantID, state: "complete", createdAt: { $gte: todayStart } });

		const analyticsData: AnalyticsData = {
			todayRevenue: todayData.revenue,
			weekRevenue: weekData.revenue,
			monthRevenue: monthData.revenue,
			topDishes: topDishesAgg,
			avgTicket,
			repeatRate,
			gstCollected: monthData.gst,
		};

		const aiCommentary = await generateAICommentary(analyticsData, restaurantID, currency);

		return NextResponse.json({
			live: {
				todayRevenue: todayData.revenue,
				todayOrders: todayData.count,
				completedToday,
				weekRevenue: weekData.revenue,
				monthRevenue: monthData.revenue,
				repeatRate: Math.round(repeatRate * 100) / 100,
				avgTicket: Math.round(avgTicket * 100) / 100,
				gstCollected: Math.round(monthData.gst * 100) / 100,
			},
			topDishes: topDishesAgg,
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

async function generateAICommentary(data: AnalyticsData, restaurantID: string, currency: string): Promise<string[]> {
	const prompt = `You are a restaurant business analyst. Given these metrics, return 3-5 actionable insights as a JSON array of strings.
Today revenue: ${currencySymbol(currency)}${data.todayRevenue}, Week: ${currencySymbol(currency)}${data.weekRevenue}, Month: ${currencySymbol(currency)}${data.monthRevenue}
Top dish: ${data.topDishes[0]?.name ?? "N/A"} (${data.topDishes[0]?.count ?? 0} orders)
Repeat rate: ${data.repeatRate.toFixed(1)}%, Avg ticket: ${currencySymbol(currency)}${data.avgTicket.toFixed(0)}
GST collected today: ${currencySymbol(currency)}${data.gstCollected.toFixed(0)}

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
		return fallbackRuleBasedCommentary(data, currency);
	}
}

function fallbackRuleBasedCommentary(data: AnalyticsData, currency: string): string[] {
	const comments: string[] = [];
	const top = data.topDishes[0];
	if (top && top.count > 10) {
		comments.push(`${top.name} is your top seller this month (${top.count} orders). Consider featuring it prominently.`);
	}
	if (data.repeatRate < 20) {
		comments.push(`Repeat customer rate is ${data.repeatRate.toFixed(0)}%. Launch a loyalty program to improve retention.`);
	}
	if (data.avgTicket < 300) {
		comments.push(`Average ticket is ${currencySymbol(currency)}${data.avgTicket.toFixed(0)}. Try bundling combos or suggesting add-ons.`);
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
