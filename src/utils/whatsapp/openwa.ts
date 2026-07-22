export class OpenWAClient {
	private apiUrl: string;

	constructor() {
		this.apiUrl = process.env.OPENWA_API_URL || "http://localhost:3001";
	}

	async sendText(to: string, text: string) {
		const res = await fetch(`${this.apiUrl}/sendText`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ to, text }),
		});

		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(err.message || "OpenWA API error");
		}

		return res.json();
	}

	async sendTemplate(to: string, templateName: string, params: Record<string, string>) {
		const res = await fetch(`${this.apiUrl}/sendTemplate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ to, template: templateName, params }),
		});

		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(err.message || "OpenWA API error");
		}

		return res.json();
	}
}
