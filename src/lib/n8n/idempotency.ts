import mongoose from "mongoose";
import connectDB from "#utils/database/connect";

const WebhookEventSchema = new mongoose.Schema({
	eventId: { type: String, required: true, unique: true, index: true },
	receivedAt: { type: Date, default: Date.now },
	payload: { type: mongoose.Schema.Types.Mixed },
});

const WebhookEvent = mongoose.models?.webhook_events ?? mongoose.model("webhook_events", WebhookEventSchema);

export async function isDuplicate(eventId: string): Promise<boolean> {
	if (!eventId) return false;
	await connectDB();
	try {
		await WebhookEvent.create({ eventId });
		return false;
	} catch (err: unknown) {
		if ((err as { code?: number })?.code === 11000) return true;
		throw err;
	}
}

export async function markProcessed(eventId: string, payload: unknown): Promise<void> {
	if (!eventId) return;
	await connectDB();
	await WebhookEvent.updateOne({ eventId }, { $set: { payload } });
}
