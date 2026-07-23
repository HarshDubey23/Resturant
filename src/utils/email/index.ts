/**
 * Email module — factory pattern similar to src/utils/whatsapp/index.ts.
 *
 * Uses Resend (https://resend.com) for transactional email delivery.
 * When RESEND_API_KEY is not configured, sendEmail() logs the payload
 * and returns gracefully — it never crashes the caller.
 *
 * Required env var:
 *   RESEND_API_KEY
 */
import { Resend } from "resend";
import type { PasswordResetEmail } from "./templates/password-reset";
import type { PaymentReceiptEmail } from "./templates/payment-receipt";
import type { SignupVerifyEmail } from "./templates/signup-verify";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

let _client: Resend | null = null;
let _warned = false;

function getClient(): Resend | null {
	if (_client) return _client;
	if (!RESEND_API_KEY) {
		if (!_warned) {
			console.info("[email] RESEND_API_KEY not configured — emails will be logged but not sent.");
			_warned = true;
		}
		return null;
	}
	_client = new Resend(RESEND_API_KEY);
	return _client;
}

export type EmailTemplate = "signup-verify" | "password-reset" | "payment-receipt";

export type EmailParams = {
	"signup-verify": SignupVerifyEmail;
	"password-reset": PasswordResetEmail;
	"payment-receipt": PaymentReceiptEmail;
};

const FROM_ADDRESS = process.env.NODE_ENV === "production" ? "OrderWorder <noreply@orderworder.com>" : "OrderWorder <onboarding@resend.dev>";

export async function sendEmail<T extends EmailTemplate>(params: { to: string; template: T; params: EmailParams[T] }): Promise<{ id: string } | null> {
	const client = getClient();

	const { render } = await import("react-email");
	const templateModule = await import(`./templates/${params.template}`);

	const element = templateModule.default(params.params);
	const html = await render(element);

	if (!client) {
		console.info(`[email] Skipped sending "${params.template}" to ${params.to}. RESEND_API_KEY not set.`);
		console.info(`[email] Preview HTML length: ${html.length} chars`);
		return null;
	}

	const { data, error } = await client.emails.send({
		from: FROM_ADDRESS,
		to: params.to,
		subject: templateModule.subject(params.params),
		html,
	});

	if (error) {
		console.error(`[email] Failed to send "${params.template}" to ${params.to}:`, error);
		return null;
	}

	return { id: data?.id ?? "" };
}
