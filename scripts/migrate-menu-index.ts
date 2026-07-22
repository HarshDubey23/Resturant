import mongoose from "mongoose";

async function migrateMenuIndex() {
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

	const collection = db.collection("menus");

	try {
		await collection.dropIndex("name_1");
		console.log("Dropped old name_1 index");
	} catch (err) {
		console.log("Index name_1 not found or already dropped:", (err as Error).message);
	}

	try {
		await collection.createIndex({ restaurantID: 1, name: 1 }, { unique: true });
		console.log("Created compound index restaurantID_1_name_1");
	} catch (err) {
		console.error("Failed to create compound index:", (err as Error).message);
	}

	await mongoose.disconnect();
	console.log("Migration complete");
}

migrateMenuIndex().catch(console.error);
