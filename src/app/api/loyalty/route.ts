import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import z from "zod";

import connectDB from "#utils/database/connect";
import { awardPointsAtomic, redeemPointsAtomic } from "#utils/database/helper/loyalty";
import { Loyalties } from "#utils/database/models/loyalty";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";

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
		captureError(err, { route: "/api/loyalty GET" });
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
			// Single source of truth for loyalty award is the payment-success
			// webhook (/api/payment/webhook, /api/payment/verify, /api/payment/stripe/webhook).
			// This endpoint exists as a fallback for orders that completed
			// before the webhook fired (e.g. legacy data). The loyaltyAwarded
			// gate below makes it a no-op once points have been minted —
			// concurrent callers and double-fires from the webhook all
			// collapse to a single award.
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

			const claimed = await Orders.findOneAndUpdate({ _id: orderId, loyaltyAwarded: { $ne: true } }, { $set: { loyaltyAwarded: true } }, { new: true });
			if (!claimed) throw { status: 409, message: "Loyalty points already awarded for this order" };

			// Single atomic mutation: upsert + increment, never read-modify-write.
			const award = await awardPointsAtomic(restaurantID, customerId, order.orderTotal);
			if (!award) throw { status: 500, message: "Failed to award loyalty points" };

			return NextResponse.json({ status: 200, points: award.pointsEarned, total: award.loyalty.points, tier: award.newTier });
		}

		if (action === "redeem") {
			const { points } = body;
			if (!points || points <= 0) throw { status: 400, message: "Valid positive points value required" };

			// Balance guard lives inside the atomic query — balance can never
			// go negative under concurrent redemptions.
			const loyalty = await redeemPointsAtomic(restaurantID, customerId, points);
			if (!loyalty) throw { status: 400, message: "Insufficient points or no loyalty account found" };

			return NextResponse.json({ status: 200, remaining: loyalty.points });
		}

		throw { status: 400, message: "Invalid action" };
	} catch (err) {
		captureError(err, { route: "/api/loyalty POST" });
		return CatchNextResponse(err);
	}
}
