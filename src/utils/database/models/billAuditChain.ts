/** @file BillAuditChain — the tamper-proof append-only ledger. Every mutation
 *    (bill create/edit/cancel/refund/void, shift close, stock adjust, no-delete
 *    toggle) appends an entry here. Each entry carries a SHA-256 hash chaining
 *    it to the previous entry, so deleting or rewriting any row is detectable
 *    via `verifyAuditChain()`. Delete hooks throw to enforce append-only at the
 *    data layer (defence-in-depth alongside noDeleteMode).
 * @phase 2
 * @audit-finding n/a
 */
import mongoose, { type HydratedDocument } from "mongoose";

const auditActions = ["create", "edit", "cancel", "refund", "void", "shift_close", "stock_adjust", "no_delete_toggle"] as const;

const BillAuditChainSchema = new mongoose.Schema<TBillAuditChain>(
        {
                billId: { type: mongoose.Schema.Types.ObjectId, ref: "orders" },
                restaurantID: { type: String, trim: true, lowercase: true, required: true },
                sequenceNo: { type: Number, required: true },
                prevHash: { type: String, required: true },
                payloadHash: { type: String, required: true },
                hash: { type: String, required: true },
                actorRole: { type: String, trim: true, required: true },
                actorId: { type: mongoose.Schema.Types.ObjectId, ref: "accounts" },
                action: { type: String, enum: auditActions, required: true },
                timestamp: { type: Date, default: Date.now },
        },
        { timestamps: true },
);

// Unique compound index guarantees monotonic sequence numbers per restaurant and
// prevents a duplicate insertion from corrupting the chain.
BillAuditChainSchema.index({ restaurantID: 1, sequenceNo: 1 }, { unique: true });
BillAuditChainSchema.index({ billId: 1 });

const APPEND_ONLY_ERROR = "Audit chain is append-only; deletes are forbidden";

// Defence-in-depth: even a malicious actor with DB write access cannot drop rows
// through Mongoose's helper surfaces. Raw driver access is the only escape, and
// that path is logged separately by the platform audit trail. We register both
// document middleware (fires on `doc.deleteOne()`) and query middleware (fires
// on `Model.deleteOne(filter)`) so every code path is covered.
BillAuditChainSchema.pre("deleteOne", { document: true, query: false }, () => {
        throw new Error(APPEND_ONLY_ERROR);
});
BillAuditChainSchema.pre("deleteOne", { document: false, query: true }, () => {
        throw new Error(APPEND_ONLY_ERROR);
});
BillAuditChainSchema.pre("deleteMany", { document: false, query: true }, () => {
        throw new Error(APPEND_ONLY_ERROR);
});
BillAuditChainSchema.pre("findOneAndDelete", () => {
        throw new Error(APPEND_ONLY_ERROR);
});

export const BillAuditChains = mongoose.models?.billAuditChain ?? mongoose.model<TBillAuditChain>("billAuditChain", BillAuditChainSchema);

export type TBillAuditChain = HydratedDocument<{
        billId?: mongoose.Types.ObjectId;
        restaurantID: string;
        sequenceNo: number;
        prevHash: string;
        payloadHash: string;
        hash: string;
        actorRole: string;
        actorId?: mongoose.Types.ObjectId;
        action: (typeof auditActions)[number];
        timestamp: Date;
}>;
