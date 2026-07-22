import connectDB from "#utils/database/connect";
import { Profiles } from "#utils/database/models/profile";

export async function getRestaurantCurrency(restaurantID: string): Promise<string> {
	try {
		await connectDB();
		const profile = await Profiles.findOne({ restaurantID }).select("currency").lean();
		if (profile && "currency" in profile && typeof profile.currency === "string") return profile.currency;
	} catch {}
	return "INR";
}
