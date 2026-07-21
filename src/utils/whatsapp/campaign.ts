import connectDB from "#utils/database/connect";
import { Campaigns } from "#utils/database/models/campaign";
import { Customers } from "#utils/database/models/customer";
import { Orders } from "#utils/database/models/order";
import { sendWhatsAppText } from "#utils/whatsapp/index";

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
		let sent = 0;
		let failed = 0;

		await Campaigns.updateOne({ _id: campaignId }, { totalCount: phones.length });

		for (const phone of phones) {
			try {
				await sendWhatsAppText(phone, msg);
				sent++;
			} catch {
				failed++;
			}
		}

		await Campaigns.updateOne(
			{ _id: campaignId },
			{ status: failed === phones.length ? "failed" : "sent", sentCount: sent, failedCount: failed, sentAt: new Date() },
		);
	} catch (err) {
		console.warn("Campaign send error:", err);
		await Campaigns.updateOne({ _id: campaignId }, { status: "failed" });
	}
}
