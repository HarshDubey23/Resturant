import type { TMenu } from "#utils/database/models/menu";

/**
 * Map menu categories to kitchen stations. Drives the KDS station filter —
 * each station sees only the items it's responsible for. Categories not in
 * this map default to "main".
 */
const CATEGORY_STATION_MAP: Record<string, string> = {
	// drinks
	beverages: "bar",
	"cold beverages": "bar",
	coffee: "bar",
	tea: "bar",
	frappuccino: "bar",
	"mocktails & drinks": "bar",
	// sweets
	desserts: "pastry",
	bakery: "pastry",
	sweets: "pastry",
	// grilled / tandoor items
	starters: "grill",
	"non-veg starters": "grill",
	"veg starters": "grill",
	"tandoor & grill": "grill",
	// everything else
	"main course": "main",
	mains: "main",
	breads: "main",
	biryani: "main",
	"biryani and rice": "main",
	"egg dishes": "main",
	"fried rice and noodles": "main",
	"empire box": "main",
	savouries: "main",
	specials: "main",
};

export function enrichMenuForPremiumUI(menus: TMenu[], _restaurantID: string): TMenu[] {
	return menus.map((menu, index) => {
		const m = menu as TMenu & {
			rating?: number;
			reviewCount?: number;
			tags?: string[];
			spiceLevel?: number;
			originalPrice?: number;
			station?: string;
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
		if (!m.station) {
			const cat = (m.category || "").toLowerCase();
			m.station = CATEGORY_STATION_MAP[cat] ?? "main";
		}

		return menu;
	});
}
