const PLATFORM_FEE_PERCENT = 0.5;

function getRazorpayAuth(): string {
	const key = process.env.RAZORPAY_KEY_ID;
	const secret = process.env.RAZORPAY_KEY_SECRET;
	if (!key || !secret) throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set");
	return Buffer.from(`${key}:${secret}`).toString("base64");
}

async function razorpayFetch(path: string, options: RequestInit = {}) {
	const res = await fetch(`https://api.razorpay.com/v1${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Basic ${getRazorpayAuth()}`,
			...options.headers,
		},
	});
	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(error.error?.description || `Razorpay API error: ${res.status}`);
	}
	return res.json();
}

export interface RazorpayOrder {
	id: string;
	entity: string;
	amount: number;
	amount_paid: number;
	amount_due: number;
	currency: string;
	receipt: string;
	status: string;
	attempts: number;
	notes: Record<string, string>;
	created_at: number;
}

export interface RazorpayPayment {
	id: string;
	entity: string;
	amount: number;
	currency: string;
	status: string;
	order_id: string;
	invoice_id: string | null;
	international: boolean;
	method: string;
	amount_refunded: number;
	refund_status: string | null;
	captured: boolean;
	description: string;
	card_id: string | null;
	bank: string | null;
	wallet: string | null;
	vpa: string | null;
	email: string;
	contact: string;
	notes: Record<string, string>;
	fee: number;
	tax: number;
	error_code: string | null;
	error_description: string | null;
	created_at: number;
}

export async function createRazorpayOrder(params: { amount: number; currency?: string; receipt: string; notes?: Record<string, string> }): Promise<RazorpayOrder> {
	const platformFee = Math.round(params.amount * (PLATFORM_FEE_PERCENT / 100));
	return razorpayFetch("/orders", {
		method: "POST",
		body: JSON.stringify({
			amount: params.amount,
			currency: params.currency || "INR",
			receipt: params.receipt,
			notes: {
				...params.notes,
				platform_fee: String(platformFee),
			},
		}),
	});
}

export async function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): Promise<boolean> {
	const crypto = await import("node:crypto");
	const secret = process.env.RAZORPAY_KEY_SECRET;
	if (!secret) return false;

	const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");

	return expected === signature;
}

export async function capturePayment(paymentId: string, amount: number): Promise<RazorpayPayment> {
	return razorpayFetch(`/payments/${paymentId}/capture`, {
		method: "POST",
		body: JSON.stringify({ amount }),
	});
}

export async function refundPayment(paymentId: string, amount?: number): Promise<unknown> {
	return razorpayFetch("/refunds", {
		method: "POST",
		body: JSON.stringify({
			payment_id: paymentId,
			...(amount && { amount }),
		}),
	});
}

export async function createPaymentLink(params: {
	amount: number;
	description: string;
	customer: { name: string; email: string; contact: string };
	notes?: Record<string, string>;
}): Promise<unknown> {
	return razorpayFetch("/payment_links", {
		method: "POST",
		body: JSON.stringify({
			amount: params.amount,
			currency: "INR",
			description: params.description,
			customer: params.customer,
			notify: { sms: true, email: true },
			notes: params.notes,
		}),
	});
}

export async function createRecurringSubscription(params: { customerId: string; planId: string; totalCount: number }): Promise<unknown> {
	return razorpayFetch("/subscriptions", {
		method: "POST",
		body: JSON.stringify({
			plan_id: params.planId,
			total_count: params.totalCount,
			customer_notify: true,
			notes: {
				customer_id: params.customerId,
			},
		}),
	});
}

export async function createRazorpayContact(params: { name: string; email: string; contact: string; type?: string }): Promise<{ id: string }> {
	return razorpayFetch("/contacts", {
		method: "POST",
		body: JSON.stringify({
			name: params.name,
			email: params.email,
			contact: params.contact,
			type: params.type || "customer",
		}),
	});
}

export async function createRazorpayFundAccount(contactId: string, vpa: string): Promise<unknown> {
	return razorpayFetch("/fund_accounts", {
		method: "POST",
		body: JSON.stringify({
			contact_id: contactId,
			account_type: "vpa",
			virtual_address: vpa,
		}),
	});
}

export async function createPayout(params: {
	accountNumber: string;
	fundAccountId: string;
	amount: number;
	currency?: string;
	mode?: string;
	purpose?: string;
	referenceId: string;
}): Promise<unknown> {
	return razorpayFetch("/payouts", {
		method: "POST",
		body: JSON.stringify({
			account_number: params.accountNumber,
			fund_account_id: params.fundAccountId,
			amount: params.amount,
			currency: params.currency || "INR",
			mode: params.mode || "UPI",
			purpose: params.purpose || "refund",
			reference_id: params.referenceId,
		}),
	});
}
