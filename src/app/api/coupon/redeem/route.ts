import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Coupons } from "#utils/database/models/coupon";
import { CatchNextResponse } from "#utils/helper/common";

function calculateDiscount(coupon: { discountType: "percentage" | "flat"; discountValue: number; maxDiscountAmount: number | null }, cartTotal: number): number {
	if (coupon.discountType === "flat") {
		return Math.min(coupon.discountValue, cartTotal);
	}
	const discount = (cartTotal * coupon.discountValue) / 100;
	return coupon.maxDiscountAmount ? Math.min(discount, coupon.maxDiscountAmount) : discount;
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { code, cartTotal, restaurantID } = body;

		if (!code || typeof cartTotal !== "number" || !restaurantID) {
			throw { status: 400, message: "code, cartTotal and restaurantID are required" };
		}

		await connectDB();

		const coupon = await Coupons.findOneAndUpdate(
			{
				restaurantID,
				code: code.toUpperCase(),
				isActive: true,
				validFrom: { $lte: new Date() },
				validUntil: { $gte: new Date() },
				minOrderAmount: { $lte: cartTotal },
				$expr: { $or: [{ $eq: ["$usageLimit", null] }, { $lt: ["$usedCount", "$usageLimit"] }] },
			},
			{ $inc: { usedCount: 1 } },
			{ new: true },
		);

		if (!coupon) {
			return NextResponse.json({ valid: false, reason: "Coupon is invalid, expired, or usage limit reached" }, { status: 200 });
		}

		const discount = calculateDiscount(coupon, cartTotal);
		const newTotal = Math.max(0, cartTotal - discount);

		return NextResponse.json({
			valid: true,
			code: coupon.code,
			discountType: coupon.discountType,
			discountValue: coupon.discountValue,
			discount,
			newTotal,
		});
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
