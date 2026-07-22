import crypto from "node:crypto";

/**
 * Security-critical cryptographic helpers.
 * - AES-256-GCM encryption for secrets at rest (e.g. AI provider API keys)
 * - Constant-time string comparison that never leaks length or content via timing
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
	const secret = process.env.ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET;
	if (!secret) {
		throw new Error("ENCRYPTION_SECRET (or NEXTAUTH_SECRET) environment variable is required for encrypting secrets at rest.");
	}
	// Derive a stable 32-byte key from the configured secret
	return crypto.createHash("sha256").update(secret, "utf8").digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format (base64url segments): iv.authTag.ciphertext
 */
export function encryptSecret(plaintext: string): string {
	if (!plaintext) return "";
	const key = getEncryptionKey();
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
	const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
	const authTag = cipher.getAuthTag();
	return [iv, authTag, encrypted].map((b) => b.toString("base64url")).join(".");
}

/**
 * Decrypts a value produced by encryptSecret. Returns an empty string for
 * empty input. Throws on tampered/invalid ciphertext (GCM auth failure).
 */
export function decryptSecret(payload: string): string {
	if (!payload) return "";
	const parts = payload.split(".");
	if (parts.length !== 3) throw new Error("Invalid encrypted payload format");
	const [iv, authTag, ciphertext] = parts.map((p) => Buffer.from(p, "base64url"));
	const key = getEncryptionKey();
	const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
	decipher.setAuthTag(authTag);
	return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/** Returns true if the value looks like it was encrypted by encryptSecret. */
export function isEncrypted(value: string): boolean {
	if (!value) return false;
	const parts = value.split(".");
	return parts.length === 3 && parts.every((p) => /^[A-Za-z0-9_-]+$/.test(p));
}

/**
 * Constant-time string comparison. Normalizes differing lengths by hashing
 * both inputs first, so neither length nor content leaks through timing.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
	const aBuf = crypto.createHash("sha256").update(String(a), "utf8").digest();
	const bBuf = crypto.createHash("sha256").update(String(b), "utf8").digest();
	return crypto.timingSafeEqual(aBuf, bBuf) && a.length === b.length;
}
