import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Loyalties } from "#utils/database/models/loyalty";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		await connectDB();
		const restaurantID = session.restaurant?.username;
		const customerId = session.customer?._id;

		if (!restaurantID || !customerId) {
			return NextResponse.json({ memory: null });
		}

		const loyalty = await Loyalties.findOne({ restaurantID, customer: customerId }).populate("preferences.favoriteDishes").lean();

		if (!loyalty) {
			return NextResponse.json({ memory: null });
		}

		const memory = {
			name: session.customer?.fname || "Guest",
			phone: session.customer?.phone,
			isReturning: (loyalty.visitCount || 0) > 1,
			visitCount: loyalty.visitCount || 0,
			lastVisit: loyalty.lastVisit,
			tier: loyalty.tier,
			totalPoints: loyalty.points,
			lifetimePoints: loyalty.lifetimePoints,
			preferences: loyalty.preferences || {},
			birthday: loyalty.birthday,
			anniversary: loyalty.anniversary,
		};

		return NextResponse.json({ memory });
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
		await connectDB();

		const restaurantID = session.restaurant?.username;
		const customerId = session.customer?._id;
		if (!restaurantID || !customerId) throw { status: 400, message: "Customer and restaurant required" };

		let loyalty = await Loyalties.findOne({ restaurantID, customer: customerId });
		if (!loyalty) loyalty = await Loyalties.create({ restaurantID, customer: customerId });

		const { preferences, birthday, anniversary } = body;

		if (preferences) {
			if (preferences.language) loyalty.preferences.language = preferences.language;
			if (preferences.spiceTolerance) loyalty.preferences.spiceTolerance = preferences.spiceTolerance;
			if (preferences.allergens) loyalty.preferences.allergens = preferences.allergens;
			if (preferences.notes) loyalty.preferences.notes = preferences.notes;
		}
		if (birthday) loyalty.birthday = new Date(birthday);
		if (anniversary) loyalty.anniversary = new Date(anniversary);

		await loyalty.save();

		return NextResponse.json({ status: 200, message: "Memory updated" });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}
