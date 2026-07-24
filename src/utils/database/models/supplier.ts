/** @file Supplier model — vendor master with GSTIN, items supplied, outstanding
 *    balance and a payment history journal. Used by the GRN (stock-in) flow to
 *    record supplier invoices and to compute ageing payables.
 * @phase 2
 * @audit-finding n/a
 */
import mongoose, { type HydratedDocument } from "mongoose";

const SupplierSchema = new mongoose.Schema<TSupplier>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true, index: true },
		name: { type: String, trim: true, required: true },
		phone: { type: String, trim: true },
		gstin: { type: String, trim: true, uppercase: true },
		items: [{ type: String, trim: true }],
		outstandingBalance: { type: Number, default: 0 },
		payments: [
			{
				amount: { type: Number, required: true },
				date: { type: Date, default: Date.now },
				method: { type: String, trim: true },
				note: { type: String, trim: true },
			},
		],
	},
	{ timestamps: true },
);

SupplierSchema.index({ restaurantID: 1, name: 1 });

export const Suppliers = mongoose.models?.suppliers ?? mongoose.model<TSupplier>("suppliers", SupplierSchema);

export type TSupplier = HydratedDocument<{
	restaurantID: string;
	name: string;
	phone?: string;
	gstin?: string;
	items: string[];
	outstandingBalance: number;
	payments: Array<{
		amount: number;
		date: Date;
		method?: string;
		note?: string;
	}>;
}>;
