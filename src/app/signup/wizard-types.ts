// Shared types + helpers for the registration wizard.
// Kept in a separate module so the main wizard component stays readable.

export interface MenuItemDraft {
	id: string;
	name: string;
	description: string;
	price: string;
	category: string;
	veg: "veg" | "non-veg" | "contains-egg";
	foodType: "spicy" | "extra-spicy" | "sweet" | "";
	station: "main" | "grill" | "bar" | "pastry" | "";
	image: string; // data URL or ""
	taxPercent: string;
}

export interface WizardState {
	// Step 1 — Brand
	restaurantName: string;
	restaurantID: string;
	description: string;
	logoUrl: string; // data URL
	cover: string; // data URL

	// Step 2 — Location
	address: string;
	phone: string;
	photos: string[]; // data URLs

	// Step 3 — Theme
	themeH: number;
	themeS: number;
	themeL: number;
	brandColor: string;

	// Step 4 — Menu
	categories: string[];
	menuItems: MenuItemDraft[];

	// Step 5 — Tables
	tableCount: number;
	tablePrefix: string;

	// Step 6 — Payments
	currency: "INR" | "USD" | "EUR" | "GBP" | "AED";
	upiId: string;
	gstNumber: string;
	gstInclusive: boolean;

	// Step 7 — Account
	email: string;
	password: string;
	passwordConfirm: string;
	kitchenPassword: string; // optional

	// Step 8 — AI Keys (all optional)
	aiGroq: string;
	aiCerebras: string;
	aiGoogle: string;
	aiSiliconFlow: string;
	aiHuggingFace: string;
}

export const initialWizardState: WizardState = {
	restaurantName: "",
	restaurantID: "",
	description: "",
	logoUrl: "",
	cover: "",

	address: "",
	phone: "",
	photos: [],

	themeH: 25,
	themeS: 95,
	themeL: 53,
	brandColor: "",

	categories: ["starters", "main", "breads", "desserts", "beverages"],
	menuItems: [],

	tableCount: 5,
	tablePrefix: "T",

	currency: "INR",
	upiId: "",
	gstNumber: "",
	gstInclusive: false,

	email: "",
	password: "",
	passwordConfirm: "",
	kitchenPassword: "",

	aiGroq: "",
	aiCerebras: "",
	aiGoogle: "",
	aiSiliconFlow: "",
	aiHuggingFace: "",
};

export const STEP_DEFS = [
	{ id: 1, label: "Brand", short: "Brand" },
	{ id: 2, label: "Location", short: "Location" },
	{ id: 3, label: "Theme", short: "Theme" },
	{ id: 4, label: "Menu", short: "Menu" },
	{ id: 5, label: "Tables", short: "Tables" },
	{ id: 6, label: "Payments", short: "Payments" },
	{ id: 7, label: "Account", short: "Account" },
	{ id: 8, label: "AI Keys", short: "AI" },
	{ id: 9, label: "Review", short: "Review" },
] as const;

export const THEME_PRESETS: Array<{ name: string; h: number; s: number; l: number; swatch: string }> = [
	{ name: "Saffron", h: 25, s: 95, l: 53, swatch: "hsl(25 95% 53%)" },
	{ name: "Chili", h: 0, s: 72, l: 51, swatch: "hsl(0 72% 51%)" },
	{ name: "Curry", h: 45, s: 93, l: 47, swatch: "hsl(45 93% 47%)" },
	{ name: "Basil", h: 140, s: 60, l: 40, swatch: "hsl(140 60% 40%)" },
	{ name: "Plum", h: 320, s: 70, l: 50, swatch: "hsl(320 70% 50%)" },
	{ name: "Ocean", h: 200, s: 80, l: 50, swatch: "hsl(200 80% 50%)" },
	{ name: "Royal", h: 265, s: 70, l: 55, swatch: "hsl(265 70% 55%)" },
	{ name: "Mint", h: 165, s: 70, l: 45, swatch: "hsl(165 70% 45%)" },
	{ name: "Sunset", h: 15, s: 85, l: 55, swatch: "hsl(15 85% 55%)" },
	{ name: "Slate", h: 215, s: 25, l: 35, swatch: "hsl(215 25% 35%)" },
];

export const CURRENCY_OPTIONS = [
	{ value: "INR", label: "₹ Indian Rupee" },
	{ value: "USD", label: "$ US Dollar" },
	{ value: "EUR", label: "€ Euro" },
	{ value: "GBP", label: "£ British Pound" },
	{ value: "AED", label: "د.إ UAE Dirham" },
] as const;

export const VEG_OPTIONS = [
	{ value: "veg", label: "Veg", dot: "bg-emerald-500" },
	{ value: "non-veg", label: "Non-Veg", dot: "bg-red-500" },
	{ value: "contains-egg", label: "Contains Egg", dot: "bg-amber-500" },
] as const;

export const FOOD_TYPE_OPTIONS = [
	{ value: "", label: "Regular" },
	{ value: "spicy", label: "Spicy" },
	{ value: "extra-spicy", label: "Extra Spicy" },
	{ value: "sweet", label: "Sweet" },
] as const;

export const STATION_OPTIONS = [
	{ value: "", label: "Auto (main)" },
	{ value: "main", label: "Main" },
	{ value: "grill", label: "Grill / Tandoor" },
	{ value: "bar", label: "Bar / Beverage" },
	{ value: "pastry", label: "Pastry / Dessert" },
] as const;

// File → data URL helper used by every image upload field in the wizard.
// Validates file type and size before reading. Throws on invalid input.
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
			reject(new Error("Only JPG, PNG, WEBP, or GIF images are allowed"));
			return;
		}
		if (file.size > MAX_IMAGE_BYTES) {
			reject(new Error(`Image is ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum is 2 MB.`));
			return;
		}
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
		reader.readAsDataURL(file);
	});
}

// Slugify the restaurant name into a valid URL slug.
// Falls back to a random suffix for non-ASCII names (Cyrillic, Arabic, etc.)
export function slugify(input: string): string {
	const slug = input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
	if (slug.length >= 3) return slug;
	// Fallback for names that produced empty/short slugs (non-Latin scripts)
	return `r-${Math.random().toString(36).slice(2, 8)}`;
}

// Password strength 0..4 (used by the account step meter).
// Minimum 8 chars enforced; aligns with industry baselines.
export function passwordStrength(p: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
	let score = 0;
	if (p.length >= 8) score++;
	if (p.length >= 12) score++;
	if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
	if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) score++;
	const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
	const labels = ["Too short", "Weak", "OK", "Good", "Strong"];
	const colors = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-yellow-500", "bg-emerald-500"];
	return { score: clamped, label: labels[clamped], color: colors[clamped] };
}
