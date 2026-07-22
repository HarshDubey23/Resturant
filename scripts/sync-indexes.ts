/**
 * Index synchronisation for production deployments.
 *
 * `autoIndex: false` in connect.ts means Mongoose never builds indexes at
 * connection time (correct for production boot performance). This script is
 * the counterpart: it must run on every deployment to create/refresh the
 * indexes declared in the schemas, otherwise queries fall back to full
 * collection scans as data grows.
 *
 * It also performs one-time index migrations where a schema changed the shape
 * of an index (e.g. customer email uniqueness moving from a global unique
 * index to a per-restaurant compound index).
 *
 * Run:  npx tsx scripts/sync-indexes.ts
 */
import mongoose from "mongoose";

import "../src/utils/database/models/profile";
import "../src/utils/database/models/account";
import "../src/utils/database/models/customer";
import "../src/utils/database/models/kitchen";
import "../src/utils/database/models/menu";
import "../src/utils/database/models/table";
import "../src/utils/database/models/order";
import "../src/utils/database/models/aiConfig";
import "../src/utils/database/models/loyalty";
import "../src/utils/database/models/aggregatorOrder";
import "../src/utils/database/models/campaign";
import "../src/utils/database/models/inventory";
import "../src/utils/database/models/recipe";
import "../src/utils/database/models/invoice";
import "../src/utils/database/models/coupon";
import "../src/utils/database/models/feedback";
import "../src/utils/database/models/splitPayment";

async function migrateCustomerEmailIndex() {
	const db = mongoose.connection.db;
	if (!db) return;

	const collection = db.collection("customers");
	const indexes = await collection.indexes();
	const names = indexes.map((i) => i.name);

	// Drop the legacy GLOBAL unique email index (email_1) if it exists and is
	// not the compound form — the schema now scopes uniqueness per restaurant.
	const legacy = indexes.find((i) => i.name === "email_1" && i.unique && !i.key?.restaurantID);
	if (legacy && names.includes("email_1")) {
		try {
			await collection.dropIndex("email_1");
			console.log("🔄 Dropped legacy global unique index customers.email_1");
		} catch (err) {
			console.warn(`⚠️  Could not drop customers.email_1: ${(err as Error).message}`);
		}
	}
}

async function syncIndexes() {
	const uri = process.env.MONGODB_URI;
	if (!uri) {
		console.error("❌ MONGODB_URI environment variable is required");
		process.exit(1);
	}

	console.log("Connecting to MongoDB...");
	await mongoose.connect(uri, { autoIndex: false });

	// One-time migrations first so syncIndexes doesn't fight old shapes.
	await migrateCustomerEmailIndex();

	const modelNames = mongoose.modelNames();
	console.log(`Syncing indexes for ${modelNames.length} models...`);

	for (const name of modelNames) {
		try {
			await mongoose.model(name).syncIndexes();
			console.log(`✅ ${name}`);
		} catch (err) {
			console.error(`❌ ${name}: ${(err as Error).message}`);
			process.exitCode = 1;
		}
	}

	await mongoose.disconnect();
	console.log("🍃 Index sync complete");
}

syncIndexes().catch((err) => {
	console.error(err);
	process.exit(1);
});
