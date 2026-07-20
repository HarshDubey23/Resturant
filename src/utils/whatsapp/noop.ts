export class NoopWhatsAppClient {
	async sendText(to: string, text: string) {
		console.debug(`[whatsapp] No-op sendText to ${to}: ${text.slice(0, 50)}...`);
		return { success: true, skipped: true };
	}

	async sendTemplate(to: string, templateName: string, params: Record<string, string>) {
		console.debug(`[whatsapp] No-op sendTemplate to ${to}: ${templateName}`);
		return { success: true, skipped: true };
	}
}
