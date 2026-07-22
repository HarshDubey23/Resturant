export const SPICE_LEVELS = [
	{ value: "mild", label: "Mild", emoji: "🟢" },
	{ value: "medium", label: "Medium", emoji: "🟡" },
	{ value: "hot", label: "Hot", emoji: "🟠" },
	{ value: "extra-hot", label: "Extra Hot", emoji: "🔴" },
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
	starters: "🥗",
	"main course": "🍛",
	biryani: "🍚",
	breads: "🫓",
	pizza: "🍕",
	chinese: "🥡",
	desserts: "🍰",
	beverages: "🥤",
};
