import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import z from "zod";

import connectDB from "#utils/database/connect";
import { computePoints, computeTier, Loyalties } from "#utils/database/models/loyalty";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
			const awardSchema = z.object({ orderId: z.string().min(1), amount: z.number().positive() });
			const parsed = awardSchema.safeParse(body);
			if (!parsed.success) throw { status: 400, message: parsed.error.issues[0].message };

			const { orderId, amount } = parsed.data;
			if (amount > 100000) throw { status: 400, message: "Amount exceeds maximum allowed (100000)" };

			const order = await Orders.findById(orderId);
			if (!order) throw { status: 404, message: "Order not found" };
			if (order.restaurantID !== restaurantID) throw { status: 403, message: "Order belongs to another restaurant" };
			if (order.customer?.toString() !== customerId) throw { status: 403, message: "Order does not belong to this customer" };
			if (order.state !== "complete") throw { status: 400, message: "Order is not completed" };
			if (order.loyaltyAwarded) throw { status: 409, message: "Loyalty points already awarded for this order" };

			const claimed = await Orders.findOneAndUpdate(
				{ _id: orderId, loyaltyAwarded: { $ne: true } },
				{ $set: { loyaltyAwarded: true } },
				{ new: true },
			);
			if (!claimed) throw { status: 409, message: "Loyalty points already awarded for this order" };

			let loyalty = await Loyalties.findOne({ restaurantID, customer: customerId });
			if (!loyalty) {
				loyalty = await Loyalties.create({ restaurantID, customer: customerId });
			}

			const points = computePoints(order.orderTotal, loyalty.tier);
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
			if (!points || points <= 0) throw { status: 400, message: "Valid positive points value required" };

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
