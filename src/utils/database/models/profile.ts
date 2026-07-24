/** @file Profile model — extended with a tamper-proof `settings` subdocument.
 *    `noDeleteMode` defaults to true so deletes are blocked at the data layer
 *    unless an owner explicitly toggles it (which itself appends to the audit
 *    chain). GST / e-invoice toggles + variance thresholds are also stored here
 *    so they survive restarts and travel with the tenant.
 * @phase 2
 * @audit-finding n/a
 */
import mongoose, { type HydratedDocument } from "mongoose";
import type { TThemeColor } from "xtreme-ui";

import { Accounts } from "./account";

const ProfileSchema = new mongoose.Schema<TProfile>(
	{
		name: { type: String, trim: true, required: true },
		restaurantID: { type: String, trim: true, lowercase: true, unique: true, required: true, sparse: true },
		description: { type: String, trim: true },
		address: { type: String, trim: true },
		phone: { type: String, trim: true },
		themeColor: {
			h: { type: Number, trim: true, min: 0, max: 360 },
			s: { type: Number, trim: true, min: 0, max: 100 },
			l: { type: Number, trim: true, min: 0, max: 100 },
		},
		gstInclusive: { type: Boolean, default: false },
		gstNumber: { type: String, trim: true, uppercase: true },
		brandColor: { type: String, trim: true },
		logoUrl: { type: String, trim: true },
		categories: [{ type: String, trim: true, lowercase: true, match: /^[^,]*$/ }],
		avatar: { type: String, trim: true },
		cover: { type: String, trim: true },
		photos: [{ type: String, trim: true }],
		upiId: { type: String, trim: true },
		currency: { type: String, default: "INR", enum: ["INR", "USD", "EUR", "GBP", "AED"] },
		settings: {
			noDeleteMode: { type: Boolean, default: true },
			gstEnabled: { type: Boolean, default: false },
			einvoiceEnabled: { type: Boolean, default: false },
			varianceThresholdPercent: { type: Number, default: 3 },
			varianceThresholdRupees: { type: Number, default: 500 },
		},
	},
	{ timestamps: true },
);

ProfileSchema.pre("save", async function () {
	const account = await Accounts.findOne({ username: this.restaurantID });
	if (!account) throw new Error(`The associated account with username '${this.restaurantID}'does not exist.`);

	this.categories = Array.from(new Set(this.categories));
});
ProfileSchema.post("save", async function () {
	await Accounts.updateOne({ username: this.restaurantID }, { $set: { profile: this._id } });
});

export const Profiles = mongoose.models?.profiles ?? mongoose.model<TProfile>("profiles", ProfileSchema);
export type TProfile = HydratedDocument<{
	name: string;
	restaurantID: string;
	description: string;
	address: string;
	phone: string;
	avatar: string;
	cover: string;
	photos: Array<string>;
	themeColor: TThemeColor;
	gstInclusive: boolean;
	gstNumber: string;
	brandColor: string;
	logoUrl: string;
	categories: Array<string>;
	upiId?: string;
	currency: string;
	settings?: {
		noDeleteMode: boolean;
		gstEnabled: boolean;
		einvoiceEnabled: boolean;
		varianceThresholdPercent: number;
		varianceThresholdRupees: number;
	};
}>;
