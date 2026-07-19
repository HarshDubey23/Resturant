const WHATSAPP_API = "https://graph.facebook.com/v22.0";

function getConfig() {
	const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
	const token = process.env.WHATSAPP_ACCESS_TOKEN;
	if (!phoneNumberId || !token) throw new Error("WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN must be set");
	return { phoneNumberId, token };
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
	const { phoneNumberId, token } = getConfig();

	const res = await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			messaging_product: "whatsapp",
			recipient_type: "individual",
			to: to.replace(/[^0-9]/g, ""),
			type: "template",
			template: {
				name: TEMPLATE_NAMES[template],
				language: { code: "hi" },
				components: [
					{
						type: "body",
						parameters: Object.entries(params).map(([key, value]) => ({
							type: "text",
							parameter_name: key,
							text: value,
						})),
					},
				],
			},
		}),
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.error?.message || "WhatsApp API error");
	}

	return res.json();
}

export async function sendWhatsAppText(to: string, text: string) {
	const { phoneNumberId, token } = getConfig();

	const res = await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			messaging_product: "whatsapp",
			recipient_type: "individual",
			to: to.replace(/[^0-9]/g, ""),
			type: "text",
			text: { preview_url: false, body: text },
		}),
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.error?.message || "WhatsApp API error");
	}

	return res.json();
}

export async function sendWhatsAppOrderReceipt(to: string, order: { table: string; items: string; total: number; points: number }) {
	const { phoneNumberId, token } = getConfig();

	const body = `Thank you for ordering at Table ${order.table}!

Your Order:
${order.items}

Total: ₹${order.total}
Points Earned: ${order.points} ✨

We'll notify you when it's ready!`;

	return sendWhatsAppText(to, body);
}

export async function sendWhatsAppOrderReady(to: string, table: string) {
	return sendWhatsAppText(to, `🍽️ Your order for Table ${table} is ready! Please collect from the counter.`);
}
