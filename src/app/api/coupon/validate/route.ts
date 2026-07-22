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

		const coupon = await Coupons.findOne({ restaurantID, code: code.toUpperCase() });
		if (!coupon) {
			return NextResponse.json({ valid: false, reason: "Invalid coupon code" }, { status: 200 });
		}

		const now = new Date();
		if (!coupon.isActive) {
			return NextResponse.json({ valid: false, reason: "Coupon is not active" }, { status: 200 });
		}
		if (now < coupon.validFrom) {
			return NextResponse.json({ valid: false, reason: "Coupon is not yet valid" }, { status: 200 });
		}
		if (now > coupon.validUntil) {
			return NextResponse.json({ valid: false, reason: "Coupon has expired" }, { status: 200 });
		}
		if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
			return NextResponse.json({ valid: false, reason: "Coupon usage limit reached" }, { status: 200 });
		}
		if (cartTotal < coupon.minOrderAmount) {
			return NextResponse.json({ valid: false, reason: `Minimum order amount is ${coupon.minOrderAmount}` }, { status: 200 });
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
