import { createHmac, timingSafeEqual } from "node:crypto";

const OTP_TOKEN_TTL_MS = 60_000;

function getSecret(): string {
	const secret = process.env.OTP_SECRET || process.env.NEXTAUTH_SECRET;
	if (!secret) {
		throw new Error("OTP_SECRET or NEXTAUTH_SECRET must be configured");
	}
	return secret;
}

export function generateVerificationToken(customerId: string): string {
	const expiry = Date.now() + OTP_TOKEN_TTL_MS;
	const payload = `${customerId}:${expiry}`;
	const hmac = createHmac("sha256", getSecret()).update(payload).digest("hex");
	return `${payload}:${hmac}`;
}

export function verifyVerificationToken(token: string): { customerId: string; valid: true } {
	const parts = token.split(":");
	if (parts.length !== 3) {
		throw new Error("Invalid verification token format");
	}
	const [customerId, expiryStr, hmac] = parts;
	if (!customerId || !expiryStr || !hmac) {
		throw new Error("Invalid verification token");
	}

	const expiry = Number.parseInt(expiryStr, 10);
	if (Number.isNaN(expiry) || Date.now() > expiry) {
		throw new Error("Verification token expired");
	}

	const expectedHmac = createHmac("sha256", getSecret()).update(`${customerId}:${expiry}`).digest("hex");
	const expectedBuffer = Buffer.from(expectedHmac, "hex");
	const actualBuffer = Buffer.from(hmac, "hex");
	if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
		throw new Error("Invalid verification token signature");
	}

	return { customerId, valid: true };
}
