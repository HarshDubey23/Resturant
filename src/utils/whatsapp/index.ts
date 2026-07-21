import { formatCurrency } from "#utils/helper/currency";
import { MetaWhatsAppClient } from "./meta";
import { NoopWhatsAppClient } from "./noop";
import { OpenWAClient } from "./openwa";

type WhatsAppClient = MetaWhatsAppClient | OpenWAClient | NoopWhatsAppClient;

let clientInstance: WhatsAppClient | null = null;

let _warned = false;

export function getWhatsAppClient(): WhatsAppClient {
	if (clientInstance) return clientInstance;

	if (process.env.OPENWA_API_URL) {
		if (!_warned) {
			console.info("[whatsapp] Using OpenWA client");
			_warned = true;
		}
		clientInstance = new OpenWAClient();
	} else if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
		if (!_warned) {
			console.info("[whatsapp] Using Meta Cloud API client");
			_warned = true;
		}
		clientInstance = new MetaWhatsAppClient();
	} else {
		if (!_warned) {
			console.info("[whatsapp] No WhatsApp provider configured — using no-op client. Messages will be logged but not sent.");
			_warned = true;
		}
		clientInstance = new NoopWhatsAppClient();
	}

	return clientInstance;
}

export function resetClient() {
	clientInstance = null;
	_warned = false;
}

export type WhatsAppTemplate = "order_confirmed" | "order_ready" | "feedback" | "abandoned_cart" | "birthday_offer" | "weekly_offer";

const TEMPLATE_NAMES: Record<WhatsAppTemplate, string> = {
	order_confirmed: "order_confirmed",
	order_ready: "order_ready",
	feedback: "order_feedback",
	abandoned_cart: "abandoned_cart_reminder",
	birthday_offer: "birthday_offer",
	weekly_offer: "weekly_offer",
};

export async function sendWhatsAppMessage(to: string, template: WhatsAppTemplate, params: Record<string, string>) {
	const client = getWhatsAppClient();
	const result = await client.sendTemplate(to, TEMPLATE_NAMES[template], params);
	return result;
}

export async function sendWhatsAppText(to: string, text: string) {
	const client = getWhatsAppClient();
	return client.sendText(to, text);
}

export async function sendWhatsAppOrderReceipt(to: string, order: { table: string; items: string; total: number; points: number; currency?: string }) {
	const body = `Thank you for ordering at Table ${order.table}!

Your Order:
${order.items}

Total: ${formatCurrency(order.total, order.currency || "INR")}
Points Earned: ${order.points} ✨

We'll notify you when it's ready!`;

	return sendWhatsAppText(to, body);
}

export async function sendWhatsAppOrderReady(to: string, table: string) {
	return sendWhatsAppText(to, `Your order for Table ${table} is ready! Please collect from the counter.`);
}
