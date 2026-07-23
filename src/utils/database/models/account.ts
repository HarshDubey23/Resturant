import mongoose, { type HydratedDocument } from "mongoose";

import { hashPassword } from "#utils/helper/passwordHelper";

import type { TKitchen } from "./kitchen";
import type { TMenu } from "./menu";
import type { TProfile } from "./profile";
import type { TTable } from "./table";

const AccountSchema = new mongoose.Schema<TAccount>(
	{
		username: { type: String, trim: true, lowercase: true, unique: true, required: true, sparse: true },
		email: { type: String, trim: true, lowercase: true, unique: true, required: true, sparse: true },
		password: { type: String, required: true },
		verified: { type: Boolean, default: false },
		accountActive: { type: Boolean, default: true },
		subscriptionActive: { type: Boolean, default: true },
		plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
		maxTables: { type: Number, default: 5 },
		maxMenuItems: { type: Number, default: 20 },
		profile: { type: mongoose.Schema.Types.ObjectId, ref: "profiles" },
		kitchens: [{ type: mongoose.Schema.Types.ObjectId, ref: "kitchens" }],
		tables: [{ type: mongoose.Schema.Types.ObjectId, ref: "tables" }],
		menus: [{ type: mongoose.Schema.Types.ObjectId, ref: "menus" }],
		stripeCustomerId: { type: String, trim: true, index: true },
		stripeAccountId: { type: String, trim: true },
		razorpayContactId: { type: String, trim: true },
		razorpayFundAccountId: { type: String, trim: true },
		razorpayAccountId: { type: String, trim: true },
		n8nWebhookUrl: { type: String, trim: true },
		outlets: [
			{
				name: { type: String, required: true },
				slug: { type: String, required: true },
				address: { type: String },
				phone: { type: String },
				gstin: { type: String },
				isPrimary: { type: Boolean, default: false },
			},
		],
		staff: [
			{
				user: { type: mongoose.Schema.Types.ObjectId, ref: "accounts" },
				role: { type: String, enum: ["owner", "manager", "captain", "waiter", "chef"] },
				outlets: [{ type: String }],
				permissions: [{ type: String }],
				isActive: { type: Boolean, default: true },
			},
		],
		platformAdmin: { type: Boolean, default: false },
	},
	{ timestamps: true },
);

AccountSchema.pre("save", async function () {
	if (this.isModified("password")) this.password = await hashPassword(this?.password);
});

/**
 * Cascade delete: removing a restaurant account must remove every tenant
 * record it owns. Previously, deleting a restaurant left orphaned orders,
 * menus, customers, campaigns, loyalty records, etc. behind — data bloat,
 * wrong analytics, and a DPDP/data-protection compliance gap on account
 * termination. Models are resolved lazily via mongoose.model() to avoid
 * circular-import issues at module load time.
 */
const TENANT_MODELS = [
	"profiles",
	"kitchens",
	"tables",
	"menus",
	"orders",
	"customers",
	"loyalties",
	"campaigns",
	"inventory",
	"recipes",
	"invoices",
	"coupons",
	"aggregatorOrders",
	"feedbacks",
	"AIConfig",
] as const;

async function cascadeDeleteRestaurant(username?: string) {
	if (!username) return;
	await Promise.all(
		TENANT_MODELS.map((name) => {
			const model = mongoose.models?.[name];
			if (!model) return Promise.resolve();
			return model.deleteMany({ restaurantID: username }).exec();
		}),
	);
}

// Document middleware: account.deleteOne()
AccountSchema.pre("deleteOne", { document: true, query: false }, async function () {
	await cascadeDeleteRestaurant(this.username);
});

// Query middleware: Accounts.deleteOne({ ... })
AccountSchema.pre("deleteOne", { document: false, query: true }, async function () {
	const doc = await this.model.findOne(this.getFilter()).lean();
	await cascadeDeleteRestaurant((doc as { username?: string } | null)?.username);
});

// Query middleware: Accounts.findOneAndDelete({ ... })
AccountSchema.pre("findOneAndDelete", async function () {
	const doc = await this.model.findOne(this.getFilter()).lean();
	await cascadeDeleteRestaurant((doc as { username?: string } | null)?.username);
});

export const Accounts = mongoose.models?.accounts ?? mongoose.model<TAccount>("accounts", AccountSchema);
export type TAccount = HydratedDocument<{
	username: string;
	email: string;
	password: string;
	verified: boolean;
	accountActive: boolean;
	subscriptionActive: boolean;
	plan: "free" | "pro" | "enterprise";
	maxTables: number;
	maxMenuItems: number;
	profile: TProfile;
	kitchens: Array<TKitchen>;
	tables: Array<TTable>;
	menus: Array<TMenu>;
	stripeCustomerId: string;
	stripeAccountId: string;
	razorpayContactId: string;
	razorpayFundAccountId: string;
	razorpayAccountId: string;
	n8nWebhookUrl: string;
	outlets: Array<{ name: string; slug: string; address?: string; phone?: string; gstin?: string; isPrimary: boolean }>;
	staff: Array<{ user: mongoose.Types.ObjectId; role: string; outlets: string[]; permissions: string[]; isActive: boolean }>;
	platformAdmin: boolean;
}>;
