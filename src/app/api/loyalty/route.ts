import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Loyalties, type TLoyalty, computeTier } from "#utils/database/models/loyalty";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		await connectDB();

		const restaurantID = session.restaurant?.username || session.username;
		const customerId = session.customer?._id;

		if (customerId && restaurantID) {
			const loyalty = await Loyalties.findOne({ restaurantID, customer: customerId }).populate("preferences.favoriteDishes").lean();
			return NextResponse.json(loyalty || { points: 0, tier: "silver", offers: [] });
		}

		if (session.role === "admin" && restaurantID) {
			const allLoyalty = await Loyalties.find({ restaurantID }).populate("customer").sort({ lifetimePoints: -1 }).limit(50).lean();
			return NextResponse.json(allLoyalty);
		}

		throw { status: 403, message: "Access denied" };
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const body = await req.json();
		const { action } = body;

		await connectDB();
		const restaurantID = session.restaurant?.username || session.username;
		const customerId = session.customer?._id;

		if (!restaurantID || !customerId) throw { status: 400, message: "Customer and restaurant required" };

		if (action === "award") {
			const { amount } = body;
			if (!amount) throw { status: 400, message: "Amount required" };

			let loyalty = await Loyalties.findOne({ restaurantID, customer: customerId });
			if (!loyalty) {
				loyalty = await Loyalties.create({ restaurantID, customer: customerId });
			}

			const points = Math.floor(amount / 10);
			loyalty.points += points;
			loyalty.lifetimePoints += points;
			loyalty.lastVisit = new Date();
			loyalty.visitCount += 1;

			const newTier = computeTier(loyalty.lifetimePoints);
			if (newTier !== loyalty.tier) loyalty.tier = newTier;

			await loyalty.save();

			return NextResponse.json({ status: 200, points, total: loyalty.points, tier: loyalty.tier });
		}

		if (action === "redeem") {
			const { points } = body;
			if (!points) throw { status: 400, message: "Points to redeem required" };

			const loyalty = await Loyalties.findOne({ restaurantID, customer: customerId });
			if (!loyalty) throw { status: 404, message: "No loyalty account found" };
			if (loyalty.points < points) throw { status: 400, message: "Insufficient points" };

			loyalty.points -= points;
			await loyalty.save();

			return NextResponse.json({ status: 200, remaining: loyalty.points });
		}

		throw { status: 400, message: "Invalid action" };
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}
