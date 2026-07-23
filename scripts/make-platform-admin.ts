/**
 * Make-platform-admin script
 *
 * Sets platformAdmin: true on the account matching the given email.
 *
 * Usage:
 *   pnpm exec tsx scripts/make-platform-admin.ts admin@orderworder.com
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
	console.error("MONGODB_URI environment variable is not set.");
	process.exit(1);
}

async function main() {
	const email = process.argv[2];
	if (!email) {
		console.error("Usage: pnpm exec tsx scripts/make-platform-admin.ts <email>");
		process.exit(1);
	}

	await mongoose.connect(MONGODB_URI);

	// Import the Account model inline to avoid circular dependencies
	const AccountSchema = new mongoose.Schema(
		{
			username: { type: String, trim: true, lowercase: true, unique: true, required: true, sparse: true },
			email: { type: String, trim: true, lowercase: true, unique: true, required: true, sparse: true },
			password: { type: String, required: true },
			verified: { type: Boolean, default: false },
			accountActive: { type: Boolean, default: true },
			subscriptionActive: { type: Boolean, default: true },
			plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
			platformAdmin: { type: Boolean, default: false },
		},
		{ timestamps: true },
	);

	const Accounts = mongoose.models.accounts ?? mongoose.model("accounts", AccountSchema);

	const result = await Accounts.updateOne({ email: email.toLowerCase() }, { $set: { platformAdmin: true } });

	if (result.matchedCount === 0) {
		console.error(`No account found with email: ${email}`);
		process.exit(1);
	}

	if (result.modifiedCount === 0) {
		console.info(`Account with email ${email} is already a platform admin.`);
	} else {
		console.info(`✅ Successfully set platformAdmin=true for ${email}`);
	}

	await mongoose.disconnect();
}

main().catch((err) => {
	console.error("Error:", err);
	process.exit(1);
});
