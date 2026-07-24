/** @file TipLedger model — per-walker tip journal aggregated from order.tip.
 *    A single `totalTips` running total + a denormalised list of tip events
 *    (orderId, amount, date, paidOut flag). Used by the cashier payout flow.
 * @phase 2
 * @audit-finding n/a
 */
import mongoose, { type HydratedDocument } from "mongoose";

const TipLedgerSchema = new mongoose.Schema<TTipLedger>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true, index: true },
		waiterId: { type: mongoose.Schema.Types.ObjectId, ref: "accounts", required: true },
		waiterName: { type: String, trim: true, required: true },
		totalTips: { type: Number, default: 0 },
		tips: [
			{
				amount: { type: Number, required: true },
				orderId: { type: mongoose.Schema.Types.ObjectId, ref: "orders" },
				date: { type: Date, default: Date.now },
				paidOut: { type: Boolean, default: false },
			},
		],
	},
	{ timestamps: true },
);

TipLedgerSchema.index({ restaurantID: 1, waiterId: 1 });

export const TipLedgers =
	mongoose.models?.tipLedger ?? mongoose.model<TTipLedger>("tipLedger", TipLedgerSchema);

export type TTipLedger = HydratedDocument<{
	restaurantID: string;
	waiterId: mongoose.Types.ObjectId;
	waiterName: string;
	totalTips: number;
	tips: Array<{
		amount: number;
		orderId?: mongoose.Types.ObjectId;
		date: Date;
		paidOut: boolean;
	}>;
}>;
