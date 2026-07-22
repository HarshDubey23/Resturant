import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";

export async function dispatchN8nEvent(eventType: string, data: unknown): Promise<void> {
	switch (eventType) {
		case "external.order_status_update": {
			const { orderId, newState } = (data || {}) as { orderId?: string; newState?: string };
			if (!orderId || !newState) throw new Error("orderId and newState required");
			await connectDB();
			await Orders.findByIdAndUpdate(orderId, { state: newState });
			break;
		}
		default:
			console.warn(`[n8n] Unhandled eventType: ${eventType}`);
	}
}
