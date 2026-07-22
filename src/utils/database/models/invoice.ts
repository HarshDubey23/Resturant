import mongoose, { type HydratedDocument } from "mongoose";

const InvoiceSchema = new mongoose.Schema<TInvoice>(
	{
		restaurantID: { type: String, trim: true, lowercase: true, required: true, index: true },
		order: { type: mongoose.Schema.Types.ObjectId, ref: "orders", required: true, index: true },
		invoiceNumber: { type: String, required: true, unique: true },
		customerName: { type: String, trim: true },
		customerPhone: { type: String, trim: true },
		customerGstin: { type: String, trim: true },
		items: [
			{
				name: String,
				quantity: Number,
				price: Number,
				taxPercent: Number,
				taxAmount: Number,
				total: Number,
			},
		],
		subtotal: Number,
		cgst: Number,
		sgst: Number,
		igst: Number,
		grandTotal: Number,
		paymentMethod: { type: String, enum: ["razorpay", "stripe", "cash", "upi"] },
		generatedAt: { type: Date, default: Date.now },
		pdfUrl: { type: String, trim: true },
	},
	{ timestamps: true },
);

export const Invoices = mongoose.models?.invoices ?? mongoose.model<TInvoice>("invoices", InvoiceSchema);

export type TInvoice = HydratedDocument<{
	restaurantID: string;
	order: mongoose.Types.ObjectId;
	invoiceNumber: string;
	customerName?: string;
	customerPhone?: string;
	customerGstin?: string;
	items: Array<{ name: string; quantity: number; price: number; taxPercent: number; taxAmount: number; total: number }>;
	subtotal: number;
	cgst: number;
	sgst: number;
	igst: number;
	grandTotal: number;
	paymentMethod: "razorpay" | "stripe" | "cash" | "upi";
	generatedAt: Date;
	pdfUrl?: string;
}>;
