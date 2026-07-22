import type mongoose from "mongoose";
import { computePoints, computeTier, Loyalties, type TLoyalty } from "#utils/database/models/loyalty";

type CustomerRef = string | mongoose.Types.ObjectId;

/**
 * Atomic loyalty-points operations. The previous read-modify-write pattern
 * (find → mutate in JS → save) lost updates whenever two orders for the same
 * customer were processed concurrently. These helpers push the mutation into
 * a single atomic MongoDB operation so points — a real financial liability —
 * can never drift.
 */

export interface AwardResult {
	pointsEarned: number;
	loyalty: TLoyalty;
	tierUpgraded: boolean;
	newTier: TLoyalty["tier"];
}

/**
 * Awards points for a completed order amount. Multiplier is based on the
 * tier in effect before this award (standard loyalty program behavior).
 */
export async function awardPointsAtomic(restaurantID: string, customer: CustomerRef, orderTotal: number): Promise<AwardResult | null> {
	// Read current tier for the multiplier. Tier reads are idempotent-safe:
	// a slightly stale tier only affects this award's multiplier, never the
	// stored balance.
	const existing = await Loyalties.findOne({ restaurantID, customer }).lean();
	const currentTier = existing?.tier ?? "silver";
	const pointsEarned = computePoints(orderTotal, currentTier);

	// Single atomic mutation: upsert + increment in one database round-trip.
	const loyalty = await Loyalties.findOneAndUpdate(
		{ restaurantID, customer },
		{
			$inc: { points: pointsEarned, lifetimePoints: pointsEarned, visitCount: 1 },
			$set: { lastVisit: new Date() },
			$setOnInsert: { restaurantID, customer },
		},
		{ new: true, upsert: true },
	);
	if (!loyalty) return null;

	// Promote tier if the new lifetime balance crossed a threshold.
	const newTier = computeTier(loyalty.lifetimePoints);
	const tierUpgraded = newTier !== loyalty.tier;
	if (tierUpgraded) {
		loyalty.tier = newTier;
		await Loyalties.updateOne({ _id: loyalty._id }, { $set: { tier: newTier } });
	}

	return { pointsEarned, loyalty, tierUpgraded, newTier };
}

/**
 * Redeems points with a balance guard inside the query itself, so a balance
 * can never go negative under concurrent redemptions. Returns null when the
 * balance is insufficient.
 */
export async function redeemPointsAtomic(restaurantID: string, customer: CustomerRef, points: number): Promise<TLoyalty | null> {
	return Loyalties.findOneAndUpdate({ restaurantID, customer, points: { $gte: points } }, { $inc: { points: -points } }, { new: true });
}
