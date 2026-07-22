import mongoose from "mongoose";

async function migrateOrderIndexes() {
	const uri = process.env.MONGODB_URI;
	if (!uri) {
		console.error("MONGODB_URI environment variable is required");
		process.exit(1);
	}

	await mongoose.connect(uri);
	const db = mongoose.connection.db;

	if (!db) {
		console.error("Failed to connect to database");
		process.exit(1);
	}

	const collection = db.collection("orders");

	const currentIndexes = await collection.indexes();
	const indexNames = currentIndexes.map((i: { name: string }) => i.name);

	const redundantIndexes = ["n8nEventId_1", "invoiceNumber_1"];

	for (const name of redundantIndexes) {
		if (indexNames.includes(name)) {
			try {
				await collection.dropIndex(name);
				console.log(`Dropped old index ${name}`);
			} catch (err) {
				console.log(`Failed to drop ${name}: ${(err as Error).message}`);
			}
		}
	}

	await collection.createIndex({ restaurantID: 1, state: 1, createdAt: -1 });
	console.log("Created index restaurantID_1_state_1_createdAt_-1");

	await collection.createIndex({ restaurantID: 1, customer: 1, state: 1 });
	console.log("Created index restaurantID_1_customer_1_state_1");

	await collection.createIndex({ restaurantID: 1, createdAt: -1 });
	console.log("Created index restaurantID_1_createdAt_-1");

	await collection.createIndex({ restaurantID: 1, n8nEventId: 1 }, { unique: true, sparse: true });
	console.log("Created index restaurantID_1_n8nEventId_1");

	await collection.createIndex({ invoiceNumber: 1 }, { sparse: true });
	console.log("Created index invoiceNumber_1");

	await mongoose.disconnect();
	console.log("Order indexes migration complete");
}

migrateOrderIndexes().catch(console.error);
