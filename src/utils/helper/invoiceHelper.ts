import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Invoices } from "#utils/database/models/invoice";

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
	const lastInvoice = await Invoices.findOne({ invoiceNumber: { $regex: `^${prefixPattern}` } }, {}, { sort: { invoiceNumber: -1 } }).lean();

	const lastSeq = lastInvoice ? Number.parseInt((lastInvoice.invoiceNumber as string).split("/").pop() || "0", 10) : 0;
	const newSeq = lastSeq + 1;

	return `${prefixPattern}${String(newSeq).padStart(5, "0")}`;
}
