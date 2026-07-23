import connectDB from "#utils/database/connect";
import { AuditLogs } from "#utils/database/models/auditLog";

export type AuditAction =
	| "order_accept"
	| "order_reject"
	| "order_reject_on_active"
	| "order_complete"
	| "menu_create"
	| "menu_update"
	| "menu_delete"
	| "menu_toggle_visibility"
	| "theme_update"
	| "password_change"
	| "ai_keys_update"
	| "payment_refund"
	| "payment_route_settle"
	| "cron_settle"
	| "whatsapp_campaign_create"
	| "whatsapp_campaign_send"
	| "whatsapp_campaign_retry"
	| "whatsapp_campaign_delete"
	| "tables_setup"
	| "menu_setup"
	| "billing_checkout"
	| "customer_login"
	| "customer_order_place"
	| "customer_order_cancel";

interface AuditSession {
	username?: string;
	role?: string;
}

interface RecordAuditParams {
	restaurantID: string;
	session: AuditSession;
	action: AuditAction;
	targetType?: string;
	targetId?: string;
	metadata?: Record<string, unknown>;
	ipAddress?: string;
	userAgent?: string;
}

export async function recordAudit({ restaurantID, session, action, targetType, targetId, metadata, ipAddress, userAgent }: RecordAuditParams): Promise<void> {
	try {
		await connectDB();
		await AuditLogs.create({
			restaurantID,
			actor: session?.username || "system",
			actorRole: session?.role || "system",
			action,
			targetType,
			targetId,
			metadata,
			ipAddress,
			userAgent,
		});
	} catch (err) {
		// Audit logging should NEVER block the main operation.
		// Log the error but don't throw.
		console.error("Audit log write failed:", err);
	}
}
