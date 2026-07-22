import { Coupons } from "#utils/database/models/coupon";

function computeDiscount(coupon: { discountType: string; discountValue: number; maxDiscountAmount: number | null }, cartTotal: number) {
	if (coupon.discountType === "percentage") {
		const raw = cartTotal * (coupon.discountValue / 100);
		return coupon.maxDiscountAmount !== null ? Math.min(raw, coupon.maxDiscountAmount) : raw;
	}
	return Math.min(coupon.discountValue, cartTotal);
}

export async function validateAndRedeemCoupon(code: string, restaurantID: string, cartTotal: number) {
	const now = new Date();
	const coupon = await Coupons.findOneAndUpdate(
		{
			restaurantID,
			code: code.toUpperCase(),
			isActive: true,
			validFrom: { $lte: now },
			validUntil: { $gte: now },
			minOrderAmount: { $lte: cartTotal },
			$or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }],
		},
		{ $inc: { usedCount: 1 } },
		{ new: true },
	);

	if (!coupon) return null;

	return {
		code: coupon.code,
		discountType: coupon.discountType,
		discountValue: coupon.discountValue,
		discountAmount: computeDiscount(coupon, cartTotal),
	};
}
