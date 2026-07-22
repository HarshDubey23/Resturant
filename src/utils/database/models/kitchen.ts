import mongoose from "mongoose";

import { hashPassword } from "#utils/helper/passwordHelper";

import { Accounts } from "./account";

const KitchenSchema = new mongoose.Schema<TKitchen>(
	{
		username: { type: String, trim: true, required: true },
		password: { type: String, required: true },
		restaurantID: { type: String, trim: true, lowercase: true, required: true },
	},
	{ timestamps: true },
);

KitchenSchema.index({ username: 1, restaurantID: 1 }, { unique: true });

KitchenSchema.pre("save", async function () {
	const account = await Accounts.findOne({ username: this.restaurantID });
	if (!account) throw new Error(`The associated account with username '${this.restaurantID}'does not exist.`);

	if (this.isModified("password")) this.password = await hashPassword(this.password);
});

KitchenSchema.post("save", async function () {
	await Accounts.updateOne({ username: this.restaurantID }, { $addToSet: { kitchens: this._id } });
});

export const Kitchens = mongoose.models?.kitchens ?? mongoose.model<TKitchen>("kitchens", KitchenSchema);
export type TKitchen = {
	username: string;
	password: string;
	restaurantID: string;
};
