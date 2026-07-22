import mongoose, { type HydratedDocument } from "mongoose";

const gender = ["male", "female", "others"] as const;
const CustomerSchema = new mongoose.Schema<TCustomer>(
	{
		fname: { type: String, trim: true, required: true },
		lname: { type: String, trim: true, required: true },
		phone: { type: String, trim: true, required: true, sparse: true },
		email: { type: String, trim: true, sparse: true },
		gender: { type: String, trim: true, lowercase: true, enum: gender },
		whatsappOptIn: { type: Boolean, default: false },
		restaurantID: { type: String, trim: true, lowercase: true, required: true },
	},
	{ timestamps: true },
);

CustomerSchema.index({ phone: 1, restaurantID: 1 }, { unique: true });
// Email uniqueness is scoped per restaurant — the same person may be a
// customer of many restaurants on the platform. A global unique index here
// rejected legitimate sign-ups at a second restaurant.
CustomerSchema.index({ email: 1, restaurantID: 1 }, { unique: true, sparse: true });

export const Customers = mongoose.models?.customers ?? mongoose.model<TCustomer>("customers", CustomerSchema);
export type TCustomer = HydratedDocument<{
	fname: string;
	lname: string;
	gender: (typeof gender)[number];
	phone: string;
	email: string;
	whatsappOptIn: boolean;
	restaurantID: string;
}>;
