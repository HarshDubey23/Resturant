import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
	{
		restaurantID: { type: String, required: true, index: true },
		actor: { type: String, required: true }, // Account.username or "system"
		actorRole: {
			type: String,
			enum: ["owner", "manager", "captain", "waiter", "chef", "kitchen", "customer", "system", "admin"],
			required: true,
		},
		action: {
			type: String,
			enum: [
				"order_accept",
				"order_reject",
				"order_reject_on_active",
				"order_complete",
				"menu_create",
				"menu_update",
				"menu_delete",
				"menu_toggle_visibility",
				"theme_update",
				"password_change",
				"ai_keys_update",
				"payment_refund",
				"payment_route_settle",
				"cron_settle",
				"whatsapp_campaign_create",
				"whatsapp_campaign_send",
				"whatsapp_campaign_retry",
				"whatsapp_campaign_delete",
				"tables_setup",
				"menu_setup",
				"billing_checkout",
				"customer_login",
				"customer_order_place",
				"customer_order_cancel",
			],
			required: true,
		},
		targetType: { type: String }, // "order", "menu", "table", "campaign", "account", etc.
		targetId: { type: String }, // ObjectId of the affected document
		metadata: { type: mongoose.Schema.Types.Mixed }, // Extra context (e.g. plan change details)
		ipAddress: { type: String },
		userAgent: { type: String },
	},
	{ timestamps: true },
);

// Compound index for efficient querying
AuditLogSchema.index({ restaurantID: 1, createdAt: -1 });

export const AuditLogs = mongoose.models?.auditlogs ?? mongoose.model("auditlogs", AuditLogSchema);
