import connectDB from "#utils/database/connect";
import { Campaigns } from "#utils/database/models/campaign";
import { Customers } from "#utils/database/models/customer";
import { Orders } from "#utils/database/models/order";
import { sendWhatsAppText } from "#utils/whatsapp/index";

const CONCURRENCY = 5;
const MAX_RETRIES = 2;

async function sendWithRetry(phone: string, msg: string, maxRetries: number): Promise<boolean> {
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			await sendWhatsAppText(phone, msg);
			return true;
		} catch {
			if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
		}
	}
	return false;
}

async function parallelSend(phones: string[], msg: string, concurrency: number): Promise<{ sent: number; failed: number }> {
	let sent = 0;
	let failed = 0;
	const queue = [...phones];

	const worker = async () => {
		while (queue.length > 0) {
			const phone = queue.shift();
			if (!phone) break;
			const ok = await sendWithRetry(phone, msg, MAX_RETRIES);
			if (ok) sent++;
			else failed++;
		}
	};

	const workers = Array.from({ length: Math.min(concurrency, queue.length || 1) }, () => worker());
	await Promise.all(workers);

	return { sent, failed };
}

export async function sendCampaign(campaignId: string, restaurantID: string, msg: string) {
	try {
		await connectDB();

		const orders = await Orders.find({ restaurantID }).distinct("customer");
		const optedIn = await Customers.find({
			_id: { $in: orders },
			whatsappOptIn: true,
			phone: { $exists: true, $ne: "" },
		}).lean();

		const phones = Array.from(new Set(optedIn.map((c) => c.phone)));

		await Campaigns.updateOne({ _id: campaignId }, { totalCount: phones.length });

		const { sent, failed } = await parallelSend(phones, msg, CONCURRENCY);

		await Campaigns.updateOne(
			{ _id: campaignId },
			{ status: failed === phones.length ? "failed" : "sent", sentCount: sent, failedCount: failed, sentAt: new Date() },
		);
	} catch (err) {
		console.warn("Campaign send error:", err);
		await Campaigns.updateOne({ _id: campaignId }, { status: "failed" });
	}
}
