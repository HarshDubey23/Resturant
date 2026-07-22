/**
 * Maps menu item slugs to their 360° panoramic images in /public/panoramic/.
 * Used by the customer menu to open the 3D panoramic viewer on tap.
 *
 * To add a new 3D dish: drop a {slug}-360.png into /public/panoramic/ and
 * add an entry here. The slug must match the menu item's name slugified
 * (same logic as MenuSchema.pre("validate")).
 */
export const PANORAMIC_FOODS: Record<string, { image: string; name: string }> = {
	"butter-chicken": { image: "/panoramic/butter-chicken-360.png", name: "Butter Chicken" },
	"paneer-tikka": { image: "/panoramic/paneer-tikka-360.png", name: "Paneer Tikka" },
	biryani: { image: "/panoramic/biryani-360.png", name: "Biryani" },
	"masala-chai": { image: "/panoramic/masala-chai-360.png", name: "Masala Chai" },
	"gulab-jamun": { image: "/panoramic/gulab-jamun-360.png", name: "Gulab Jamun" },
	"rogan-josh": { image: "/panoramic/rogan-josh-360.png", name: "Rogan Josh" },
	"mango-lassi": { image: "/panoramic/mango-lassi-360.png", name: "Mango Lassi" },
	"chicken-tikka": { image: "/panoramic/chicken-tikka-360.png", name: "Chicken Tikka" },
	"dal-makhani": { image: "/panoramic/dal-makhani-360.png", name: "Dal Makhani" },
	"garlic-naan": { image: "/panoramic/garlic-naan-360.png", name: "Garlic Naan" },
	"palak-paneer": { image: "/panoramic/palak-paneer-360.png", name: "Palak Paneer" },
};

/**
 * Returns the panoramic image URL for a menu item, if available.
 * Matches by slug first, then by name (case-insensitive, hyphenated).
 */
export function getPanoramicForItem(item: { slug?: string; name?: string }): string | null {
	if (!item) return null;
	// Try slug first (set by Mongoose pre-validate hook)
	if (item.slug && PANORAMIC_FOODS[item.slug]) {
		return PANORAMIC_FOODS[item.slug].image;
	}
	// Fallback: slugify the name and look up
	if (item.name) {
		const slug = item.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
		if (PANORAMIC_FOODS[slug]) return PANORAMIC_FOODS[slug].image;
	}
	return null;
}
