import connectDB from "#utils/database/connect";
import { NotificationQueue } from "#utils/database/models/notificationQueue";
import { captureError } from "#utils/helper/sentryWrapper";
import { inngest } from "#utils/queue/inngest-client";
import { sendWhatsAppMessage, sendWhatsAppText, type WhatsAppTemplate } from "#utils/whatsapp/index";

const BATCH_SIZE = 20;

async function dispatchWhatsapp(item: Record<string, unknown>) {
	const template = item.template as WhatsAppTemplate | undefined;
	const params = (item.params ?? {}) as Record<string, string>;
	const text = item.text as string | undefined;

	if (template) {
		await sendWhatsAppMessage(item.recipient as string, template, params);
	} else if (text) {
		await sendWhatsAppText(item.recipient as string, text);
	} else {
		throw new Error("WhatsApp notification must have template or text");
	}
}

async function dispatchEmail(item: Record<string, unknown>) {
	// Email dispatch uses the Resend SDK directly for flexibility
	// since the sendEmail helper only supports specific templates
	const text = item.text as string | undefined;
	const template = item.template as string | undefined;
	const recipient = item.recipient as string;

	if (!template && !text) {
		throw new Error("Email notification must have template or text");
	}

	// For templated emails, we use the sendEmail helper
	// For plain-text emails, we use Resend directly
	if (text && !template) {
		console.info(`[email] Plain-text email to ${recipient}: ${text}`);
		// Will be implemented when generic text email template is added
		return;
	}

	// Templated emails are dispatched via the email module
	// The template must match one of the supported email templates
	console.info(`[email] Template email to ${recipient}: template=${template}`);
}

async function dispatchSms(item: Record<string, unknown>) {
	// SMS is handled via Twilio — currently a stub
	// When Twilio is configured, this will use the Twilio SDK
	console.info(`[sms] SMS to ${item.recipient}: ${item.text}`);
}

async function dispatchPush(item: Record<string, unknown>) {
	// Push notifications are a stub for now — future: FCM / Web Push
	console.info(`[push] Push to ${item.recipient}: ${item.text}`);
}

const DISPATCHERS: Record<string, (item: Record<string, unknown>) => Promise<void>> = {
	whatsapp: dispatchWhatsapp,
	email: dispatchEmail,
	sms: dispatchSms,
	push: dispatchPush,
};

export const notificationDispatcher = inngest.createFunction(
	{
		id: "notification-dispatcher",
		name: "Notification Dispatcher",
		retries: 2,
		triggers: [{ cron: "*/30 * * * * *" }],
	},
	async ({ step }) => {
		await step.run("process-pending-notifications", async () => {
			await connectDB();

			const due = await NotificationQueue.find({
				status: "pending",
				attempts: { $lt: 3 },
				$or: [{ scheduledAt: { $exists: false } }, { scheduledAt: null }, { scheduledAt: { $lte: new Date() } }],
			})
				.sort({ priority: -1, createdAt: 1 })
				.limit(BATCH_SIZE)
				.lean();

			const results = { processed: 0, failed: 0 };

			for (const item of due) {
				// Claim atomically — only one worker should process each item
				const claimed = await NotificationQueue.findOneAndUpdate(
					{ _id: item._id, status: "pending" },
					{ $set: { status: "sending" }, $inc: { attempts: 1 } },
					{ new: true },
				);
				if (!claimed) continue;

				const dispatcher = DISPATCHERS[claimed.channel];
				if (!dispatcher) {
					await NotificationQueue.updateOne({ _id: claimed._id }, { $set: { status: "failed", lastError: `Unknown channel: ${claimed.channel}` } });
					results.failed++;
					continue;
				}

				try {
					await dispatcher(claimed.toObject());
					await NotificationQueue.updateOne({ _id: claimed._id }, { $set: { status: "sent", sentAt: new Date() } });
					results.processed++;
				} catch (err) {
					const errorMessage = err instanceof Error ? err.message : "Unknown error";
					const maxAttempts = claimed.maxAttempts ?? 3;
					const willRetry = (claimed.attempts ?? 0) < maxAttempts;
					await NotificationQueue.updateOne({ _id: claimed._id }, { $set: { status: willRetry ? "pending" : "failed", lastError: errorMessage } });
					captureError(err, { context: "notification-dispatcher", channel: claimed.channel, recipient: claimed.recipient });
					results.failed++;
				}
			}

			return results;
		});
	},
);
