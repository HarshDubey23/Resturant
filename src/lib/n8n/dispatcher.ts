/** @file n8n dispatcher — routes inbound n8n events to the appropriate DB
 *    mutation + audit-chain append. Every handler opens a DB connection,
 *    validates the payload, mutates safely (no fire-and-forget), and appends
 *    to the tamper-proof billAuditChain where financially relevant. Unknown
 *    events are logged via captureError and re-thrown so the webhook returns
 *    400 and n8n retries/alerts. No console calls — captureError only.
 * @phase 3
 * @audit-finding n/a
 */
import connectDB from "#utils/database/connect";
import { Customers } from "#utils/database/models/customer";
import { Inventory } from "#utils/database/models/inventory";
import { Orders } from "#utils/database/models/order";
import { Shifts } from "#utils/database/models/shift";
import { appendAuditChain } from "#utils/helper/auditChain";
import { captureError } from "#utils/helper/sentryWrapper";

interface OrderStatusUpdateBody {
	orderId?: string;
	newState?: string;
}

interface RefundProcessedBody {
	orderId?: string;
	refundAmount?: number;
	refundId?: string;
}

interface InventoryAdjustedBody {
	restaurantID?: string;
	inventoryId?: string;
	qty?: number;
	reason?: string;
}

interface CustomerOptInBody {
	customerPhone?: string;
	restaurantID?: string;
	optInWhatsApp?: boolean;
}

interface ShiftFlagClearedBody {
	shiftId?: string;
}

interface HandledError {
	status: number;
	message: string;
}

/** Throws a structured `{status, message}` error for handled failures
 *  (missing fields, not-found, unknown event). The webhook route inspects
 *  `status` to choose 400 vs 500. */
function fail(status: number, message: string): never {
	const err: HandledError = { status, message };
	throw err;
}

function assertRequired<T>(value: T | undefined | null, field: string): T {
	if (value === undefined || value === null) fail(400, `Missing required field: ${field}`);
	return value as T;
}

export async function dispatchN8nEvent(eventType: string, data: unknown): Promise<void> {
	await connectDB();

	switch (eventType) {
		case "external.order_status_update": {
			const body = (data || {}) as OrderStatusUpdateBody;
			const orderId = assertRequired(body.orderId, "orderId");
			const newState = assertRequired(body.newState, "newState");
			const result = await Orders.findByIdAndUpdate(orderId, { state: newState });
			if (!result) fail(404, "Order not found");
			break;
		}

		case "external.refund_processed": {
			const body = (data || {}) as RefundProcessedBody;
			const orderId = assertRequired(body.orderId, "orderId");
			const refundAmount = assertRequired(body.refundAmount, "refundAmount");
			const refundId = body.refundId ?? "";

			const order = await Orders.findById(orderId).lean();
			if (!order) fail(404, "Order not found");

			const total = Number(order.orderTotal ?? 0);
			const priorRefunded = Number(order.refundedAmount ?? 0);
			// Cumulative so multiple partial refunds from n8n accumulate correctly
			// (the inbound payload carries the delta, not the running total).
			const newRefunded = priorRefunded + Number(refundAmount);
			const paymentStatus: "refunded" | "partially_refunded" =
				total > 0 && newRefunded >= total ? "refunded" : "partially_refunded";

			await Orders.findByIdAndUpdate(orderId, {
				$set: {
					refundedAmount: newRefunded,
					paymentStatus,
				},
			});

			await appendAuditChain({
				billId: orderId,
				restaurantID: order.restaurantID,
				actorRole: "n8n",
				action: "refund",
				payload: {
					orderId,
					refundAmount: Number(refundAmount),
					refundId,
					priorRefunded,
					cumulativeRefunded: newRefunded,
					orderTotal: total,
					paymentStatus,
				},
			});
			break;
		}

		case "external.inventory_adjusted": {
			const body = (data || {}) as InventoryAdjustedBody;
			const restaurantID = assertRequired(body.restaurantID, "restaurantID");
			const inventoryId = assertRequired(body.inventoryId, "inventoryId");
			const qty = assertRequired(body.qty, "qty");
			const reason = body.reason ?? "n8n adjustment";

			const item = await Inventory.findOne({ _id: inventoryId, restaurantID });
			if (!item) fail(404, "Inventory item not found");

			const prior = Number(item.currentStock ?? 0);
			const updated = prior + Number(qty);
			item.currentStock = updated;
			await item.save();

			await appendAuditChain({
				restaurantID,
				actorRole: "n8n",
				action: "stock_adjust",
				payload: {
					inventoryId,
					name: item.name,
					sku: item.sku ?? "",
					deltaQty: Number(qty),
					priorStock: prior,
					newStock: updated,
					reason,
				},
			});
			break;
		}

		case "external.customer_opt_in": {
			const body = (data || {}) as CustomerOptInBody;
			const customerPhone = assertRequired(body.customerPhone, "customerPhone");
			const restaurantID = assertRequired(body.restaurantID, "restaurantID");
			// The event payload uses `optInWhatsApp` (master-prompt naming) but the
			// persistence model field is `whatsappOptIn` — map explicitly.
			const optInWhatsApp = Boolean(body.optInWhatsApp);

			const result = await Customers.findOneAndUpdate(
				{ phone: customerPhone, restaurantID },
				{ $set: { whatsappOptIn: optInWhatsApp } },
			);
			if (!result) fail(404, "Customer not found");
			break;
		}

		case "external.shift_flag_cleared": {
			const body = (data || {}) as ShiftFlagClearedBody;
			const shiftId = assertRequired(body.shiftId, "shiftId");

			const result = await Shifts.findByIdAndUpdate(shiftId, {
				$set: {
					status: "closed",
					closedAt: new Date(),
				},
			});
			if (!result) fail(404, "Shift not found");
			break;
		}

		default: {
			captureError(new Error("Unhandled n8n eventType"), { eventType });
			fail(400, `Unhandled n8n eventType: ${eventType}`);
		}
	}
}
