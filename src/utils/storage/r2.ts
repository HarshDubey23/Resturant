/**
 * Cloudflare R2 storage helper. R2 is S3-compatible so we use the AWS
 * SDK. Uploads are organized as `{restaurantID}/{type}/{uuid}.{ext}`
 * (e.g. `spiceroute/menu/abc123.jpg`).
 *
 * Required env vars:
 *   R2_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET_NAME
 *   R2_PUBLIC_URL (the public Cloudflare URL or R2.dev subdomain)
 *
 * When env vars are not set, uploadImage() returns null and the caller
 * falls back to whatever local/blob URL the client sent.
 */
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

let _client: S3Client | null = null;
let _clientInitFailed = false;

function getClient(): S3Client | null {
	if (_clientInitFailed) return null;
	if (_client) return _client;
	if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
		_clientInitFailed = true;
		return null;
	}
	_client = new S3Client({
		region: "auto",
		endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: R2_ACCESS_KEY_ID,
			secretAccessKey: R2_SECRET_ACCESS_KEY,
		},
	});
	return _client;
}

export function isR2Configured(): boolean {
	return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && R2_PUBLIC_URL);
}

export type UploadBucket = "menu" | "profile" | "kitchen" | "feedback" | "general";

/**
 * Upload an image buffer to R2. Returns the public URL on success, or
 * null when R2 isn't configured (caller should fall back gracefully).
 */
export async function uploadImage(params: { buffer: Buffer; key: string; contentType: string; bucket?: UploadBucket }): Promise<string | null> {
	const client = getClient();
	if (!client || !R2_BUCKET_NAME || !R2_PUBLIC_URL) return null;

	const fullKey = params.bucket ? `${params.bucket}/${params.key}` : params.key;

	await client.send(
		new PutObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: fullKey,
			Body: params.buffer,
			ContentType: params.contentType,
			CacheControl: "public, max-age=31536000, immutable",
		}),
	);

	return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${fullKey}`;
}

/**
 * Generate a stable object key from an uploaded filename.
 * `{restaurantID}/{type}/{slug-or-uuid}.{ext}`
 */
export function buildObjectKey(params: { restaurantID: string; originalName: string; suffix?: string }): string {
	const ext = params.originalName.split(".").pop()?.toLowerCase() || "jpg";
	const slug = params.originalName
		.replace(/\.[^.]+$/, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 40);
	const suffix = params.suffix || Math.random().toString(36).slice(2, 10);
	return `${slug}-${suffix}.${ext}`;
}

/**
 * Generate a presigned PUT URL for client-side direct uploads to R2.
 * The URL expires after the given number of seconds (default 5 min).
 * Returns null when R2 is not configured.
 */
export async function getPresignedPutUrl(key: string, contentType: string, expiresIn = 300): Promise<string | null> {
	const client = getClient();
	if (!client || !R2_BUCKET_NAME) return null;

	const command = new PutObjectCommand({
		Bucket: R2_BUCKET_NAME,
		Key: key,
		ContentType: contentType,
		CacheControl: "public, max-age=31536000, immutable",
	});

	return getSignedUrl(client, command, { expiresIn });
}

/**
 * Returns the public URL for an uploaded object. This is a simple
 * string concatenation — no API call needed. Returns null when
 * R2_PUBLIC_URL is not configured.
 */
export function getPublicUrl(key: string): string | null {
	if (!R2_PUBLIC_URL) return null;
	return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}
