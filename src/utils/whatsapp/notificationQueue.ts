import connectDB from "#utils/database/connect";
import { NotificationQueue, type TNotificationQueue } from "#utils/database/models/notificationQueue";
import { sendWhatsAppMessage, sendWhatsAppText, type WhatsAppTemplate } from "./index";

const BATCH_SIZE = 10;

export async function enqueueNotification(params: {
	restaurantID: string;
	channel: "whatsapp" | "email" | "sms" | "push";
	recipient: string;
	template?: WhatsAppTemplate;
	params?: Record<string, string>;
	text?: string;
	priority?: number;
	scheduledAt?: Date;
}): Promise<TNotificationQueue | null> {
	try {
		const notification = await NotificationQueue.create(params);
		return notification;
	} catch {
		return null;
	}
}

export async function processNotificationQueue(restaurantID?: string): Promise<number> {
	await connectDB();
	const filter: Record<string, unknown> = { status: "pending", attempts: { $lt: 3 } };
	if (restaurantID) filter.restaurantID = restaurantID;

	const due = await NotificationQueue.find({
		...filter,
		$or: [{ scheduledAt: { $exists: false } }, { scheduledAt: null }, { scheduledAt: { $lte: new Date() } }],
	})
		.sort({ priority: -1, createdAt: 1 })
		.limit(BATCH_SIZE);

	let processed = 0;

	for (const item of due) {
		const claimed = await NotificationQueue.findOneAndUpdate(
			{ _id: item._id, status: "pending" },
			{ $set: { status: "sending" }, $inc: { attempts: 1 } },
			{ new: true },
		);
		if (!claimed) continue;

		try {
			if (claimed.template) {
				await sendWhatsAppMessage(claimed.recipient, claimed.template as WhatsAppTemplate, (claimed.params ?? {}) as Record<string, string>);
			} else if (claimed.text) {
				await sendWhatsAppText(claimed.recipient, claimed.text);
			}
			await NotificationQueue.updateOne({ _id: claimed._id }, { $set: { status: "sent", sentAt: new Date() } });
			processed++;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Unknown error";
			const willRetry = (claimed.attempts || 0) < 3;
			await NotificationQueue.updateOne({ _id: claimed._id }, { $set: { status: willRetry ? "pending" : "failed", lastError: errorMessage } });
		}
	}

	return processed;
}
