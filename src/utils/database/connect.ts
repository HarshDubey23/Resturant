import { connect } from "mongoose";

import "./models/profile";
import "./models/account";
import "./models/customer";
import "./models/kitchen";
import "./models/menu";
import "./models/table";
import "./models/order";
import "./models/aiConfig";
import "./models/loyalty";
import "./models/aggregatorOrder";
import "./models/campaign";
import "./models/inventory";
import "./models/recipe";
import "./models/invoice";
import "./models/coupon";

const MONGODB_CACHE = global as unknown as {
	mongoose?: { conn: typeof import("mongoose") | null; promise: Promise<typeof import("mongoose")> | null };
};

if (!MONGODB_CACHE.mongoose) {
	MONGODB_CACHE.mongoose = { conn: null, promise: null };
}

async function connectDB() {
	if (MONGODB_CACHE.mongoose!.conn) return MONGODB_CACHE.mongoose!.conn;

	if (!process.env.MONGODB_URI) {
		const err = new Error("MONGODB_URI environment variable is not set. " + "Add it to .env.local (dev) or your hosting provider's env vars (prod).");
		(err as Error & { status?: number }).status = 500;
		throw err;
	}

	if (!MONGODB_CACHE.mongoose!.promise) {
		const options = { autoIndex: false, bufferCommands: false };
		MONGODB_CACHE.mongoose!.promise = connect(process.env.MONGODB_URI, options)
			.then((mongoose) => {
				console.log("🍃 Mongo Connection Established");
				return mongoose;
			})
			.catch((error) => {
				console.error("🍂 MongoDB Connection Failed: ", error.message);
				MONGODB_CACHE.mongoose!.promise = null;
				throw error;
			});
	}

	try {
		MONGODB_CACHE.mongoose!.conn = await MONGODB_CACHE.mongoose!.promise;
	} catch (e) {
		MONGODB_CACHE.mongoose!.promise = null;
		throw e;
	}

	return MONGODB_CACHE.mongoose!.conn;
}

export default connectDB;
