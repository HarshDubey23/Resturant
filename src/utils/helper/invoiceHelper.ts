import mongoose from "mongoose";
import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";

const COUNTERS_COLLECTION = "invoice_counters";

export async function generateInvoiceNumber(restaurantID: string): Promise<string> {
	await connectDB();
	const account = await Accounts.findOne({ username: restaurantID }).populate("profile");
	const prefix = (account?.profile as { name?: string } | null)?.name ?? restaurantID;
	const shortPrefix = prefix
		.substring(0, 3)
		.toUpperCase()
		.replace(/[^A-Z]/g, "X");

	const now = new Date();
	const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
	const fyEnd = fyStart + 1;
	const fy = `${fyStart.toString().slice(-2)}-${fyEnd.toString().slice(-2)}`;
	const prefixPattern = `${shortPrefix}/${fy}/`;

	const counterDoc = await mongoose.connection.db
		?.collection(COUNTERS_COLLECTION)
		?.findOneAndUpdate({ counterKey: `invoice_${restaurantID}_${fy}` }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });

	const newSeq = (counterDoc as { seq?: number } | null)?.seq ?? 1;
	return `${prefixPattern}${String(newSeq).padStart(5, "0")}`;
}
