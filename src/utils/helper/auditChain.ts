/** @file auditChain — append + verify the billAuditChain ledger. Each append
 *    computes payloadHash = sha256(canonicalJSON(payload)), pulls the prior
 *    entry's hash as prevHash, increments the per-restaurant sequenceNo, and
 *    writes hash = sha256(prevHash + payloadHash + sequenceNo + restaurantID +
 *    timestamp). Verify walks genesis→head re-computing every link.
 * @phase 2
 * @audit-finding n/a
 */
import { createHash, randomUUID } from "node:crypto";
import connectDB from "#utils/database/connect";
import { BillAuditChains, type TBillAuditChain } from "#utils/database/models/billAuditChain";
import { captureError } from "#utils/helper/sentryWrapper";

const GENESIS = "GENESIS";

/** Deterministic JSON for hashing — keys sorted, no whitespace, ISO dates. */
function canonicalJSON(value: unknown): string {
	if (value === null || value === undefined) return "null";
	if (typeof value !== "object") return JSON.stringify(value);
	if (Array.isArray(value)) {
		return `[${value.map(canonicalJSON).join(",")}]`;
	}
	const obj = value as Record<string, unknown>;
	const keys = Object.keys(obj).sort();
	return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJSON(obj[k])}`).join(",")}}`;
}

function sha256(input: string): string {
	return createHash("sha256").update(input).digest("hex");
}

export interface AppendAuditChainParams {
	billId?: string;
	restaurantID: string;
	actorRole: string;
	actorId?: string;
	action: "create" | "edit" | "cancel" | "refund" | "void" | "shift_close" | "stock_adjust" | "no_delete_toggle";
	payload: Record<string, unknown>;
}

/**
 * Appends a new entry to the per-restaurant audit chain. Sequence numbers are
 * monotonically incremented; the unique compound index `{restaurantID,
 * sequenceNo}` guarantees no duplicate inserts slip through even under a race.
 */
export async function appendAuditChain(params: AppendAuditChainParams): Promise<TBillAuditChain> {
	await connectDB();

	const { restaurantID, actorRole, action, payload } = params;
	const payloadHash = sha256(canonicalJSON(payload));

	// Find the current head of the chain for this restaurant.
	const lastEntry = await BillAuditChains.findOne({ restaurantID }).sort({ sequenceNo: -1 }).lean();
	const prevHash = lastEntry?.hash ?? GENESIS;
	const sequenceNo = (lastEntry?.sequenceNo ?? 0) + 1;
	const timestamp = new Date();

	// Hash binds: prior hash + this payload's hash + monotonic seq + tenant +
	// timestamp. Any tampering with prevHash, payload, seq or ts breaks the link.
	const hash = sha256(`${prevHash}|${payloadHash}|${sequenceNo}|${restaurantID}|${timestamp.toISOString()}`);

	try {
		const entry = await BillAuditChains.create({
			billId: params.billId,
			restaurantID,
			sequenceNo,
			prevHash,
			payloadHash,
			hash,
			actorRole,
			actorId: params.actorId,
			action,
			timestamp,
		});
		return entry;
	} catch (err) {
		// Race-condition recovery: a concurrent append may have grabbed the same
		// sequenceNo. Re-read head and retry once with the new prevHash/seq.
		const retryLast = await BillAuditChains.findOne({ restaurantID }).sort({ sequenceNo: -1 }).lean();
		if (!retryLast) throw err;
		const retrySeq = (retryLast.sequenceNo ?? 0) + 1;
		const retryPrev = retryLast.hash ?? GENESIS;
		const retryTs = new Date();
		const retryHash = sha256(`${retryPrev}|${payloadHash}|${retrySeq}|${restaurantID}|${retryTs.toISOString()}`);
		try {
			return await BillAuditChains.create({
				billId: params.billId,
				restaurantID,
				sequenceNo: retrySeq,
				prevHash: retryPrev,
				payloadHash,
				hash: retryHash,
				actorRole,
				actorId: params.actorId,
				action,
				timestamp: retryTs,
			});
		} catch (retryErr) {
			captureError(retryErr, { route: "auditChain/append-retry", restaurantID, action });
			throw retryErr;
		}
	}
}

export interface VerifyAuditChainResult {
	ok: boolean;
	brokenAt?: number;
	totalEntries: number;
}

/**
 * Walks the entire chain from genesis to head and verifies every link. Returns
 * the sequence number of the first broken entry (or ok:true if the chain is
 * intact). Two failure modes are detected: (1) the stored hash does not match
 * a freshly-computed hash (payload or link tampered), and (2) prevHash does not
 * equal the prior entry's hash (row inserted or reordered).
 */
export async function verifyAuditChain(restaurantID: string): Promise<VerifyAuditChainResult> {
	await connectDB();

	const entries = await BillAuditChains.find({ restaurantID }).sort({ sequenceNo: 1 }).lean();
	if (entries.length === 0) {
		return { ok: true, totalEntries: 0 };
	}

	let previousHash = GENESIS;
	let sequence = 0;
	for (const entry of entries) {
		sequence += 1;
		// Sequence must be monotonic starting from 1.
		if (entry.sequenceNo !== sequence) {
			return { ok: false, brokenAt: sequence, totalEntries: entries.length };
		}
		// prevHash must equal the previous entry's hash (or GENESIS for #1).
		if (entry.prevHash !== previousHash) {
			return { ok: false, brokenAt: sequence, totalEntries: entries.length };
		}
		const recomputed = sha256(
			`${entry.prevHash}|${entry.payloadHash}|${entry.sequenceNo}|${restaurantID}|${new Date(entry.timestamp).toISOString()}`,
		);
		if (recomputed !== entry.hash) {
			return { ok: false, brokenAt: sequence, totalEntries: entries.length };
		}
		previousHash = entry.hash;
	}

	return { ok: true, totalEntries: entries.length };
}

/**
 * Test-only helper for generating standalone payload hashes (exported so unit
 * tests can recompute expected hashes without duplicating the canonical-JSON
 * logic).
 */
export function computePayloadHash(payload: unknown): string {
	return sha256(canonicalJSON(payload));
}

/** Stable opaque request id used for cross-correlation in logs. */
export function newRequestId(): string {
	return randomUUID();
}
