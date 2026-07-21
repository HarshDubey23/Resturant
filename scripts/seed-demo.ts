import { spawn } from "node:child_process";
import { connect, disconnect, model, models, Schema } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/orderworder";

async function runCommand(cmd: string, args: string[]): Promise<string> {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (d) => (stdout += d.toString()));
		child.stderr.on("data", (d) => (stderr += d.toString()));
		child.on("close", (code) => {
			if (code === 0) resolve(stdout);
			else reject(new Error(stderr || stdout));
		});
	});
}

async function seed() {
	console.log("Connecting to MongoDB...");
	await connect(MONGODB_URI);
	console.log("Connected.");

	const db = (await connect(MONGODB_URI)).connection.db;
	if (!db) throw new Error("No database connection");

	// Check if demo data already exists
	const existing = await db.collection("accounts").countDocuments({ username: "demo-restaurant" });
	if (existing > 0) {
		console.log("Demo data already exists. Skipping seed.");
		await disconnect();
		return;
	}

	const now = new Date();
	const demoId = new (require("mongoose").Types.ObjectId)();

	// 1. Create account (restaurant owner)
	const passwordHash = "$2b$10$dGzGzGzGzGzGzGzGzGzGuOHzGzGzGzGzGzGzGzGzGzGzGzGzG"; // "demo@123" placeholder
	await db.collection("accounts").insertOne({
		_id: demoId,
		username: "demo-restaurant",
		email: "demo@orderworder.com",
		password: passwordHash,
		restaurantName: "Demo Restaurant",
		role: "admin",
		createdAt: now,
		updatedAt: now,
	});

	// 2. Create profile
	await db.collection("profiles").insertOne({
		restaurantID: "demo-restaurant",
		currency: "INR",
		themeColor: { h: 30, s: 80, l: 50 },
		taxPercent: 5,
		createdAt: now,
		updatedAt: now,
	});

	// 3. Create menus
	const menuItems = [
		{ name: "Butter Chicken", category: "main", price: 320, veg: "non-veg", description: "Creamy tomato-based chicken curry", image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398" },
		{ name: "Paneer Tikka", category: "starter", price: 240, veg: "veg", description: "Grilled cottage cheese with spices", image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8" },
		{ name: "Dal Makhani", category: "main", price: 220, veg: "veg", description: "Slow-cooked black lentils in creamy gravy", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d" },
		{ name: "Garlic Naan", category: "bread", price: 45, veg: "veg", description: "Tandoor-baked bread with garlic butter", image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641" },
		{ name: "Biryani", category: "main", price: 280, veg: "non-veg", description: "Fragrant basmati rice layered with spiced meat", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8" },
		{ name: "Gulab Jamun", category: "dessert", price: 80, veg: "veg", description: "Deep-fried milk solids soaked in rose syrup", image: "https://images.unsplash.com/photo-1666172051626-9a05e0a1bc27" },
		{ name: "Masala Dosa", category: "main", price: 150, veg: "veg", description: "Crispy rice crepe with spiced potato filling", image: "https://images.unsplash.com/photo-1630383249896-424e482df921" },
		{ name: "Chicken 65", category: "starter", price: 190, veg: "non-veg", description: "Deep-fried chicken with fiery spices", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9" },
		{ name: "Mango Lassi", category: "beverage", price: 110, veg: "veg", description: "Chilled yogurt drink with mango pulp", image: "https://images.unsplash.com/photo-1577805947697-89e18249d767" },
		{ name: "Chole Bhature", category: "main", price: 180, veg: "veg", description: "Spiced chickpea curry with fried bread", image: "https://images.unsplash.com/photo-1626132647523-66f5bf380127" },
	];

	const menuDocs = menuItems.map((item) => ({
		...item,
		restaurantID: "demo-restaurant",
		createdAt: now,
		updatedAt: now,
	}));
	const menuResult = await db.collection("menus").insertMany(menuDocs);
	const menuIds = Object.values(menuResult.insertedIds);
	console.log(`Created ${menuDocs.length} menu items`);

	// 4. Create tables
	const tables = ["T1", "T2", "T3", "T4", "T5"];
	for (const table of tables) {
		await db.collection("tables").insertOne({
			tableID: table,
			restaurantID: "demo-restaurant",
			capacity: 4,
			status: "free",
			createdAt: now,
			updatedAt: now,
		});
	}
	console.log(`Created ${tables.length} tables`);

	// 5. Create sample customer
	const customerId = new (require("mongoose").Types.ObjectId)();
	await db.collection("customers").insertOne({
		_id: customerId,
		restaurantID: "demo-restaurant",
		fname: "Demo",
		lname: "User",
		phone: "9999999999",
		whatsappOptIn: true,
		createdAt: now,
		updatedAt: now,
	});

	// 6. Create loyalty record
	await db.collection("loyalties").insertOne({
		restaurantID: "demo-restaurant",
		customer: customerId,
		points: 250,
		lifetimePoints: 750,
		tier: "gold",
		visitCount: 5,
		lastVisit: now,
		preferences: { language: "hi", spiceTolerance: "medium" },
		createdAt: now,
		updatedAt: now,
	});

	// 7. Create sample orders
	const orderItems = [
		{ menuItem: menuIds[0], name: "Butter Chicken", quantity: 1, price: 320 },
		{ menuItem: menuIds[2], name: "Garlic Naan", quantity: 2, price: 45 },
	];
	await db.collection("orders").insertOne({
		restaurantID: "demo-restaurant",
		table: "T1",
		customer: customerId,
		products: orderItems.map((o) => ({ ...o, kitchenStatus: "pending", fulfilled: false, adminApproved: false })),
		orderTotal: 410,
		taxTotal: 21,
		state: "active",
		paymentStatus: "pending",
		createdAt: now,
		updatedAt: now,
	});
	console.log("Created sample order");

	// 8. Link account to menus and tables
	await db.collection("accounts").updateOne(
		{ _id: demoId },
		{ $set: { menus: menuIds, tables: [customerId] } },
	);

	console.log("\n--- Seed Complete ---");
	console.log("Restaurant: demo-restaurant");
	console.log("Password:   (not set — use forgot-password flow)");
	console.log("Phone:      9999999999");
	console.log("Tables:     T1, T2, T3, T4, T5");
	console.log("Customers:  Demo User (whatsappOptIn: true)");

	await disconnect();
	process.exit(0);
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
