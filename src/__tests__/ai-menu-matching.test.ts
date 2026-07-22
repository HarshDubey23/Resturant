import { describe, expect, it } from "@jest/globals";

interface MenuItem {
	name: string;
	category: string;
	price: number;
	veg: "veg" | "non-veg" | "contains-egg";
	description: string;
}

function matchMenuItems(query: string, items: MenuItem[]): MenuItem[] {
	const normalized = query.toLowerCase();
	const keywords = normalized.split(/\s+/).filter((k) => k.length > 2);

	if (keywords.length === 0) return [];

	const matches = items.filter((item) => {
		const name = item.name.toLowerCase();
		const desc = item.description?.toLowerCase() || "";
		const category = item.category?.toLowerCase() || "";

		return keywords.some((k) => name.includes(k) || desc.includes(k) || category.includes(k));
	});

	return matches.slice(0, 6);
}

function extractRecommendations(text: string): string[] | null {
	const match = text.match(/<<<REC:?(.*?)>>>/);
	if (!match) return null;
	try {
		return JSON.parse(match[1]);
	} catch {
		return null;
	}
}

describe("AI Menu Matching", () => {
	const menu: MenuItem[] = [
		{ name: "Chicken Biryani", category: "main", price: 250, veg: "non-veg", description: "Fragrant basmati rice with spiced chicken" },
		{ name: "Paneer Butter Masala", category: "main", price: 200, veg: "veg", description: "Creamy tomato gravy with soft paneer" },
		{ name: "Garlic Naan", category: "bread", price: 40, veg: "veg", description: "Tandoor-baked leavened bread with garlic" },
		{ name: "Gulab Jamun", category: "dessert", price: 80, veg: "veg", description: "Deep-fried milk solids in sugar syrup" },
		{ name: "Chicken 65", category: "starter", price: 180, veg: "non-veg", description: "Deep-fried chicken with spices" },
		{ name: "Mango Lassi", category: "beverage", price: 100, veg: "veg", description: "Yogurt drink with mango pulp" },
	];

	it("matches by item name", () => {
		const result = matchMenuItems("biryani", menu);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("Chicken Biryani");
	});

	it("matches by category", () => {
		const result = matchMenuItems("dessert", menu);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("Gulab Jamun");
	});

	it("matches multiple items with partial name", () => {
		const result = matchMenuItems("chicken", menu);
		expect(result).toHaveLength(2);
		expect(result.map((r) => r.name)).toEqual(expect.arrayContaining(["Chicken Biryani", "Chicken 65"]));
	});

	it("returns empty for no match", () => {
		const result = matchMenuItems("pizza", menu);
		expect(result).toHaveLength(0);
	});

	it("ignores short keywords under 3 chars", () => {
		const result = matchMenuItems("a", menu);
		expect(result).toHaveLength(0);
	});

	it("parses extractRecommendations correctly", () => {
		const text = 'Here are some suggestions <<<REC:["Chicken Biryani", "Garlic Naan"]>>>';
		const result = extractRecommendations(text);
		expect(result).toEqual(["Chicken Biryani", "Garlic Naan"]);
	});

	it("returns null when no REC tag present", () => {
		const text = "Just a normal response";
		expect(extractRecommendations(text)).toBeNull();
	});

	it("returns null on malformed JSON in REC tag", () => {
		const text = "<<<REC:[not json>>>";
		expect(extractRecommendations(text)).toBeNull();
	});

	it("matches by description keyword", () => {
		const result = matchMenuItems("tandoor", menu);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("Garlic Naan");
	});

	it("limits results to 6 items", () => {
		const largeMenu = Array.from({ length: 20 }, (_, i) => ({
			name: `Item ${i + 1}`,
			category: "main",
			price: 100,
			veg: "veg" as const,
			description: "test item for menu matching algorithm validation",
		}));
		const result = matchMenuItems("menu", largeMenu);
		expect(result.length).toBeLessThanOrEqual(6);
	});
});
