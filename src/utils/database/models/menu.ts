import mongoose, { type HydratedDocument } from "mongoose";
import { Accounts } from "./account";

const FoodType = ["spicy", "extra-spicy", "sweet"] as const;
const Veg = ["veg", "non-veg", "contains-egg"] as const;

const MenuSchema = new mongoose.Schema<TMenu>(
	{
		name: { type: String, trim: true, required: true },
		restaurantID: { type: String, trim: true, lowercase: true, required: true },
		description: { type: String, trim: true },
		category: { type: String, trim: true, lowercase: true },
		price: { type: Number, trim: true, required: true },
		taxPercent: { type: Number, trim: true, required: true },
		foodType: { type: String, trim: true, lowercase: true, enum: FoodType },
		veg: { type: String, trim: true, lowercase: true, required: true, enum: Veg },
		image: { type: String, trim: true },
		slug: { type: String, trim: true, lowercase: true, index: true },
		modelUrl: { type: String, trim: true, default: null },
		trackStock: { type: Boolean, default: false },
		stockCount: { type: Number, default: null },
		costPrice: { type: Number, default: 0 },
		sku: { type: String, trim: true, index: true },
		hidden: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

MenuSchema.index({ restaurantID: 1, name: 1 }, { unique: true });

MenuSchema.pre("validate", async function () {
	if (!this.slug && this.name) {
		this.slug = this.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
	}
});

MenuSchema.pre("save", async function () {
	const account = await Accounts.findOne({ username: this.restaurantID }).populate("profile");
	if (!account) throw new Error(`The associated account with username '${this.restaurantID}'does not exist.`);
	const validCategories = account?.profile?.categories;
	if (validCategories?.length && !validCategories.includes(this.category)) {
		throw new Error("The menu item category does not exist.");
	}
});
MenuSchema.post("save", async function () {
	await Accounts.updateOne({ username: this.restaurantID }, { $addToSet: { menus: this._id } });
});

export const Menus = mongoose.models?.menus ?? mongoose.model<TMenu>("menus", MenuSchema);
export type TMenu = HydratedDocument<{
	name: string;
	restaurantID: string;
	description: string;
	category: string;
	price: number;
	taxPercent: number;
	foodType: TFoodType;
	veg: TVeg;
	image: string;
	slug: string;
	modelUrl: string | null;
	trackStock: boolean;
	stockCount: number | null;
	costPrice: number;
	sku: string;
	hidden: boolean;
}>;

export type TFoodType = (typeof FoodType)[number];
export type TVeg = (typeof Veg)[number];
