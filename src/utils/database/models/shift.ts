/** @file Shift model — a cashier's till session. Tracks opening/closing cash,
 *    expected vs counted variance, KOT count and links to all bills issued in
 *    the shift. `hashChainSeq` ties each shift-close event into the append-only
 *    bill audit chain so the shift Z-report cannot be silently rewritten.
 * @phase 2
 * @audit-finding n/a
 */
import mongoose, { type HydratedDocument } from "mongoose";

const shiftStatus = ["open", "closed", "flagged"] as const;

const ShiftSchema = new mongoose.Schema<TShift>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true, index: true },
		cashierId: { type: mongoose.Schema.Types.ObjectId, ref: "accounts", required: true },
		cashierName: { type: String, trim: true, required: true },
		openedAt: { type: Date, default: Date.now, required: true },
		closedAt: { type: Date },
		openingCash: { type: Number, default: 0 },
		countedCash: { type: Number, default: 0 },
		expectedCash: { type: Number, default: 0 },
		variance: { type: Number, default: 0 },
		status: { type: String, enum: shiftStatus, default: "open", required: true, index: true },
		bills: [{ type: mongoose.Schema.Types.ObjectId, ref: "orders" }],
		kotCount: { type: Number, default: 0 },
		flaggedReason: { type: String, trim: true },
		hashChainSeq: { type: Number },
	},
	{ timestamps: true },
);

ShiftSchema.index({ restaurantID: 1, status: 1 });
ShiftSchema.index({ restaurantID: 1, openedAt: -1 });

export const Shifts = mongoose.models?.shifts ?? mongoose.model<TShift>("shifts", ShiftSchema);

export type TShift = HydratedDocument<{
	restaurantID: string;
	cashierId: mongoose.Types.ObjectId;
	cashierName: string;
	openedAt: Date;
	closedAt?: Date;
	openingCash: number;
	countedCash: number;
	expectedCash: number;
	variance: number;
	status: (typeof shiftStatus)[number];
	bills: Array<mongoose.Types.ObjectId>;
	kotCount: number;
	flaggedReason?: string;
	hashChainSeq?: number;
}>;
