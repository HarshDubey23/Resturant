import { createHmac, randomUUID } from "node:crypto";
import { captureError } from "#utils/helper/sentryWrapper";
import { env } from "./env";

export async function triggerN8nWorkflow<T>(
	eventType: string,
	payload: T,
	opts: { idempotent?: boolean; awaitResponse?: boolean } = { idempotent: true, awaitResponse: false },
): Promise<{ ok: boolean; status: number }> {
	if (!env.N8N_WEBHOOK_URL || !env.N8N_WEBHOOK_SECRET) {
		return { ok: false, status: 0 };
	}

	const eventId = randomUUID();
	const body = JSON.stringify({
		eventType,
		payload,
		eventId,
		ts: Date.now(),
	});

	const signature = createHmac("sha256", env.N8N_WEBHOOK_SECRET).update(body).digest("hex");
	const url = `${env.N8N_WEBHOOK_URL}/${eventType}`;

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10000);
		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-N8N-Signature": signature,
				"X-Request-Id": eventId,
				...(env.N8N_WEBHOOK_TOKEN && { Authorization: `Bearer ${env.N8N_WEBHOOK_TOKEN}` }),
			},
			body,
			signal: controller.signal,
		});
		clearTimeout(timeout);
		return { ok: res.ok, status: res.status };
	} catch (err) {
		captureError(err, { route: "n8n/client", eventType });
		return { ok: false, status: 0 };
	}
}
