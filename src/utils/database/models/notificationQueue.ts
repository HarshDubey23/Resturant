import mongoose, { type HydratedDocument } from "mongoose";

const NotificationChannel = ["whatsapp", "email", "sms", "push"] as const;
const NotificationStatus = ["pending", "sending", "sent", "failed"] as const;

const NotificationQueueSchema = new mongoose.Schema<TNotificationQueue>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true },
		channel: { type: String, enum: NotificationChannel, required: true },
		recipient: { type: String, required: true },
		template: { type: String },
		params: { type: mongoose.Schema.Types.Mixed, default: {} },
		text: { type: String },
		status: { type: String, enum: NotificationStatus, default: "pending" },
		priority: { type: Number, default: 0 },
		attempts: { type: Number, default: 0 },
		maxAttempts: { type: Number, default: 3 },
		lastError: { type: String },
		scheduledAt: { type: Date },
		sentAt: { type: Date },
	},
	{ timestamps: true },
);

NotificationQueueSchema.index({ restaurantID: 1, status: 1, priority: -1, createdAt: 1 });
NotificationQueueSchema.index({ status: 1, scheduledAt: 1 });

export const NotificationQueue = mongoose.models?.notificationQueue ?? mongoose.model<TNotificationQueue>("notificationQueue", NotificationQueueSchema);

export type TNotificationQueue = HydratedDocument<{
	restaurantID: string;
	channel: (typeof NotificationChannel)[number];
	recipient: string;
	template?: string;
	params?: Record<string, unknown>;
	text?: string;
	status: (typeof NotificationStatus)[number];
	priority: number;
	attempts: number;
	maxAttempts: number;
	lastError?: string;
	scheduledAt?: Date;
	sentAt?: Date;
}>;
