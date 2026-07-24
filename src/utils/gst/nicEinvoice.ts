/** @file nicEinvoice — NIC e-invoice API client (sandbox + prod). Implements
 *    auth (ASN/user/password → authToken+SEK), IRN generation, IRN cancel and
 *    IRN lookup. When `EINVOICE_ENABLED !== 'true'`, every call returns a mock
 *    IRN-shaped response so the flow can be integration-tested end-to-end
 *    without a live NIC credential set.
 * @phase 2
 * @audit-finding n/a
 */
import { randomUUID } from "node:crypto";
import { captureError } from "#utils/helper/sentryWrapper";

const SANDBOX_BASE = "https://einvoice-1-sandbox.nic.in";
const PROD_BASE = "https://einvoice.nic.in";

function baseUrl(): string {
	return process.env.NIC_ENV === "prod" ? PROD_BASE : SANDBOX_BASE;
}

function isMockMode(): boolean {
	return process.env.EINVOICE_ENABLED !== "true";
}

export interface NicAuthResult {
	authToken: string;
	sek: string;
	tokenExpiry: string;
}

/**
 * Step 1: Authenticate with NIC. The request body is `{ ClientId, ClientSecret, UserName, Password, AuthToken, ForceRefresh }`
 * wrapped in a base64-encoded `data` field encrypted with the App Key. For the
 * MVP we send the plaintext request — NIC's encryption layer is a Phase 3
 * enhancement that requires per-tenant certificate management. Mock mode
 * short-circuits with a deterministic-looking token.
 */
export async function authNic(
	asn: string,
	user: string,
	password: string,
	gstin: string,
	env?: string,
): Promise<NicAuthResult> {
	if (isMockMode() || !asn || !user || !password) {
		captureError(new Error("NIC e-invoice mock mode active — returning fake auth token"), {
			route: "nicEinvoice/authNic/mock",
			gstin,
			env: env ?? process.env.NIC_ENV ?? "sandbox",
		});
		return {
			authToken: `MOCK_TOKEN_${randomUUID()}`,
			sek: randomUUID(),
			tokenExpiry: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
		};
	}

	const url = `${baseUrl()}/api/v1.04/auth`;
	try {
		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"aspid": asn,
				"user_name": user,
				"password": password,
				"gstin": gstin,
			},
			body: JSON.stringify({ ForceRefresh: true }),
		});
		if (!res.ok) {
			throw new Error(`NIC auth failed: ${res.status} ${await res.text()}`);
		}
		const json = (await res.json()) as { Data?: { AuthToken?: string; Sek?: string; TokenExpiry?: string } };
		return {
			authToken: json.Data?.AuthToken ?? "",
			sek: json.Data?.Sek ?? "",
			tokenExpiry: json.Data?.TokenExpiry ?? new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
		};
	} catch (err) {
		captureError(err, { route: "nicEinvoice/authNic", gstin, env: env ?? process.env.NIC_ENV });
		throw { status: 502, message: "NIC e-invoice auth failed" };
	}
}

export interface NicIrnResult {
	Irn: string;
	AckNo: string;
	AckDt: string;
	SignedInvoice: string;
	QrPayload: string;
}

/**
 * Generates an IRN by POSTing the invoice payload to `/api/v1.04/eicore/v1.03/Invoice`.
 * The payload must conform to the NIC e-invoice schema (we accept any object
 * here and forward it verbatim — validation is NIC's responsibility). Mock
 * mode returns a stable-shaped fake IRN so the order/invoice UI can be tested.
 */
export async function generateIrn(
	authToken: string,
	invoicePayload: Record<string, unknown>,
): Promise<NicIrnResult> {
	if (isMockMode()) {
		captureError(new Error("NIC e-invoice mock mode active — returning fake IRN"), {
			route: "nicEinvoice/generateIrn/mock",
			invoiceNumber: (invoicePayload as { invoiceNumber?: string }).invoiceNumber ?? "unknown",
		});
		return {
			Irn: `MOCK_${randomUUID()}`,
			AckNo: "0",
			AckDt: new Date().toISOString(),
			SignedInvoice: "",
			QrPayload: "mock-qr",
		};
	}

	const url = `${baseUrl()}/api/v1.04/eicore/v1.03/Invoice`;
	try {
		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${authToken}`,
			},
			body: JSON.stringify(invoicePayload),
		});
		if (!res.ok) {
			throw new Error(`NIC IRN generation failed: ${res.status} ${await res.text()}`);
		}
		const json = (await res.json()) as {
			Data?: { Irn?: string; AckNo?: string; AckDt?: string; SignedInvoice?: string; SignedQRCode?: string };
		};
		return {
			Irn: json.Data?.Irn ?? "",
			AckNo: json.Data?.AckNo ?? "",
			AckDt: json.Data?.AckDt ?? new Date().toISOString(),
			SignedInvoice: json.Data?.SignedInvoice ?? "",
			QrPayload: json.Data?.SignedQRCode ?? "",
		};
	} catch (err) {
		captureError(err, { route: "nicEinvoice/generateIrn" });
		throw { status: 502, message: "NIC IRN generation failed" };
	}
}

export interface NicCancelResult {
	Irn: string;
	CancelDate: string;
	CancelReason: string;
}

/**
 * Cancels a previously generated IRN. NIC requires a reason code (1-6) plus a
 * free-text remark.
 */
export async function cancelIrn(
	authToken: string,
	irn: string,
	reason: { code: string; remark: string },
): Promise<NicCancelResult> {
	if (isMockMode()) {
		captureError(new Error("NIC e-invoice mock mode active — returning fake cancel"), {
			route: "nicEinvoice/cancelIrn/mock",
			irn,
		});
		return {
			Irn: irn,
			CancelDate: new Date().toISOString(),
			CancelReason: reason.remark,
		};
	}

	const url = `${baseUrl()}/api/v1.04/eicore/v1.03/Invoice/Cancel`;
	try {
		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${authToken}`,
			},
			body: JSON.stringify({ Irn: irn, CnlRsn: reason.code, CnlRem: reason.remark }),
		});
		if (!res.ok) {
			throw new Error(`NIC IRN cancel failed: ${res.status} ${await res.text()}`);
		}
		const json = (await res.json()) as { Data?: { Irn?: string; CancelDate?: string; CancelReason?: string } };
		return {
			Irn: json.Data?.Irn ?? irn,
			CancelDate: json.Data?.CancelDate ?? new Date().toISOString(),
			CancelReason: json.Data?.CancelReason ?? reason.remark,
		};
	} catch (err) {
		captureError(err, { route: "nicEinvoice/cancelIrn", irn });
		throw { status: 502, message: "NIC IRN cancel failed" };
	}
}

export interface NicIrnDetails {
	Irn: string;
	AckNo: string;
	AckDt: string;
	SignedInvoice: string;
	SignedQRCode: string;
	Status: string;
}

/**
 * Fetches IRN details by IRN number. Used by the audit-chain verify step to
 * cross-check NIC's record against our local chain.
 */
export async function getIrnDetails(authToken: string, irn: string): Promise<NicIrnDetails> {
	if (isMockMode()) {
		captureError(new Error("NIC e-invoice mock mode active — returning fake IRN details"), {
			route: "nicEinvoice/getIrnDetails/mock",
			irn,
		});
		return {
			Irn: irn,
			AckNo: "0",
			AckDt: new Date().toISOString(),
			SignedInvoice: "",
			SignedQRCode: "mock-qr",
			Status: "Active",
		};
	}

	const url = `${baseUrl()}/api/v1.04/eicore/v1.03/Invoice/irn/${encodeURIComponent(irn)}`;
	try {
		const res = await fetch(url, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		});
		if (!res.ok) {
			throw new Error(`NIC IRN lookup failed: ${res.status} ${await res.text()}`);
		}
		const json = (await res.json()) as {
			Data?: { Irn?: string; AckNo?: string; AckDt?: string; SignedInvoice?: string; SignedQRCode?: string; Status?: string };
		};
		return {
			Irn: json.Data?.Irn ?? irn,
			AckNo: json.Data?.AckNo ?? "",
			AckDt: json.Data?.AckDt ?? "",
			SignedInvoice: json.Data?.SignedInvoice ?? "",
			SignedQRCode: json.Data?.SignedQRCode ?? "",
			Status: json.Data?.Status ?? "Unknown",
		};
	} catch (err) {
		captureError(err, { route: "nicEinvoice/getIrnDetails", irn });
		throw { status: 502, message: "NIC IRN lookup failed" };
	}
}

/**
 * Convenience helper that pulls NIC credentials from env, authenticates and
 * returns the auth result. Keeps callers from having to know the env-var names.
 */
export function nicCredentialsFromEnv(): {
	asn: string;
	user: string;
	password: string;
	gstin: string;
	env: string;
} {
	return {
		asn: process.env.NIC_ASN ?? "",
		user: process.env.NIC_USER ?? "",
		password: process.env.NIC_PASSWORD ?? "",
		gstin: process.env.NIC_GSTIN ?? "",
		env: process.env.NIC_ENV ?? "sandbox",
	};
}
