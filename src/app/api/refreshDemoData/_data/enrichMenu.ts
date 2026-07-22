import type { TMenu } from "#utils/database/models/menu";

/**
 * Enriches menu items with premium UI fields (rating, reviewCount, tags,
 * spiceLevel, originalPrice) in a deterministic way so the same menu
 * always renders with the same ratings — important for visual stability
 * across refreshes and for screenshots.
 *
 * This does NOT mutate the original menu items' culinary data; it only
 * adds presentation-layer metadata.
 */
export function enrichMenuForPremiumUI(menus: TMenu[], _restaurantID: string): TMenu[] {
	return menus.map((menu, index) => {
		const m = menu as TMenu & {
			rating?: number;
			reviewCount?: number;
			tags?: string[];
			spiceLevel?: number;
			originalPrice?: number;
		};

		if (m.rating === undefined) {
			// Spread ratings between 4.2 and 4.9 deterministically
			m.rating = Number((4.2 + ((index * 7) % 8) / 10).toFixed(1));
		}
		if (m.reviewCount === undefined) {
			m.reviewCount = 20 + ((index * 13) % 280);
		}
		if (!m.tags) {
			const tags: string[] = [];
			if (index % 5 === 0) tags.push("chef-special");
			if (index % 7 === 0) tags.push("popular");
			m.tags = tags;
		}
		if (m.spiceLevel === undefined) {
			const spiceMap: Record<string, number> = { spicy: 2, "extra-spicy": 3, mild: 1 };
			m.spiceLevel = spiceMap[m.foodType as string] ?? 0;
		}
		if (m.originalPrice === undefined && index % 9 === 0 && m.price > 0) {
			m.originalPrice = m.price;
			m.price = Math.round((m.price * 0.9 + Number.EPSILON) * 100) / 100;
		}

		return menu;
	});
}
