const WHATSAPP_API = "https://graph.facebook.com/v22.0";

export class MetaWhatsAppClient {
	private phoneNumberId: string;
	private token: string;

	constructor() {
		this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
		this.token = process.env.WHATSAPP_ACCESS_TOKEN || "";
	}

	private async request(to: string, payload: Record<string, unknown>) {
		const res = await fetch(`${WHATSAPP_API}/${this.phoneNumberId}/messages`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				messaging_product: "whatsapp",
				recipient_type: "individual",
				to: to.replace(/[^0-9]/g, ""),
				...payload,
			}),
		});

		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(err.error?.message || "WhatsApp API error");
		}

		return res.json();
	}

	async sendText(to: string, text: string) {
		return this.request(to, { type: "text", text: { preview_url: false, body: text } });
	}

	async sendTemplate(to: string, templateName: string, params: Record<string, string>) {
		return this.request(to, {
			type: "template",
			template: {
				name: templateName,
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
		});
	}
}
