/**
 * Seed ~150 realistic orders across 90 days for the demo restaurant
 * so the Analytics page shows rich, real graphs (revenue trend, peak hours,
 * top dishes, payment-method breakdown, category breakdown, top customers).
 *
 * Idempotent: removes existing demo orders first, then inserts fresh ones.
 * Also inserts ~12 demo customers so repeat-rate + top-customers + churn
 * metrics have real data to compute on.
 *
 * Usage:  node scripts/seed-analytics.mjs
 */
import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://harsh2428cseaiml127_db_user:rE3ppElbSrInVmVn@cluster0.40suhpb.mongodb.net/orderworder?retryWrites=true&w=majority";

const RESTAURANT_ID = "demo";

// Realistic Indian customer names
const CUSTOMER_NAMES = [
	["Aarav", "Sharma"],
	["Vivaan", "Patel"],
	["Aditya", "Nair"],
	["Diya", "Reddy"],
	["Ananya", "Iyer"],
	["Ishaan", "Mehta"],
	["Saanvi", "Gupta"],
	["Arjun", "Rao"],
	["Myra", "Joshi"],
	["Reyansh", "Singh"],
	["Aanya", "Kapoor"],
	["Kabir", "Khanna"],
	["Anika", "Verma"],
	["Vihaan", "Chopra"],
	["Pari", "Malhotra"],
	["Arnav", "Bose"],
	["Riya", "Banerjee"],
	["Dhruv", "Dasgupta"],
	["Sara", "Mukherjee"],
	["Veer", "Agarwal"],
];

const PAYMENT_METHODS = [
	{ method: "razorpay", gateway: "razorpay", weight: 0.45 },
	{ method: "stripe", gateway: "stripe", weight: 0.15 },
	{ method: "cash", gateway: "cash", weight: 0.4 },
];

function pickWeighted(arr) {
	const r = Math.random();
	let acc = 0;
	for (const item of arr) {
		acc += item.weight;
		if (r <= acc) return item;
	}
	return arr[arr.length - 1];
}

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr, n = 1) {
	const shuffled = [...arr].sort(() => Math.random() - 0.5);
	const result = shuffled.slice(0, n);
	return n === 1 ? result[0] : result;
}

async function main() {
	console.log("Connecting to MongoDB Atlas...");
	await mongoose.connect(MONGODB_URI);
	const db = mongoose.connection.db;

	// 1. Fetch restaurant profile + menu + tables
	const profile = await db.collection("profiles").findOne({ restaurantID: RESTAURANT_ID });
	if (!profile) throw new Error(`No profile for restaurantID=${RESTAURANT_ID}`);
	console.log(`Restaurant: ${profile.name} (${RESTAURANT_ID})`);

	const menuItems = await db.collection("menus").find({ restaurantID: RESTAURANT_ID }).toArray();
	console.log(`Menu items: ${menuItems.length}`);
	if (menuItems.length === 0) throw new Error("No menu items found");

	const tables = await db.collection("tables").find({ restaurantID: RESTAURANT_ID }).toArray();
	console.log(`Tables: ${tables.length}`);

	// 2. Create demo customers (idempotent: wipe + recreate)
	const existingDemoCustomers = await db
		.collection("customers")
		.find({ restaurantID: RESTAURANT_ID, phone: /^9[0-9]{9}$/ })
		.toArray();
	if (existingDemoCustomers.length > 0) {
		await db.collection("customers").deleteMany({
			_id: { $in: existingDemoCustomers.map((c) => c._id) },
		});
		console.log(`Removed ${existingDemoCustomers.length} old demo customers`);
	}

	const customers = [];
	for (let i = 0; i < CUSTOMER_NAMES.length; i++) {
		const [fname, lname] = CUSTOMER_NAMES[i];
		const phone = `9${randomInt(100000000, 999999999)}`;
		const email = `${fname.toLowerCase()}.${lname.toLowerCase()}${i}@example.com`;
		const result = await db.collection("customers").insertOne({
			fname,
			lname,
			phone,
			email,
			restaurantID: RESTAURANT_ID,
			whatsappOptIn: Math.random() > 0.3,
			createdAt: new Date(Date.now() - randomInt(1, 90) * 86400000),
			updatedAt: new Date(),
		});
		customers.push({ _id: result.insertedId, fname, lname, phone });
	}
	console.log(`Created ${customers.length} demo customers`);

	// 3. Wipe existing demo orders (keep orders for other restaurants intact)
	const deleteResult = await db.collection("orders").deleteMany({ restaurantID: RESTAURANT_ID });
	console.log(`Removed ${deleteResult.deletedCount} old demo orders`);

	// 4. Generate ~150 orders across the last 90 days
	const orders = [];
	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const TOTAL_ORDERS = 150;

	for (let i = 0; i < TOTAL_ORDERS; i++) {
		// Spread orders across last 90 days, weighted toward recent days (more activity lately)
		const daysAgo = Math.floor(Math.random() ** 1.3 * 90); // skew recent
		const orderDate = new Date(todayStart.getTime() - daysAgo * 86400000);

		// Peak hours: lunch (12-14) and dinner (19-22) get more traffic
		const hourWeights = [0.2, 0.1, 0.05, 0.05, 0.05, 0.1, 0.4, 0.8, 1.0, 0.6, 0.3, 0.2, 0.5, 1.0, 0.7, 0.4, 0.3, 0.5, 0.9, 1.0, 1.0, 0.8, 0.5, 0.3];
		const totalWeight = hourWeights.reduce((a, b) => a + b, 0);
		let r = Math.random() * totalWeight;
		let hour = 19;
		for (let h = 0; h < 24; h++) {
			r -= hourWeights[h];
			if (r <= 0) {
				hour = h;
				break;
			}
		}
		orderDate.setHours(hour, randomInt(0, 59), randomInt(0, 59), 0);

		// Pick 1-4 menu items for this order
		const itemCount = randomInt(1, 4);
		const chosenItems = pickRandom(menuItems, Math.max(itemCount, 2)).slice(0, itemCount);
		const products = chosenItems.map((item) => {
			const quantity = randomInt(1, 3);
			const taxPercent = item.taxPercent || 5;
			const tax = Math.round((item.price * taxPercent) / 100);
			return {
				menuItem: item._id,
				product: item._id,
				name: item.name,
				quantity,
				price: item.price,
				tax,
				kitchenStatus: "served",
				fulfilled: true,
				adminApproved: true,
				station: item.station || "main",
			};
		});

		const orderTotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
		const taxTotal = products.reduce((sum, p) => sum + p.tax * p.quantity, 0);

		// 80% complete, 10% active, 5% cancel, 5% reject (realistic mix)
		const stateRoll = Math.random();
		let state;
		if (stateRoll < 0.8) state = "complete";
		else if (stateRoll < 0.9) state = "active";
		else if (stateRoll < 0.95) state = "cancel";
		else state = "reject";

		// Payment method
		const pm = pickWeighted(PAYMENT_METHODS);
		const paymentStatus = state === "complete" ? "paid" : state === "active" ? "pending" : state === "cancel" ? "refunded" : "failed";

		// Customer (80% have a customer record, 20% walk-in/anonymous)
		const customer = Math.random() < 0.8 ? pickRandom(customers)._id : null;

		// Table assignment
		const table = pickRandom(tables);

		const order = {
			restaurantID: RESTAURANT_ID,
			table: table.name || `T${randomInt(1, 10)}`,
			customer,
			state,
			paymentStatus,
			paymentGateway: pm.gateway,
			paymentId: pm.gateway !== "cash" ? `pay_${Math.random().toString(36).slice(2, 14)}` : null,
			orderTotal,
			taxTotal,
			discountAmount: 0,
			couponCode: null,
			refundedAmount: state === "cancel" ? orderTotal + taxTotal : 0,
			n8nEventId: null,
			invoiceNumber: state === "complete" ? `INV-${String(i + 1).padStart(4, "0")}` : null,
			loyaltyAwarded: state === "complete" && customer !== null,
			settledAt: state === "complete" ? orderDate : null,
			products: products.map(({ menuItem, product, ...rest }) => ({
				product: product || menuItem,
				...rest,
			})),
			createdAt: orderDate,
			updatedAt: orderDate,
		};
		orders.push(order);
	}

	// Sort by date so invoice numbers ascend chronologically
	orders.sort((a, b) => a.createdAt - b.createdAt);
	orders.forEach((o, i) => {
		if (o.invoiceNumber) o.invoiceNumber = `INV-${String(i + 1).padStart(4, "0")}`;
	});

	// 5. Insert all orders
	const insertResult = await db.collection("orders").insertMany(orders);
	console.log(`Inserted ${insertResult.insertedCount} demo orders`);

	// 6. Summary
	const completedOrders = orders.filter((o) => o.state === "complete");
	const totalRevenue = completedOrders.reduce((s, o) => s + o.orderTotal + o.taxTotal, 0);
	const uniqueCustomers = new Set(orders.filter((o) => o.customer).map((o) => o.customer.toString()));
	console.log("\n=== SEED SUMMARY ===");
	console.log(`  Total orders: ${orders.length}`);
	console.log(`  Completed: ${completedOrders.length}`);
	console.log(`  Total revenue (complete orders): ₹${totalRevenue.toLocaleString("en-IN")}`);
	console.log(`  Unique customers: ${uniqueCustomers.size}`);
	console.log(`  Date range: ${orders[0].createdAt.toISOString().slice(0, 10)} → ${orders[orders.length - 1].createdAt.toISOString().slice(0, 10)}`);
	console.log(`  Avg ticket: ₹${(totalRevenue / completedOrders.length).toFixed(0)}`);

	await mongoose.disconnect();
	console.log("\nDone.");
}

main().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
