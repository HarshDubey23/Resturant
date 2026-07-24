/**
 * @file Customer bill (thermal/A5) ESC/POS builder.
 * @phase 2
 * @audit-finding n/a
 *
 * Field names mirror `src/components/layout/InvoiceDocument.tsx` so the
 * thermal print matches the existing PDF invoice. If `irn` and `qrPayload`
 * are supplied, an IRN line + QR symbol are appended before the cut command
 * (e-invoice compliance per GSTN spec).
 */

import { align, bold, compose, cut, feed, init, padColumn, type PrintWidth, qr, size, text } from "./escpos";

export interface BillItem {
	name: string;
	qty: number;
	/** Per-unit price (tax-exclusive if gstInclusive=false). */
	price: number;
	/** Line total = qty × price. Pre-computed by caller to avoid rounding drift. */
	total: number;
}

export interface BuildBillInput {
	restaurantName: string;
	address?: string;
	gstin?: string;
	/** Table identifier (e.g. "T5"). Optional for takeaway orders. */
	table?: string;
	/** Human-readable order/invoice number (e.g. "#1024" or "SPC/26-27/00001"). */
	orderNumber: string;
	/** ISO timestamp or pre-formatted datetime string. */
	timestamp: string;
	items: BillItem[];
	/** Pre-discount, pre-tax subtotal. */
	subtotal: number;
	/** Central GST share (intra-state). 0 for inter-state invoices. */
	cgst?: number;
	/** State GST share (intra-state). 0 for inter-state invoices. */
	sgst?: number;
	/** Integrated GST (inter-state). 0 for intra-state invoices. */
	igst?: number;
	/** Discount amount applied (already subtracted from subtotal→totals). */
	discount?: number;
	/** Optional tip / gratuity line. */
	tip?: number;
	/** Final payable amount (subtotal - discount + tax + tip). */
	grandTotal: number;
	/** "cash" | "upi" | "card" | "razorpay" | "stripe". */
	paymentMode: string;
	/** Invoice Reference Number from the IRP (e-invoice). Optional. */
	irn?: string;
	/** Pre-built QR payload (signed QR or UPI deep-link). Optional. */
	qrPayload?: string;
	width?: PrintWidth;
}

const COLUMNS: Record<PrintWidth, number> = {
	58: 32,
	80: 48,
};

function rule(width: PrintWidth): string {
	return "-".repeat(COLUMNS[width]);
}

function formatTimestamp(input: string): string {
	const date = new Date(input);
	if (Number.isNaN(date.getTime())) return input;
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Format a monetary amount with 2-decimal precision for the bill. */
function money(value: number): string {
	return (Number(value) || 0).toFixed(2);
}

/**
 * Build the ESC/POS byte payload for a customer bill. Layout matches the
 * existing PDF invoice: restaurant header, GSTIN, invoice meta row, item
 * table, tax breakdown, grand total, payment mode, optional IRN + QR.
 */
export function buildBill(input: BuildBillInput): Buffer {
	const width = input.width ?? 80;
	const ts = formatTimestamp(input.timestamp);

	const header = compose(
		init(),
		align("center"),
		bold(true),
		size(1, 1),
		text(input.restaurantName.toUpperCase()),
		text("\n"),
		size(0, 0),
		bold(false),
	);
	const addressLines = input.address
		? compose(text(input.address), text("\n"))
		: Buffer.alloc(0);
	const gstinLine = input.gstin ? compose(text(`GSTIN: ${input.gstin}`), text("\n")) : Buffer.alloc(0);

	const divider = compose(align("left"), text(rule(width)), text("\n"));

	const tableTag = input.table ? `Table: ${input.table}` : "Takeaway";
	const invoiceTag = `Bill: ${input.orderNumber}`;
	const metaRow = `${tableTag}    ${invoiceTag}\n${ts}\n`;

	// Column layout (80mm, 48 cols): qty(3) + name(28) + price(8) + total(9)
	// On 58mm (32 cols): qty(2) + name(18) + price(5) + total(7) — tighter.
	const qtyW = width === 80 ? 3 : 2;
	const priceW = width === 80 ? 8 : 5;
	const totalW = width === 80 ? 9 : 7;
	const nameW = COLUMNS[width] - qtyW - priceW - totalW;

	const itemHeader = compose(
		text(`${"QTY".padEnd(qtyW)}${"ITEM".padEnd(nameW)}${"PRICE".padStart(priceW)}${"TOTAL".padStart(totalW)}`),
		text("\n"),
		text(rule(width)),
		text("\n"),
	);

	const itemLines = input.items.map((item) => {
		const qty = String(`${item.qty}x`).padEnd(qtyW);
		const name = item.name.length > nameW ? `${item.name.slice(0, nameW - 1)}…` : item.name.padEnd(nameW);
		const price = money(item.price).padStart(priceW);
		const total = money(item.total).padStart(totalW);
		return compose(text(`${qty}${name}${price}${total}`), text("\n"));
	});

	const totalsBlock = compose(
		text(rule(width)),
		text("\n"),
		text(padColumn("Subtotal", money(input.subtotal), COLUMNS[width])),
		text("\n"),
	);

	const discountLine = input.discount
		? compose(text(padColumn("Discount", `- ${money(input.discount)}`, COLUMNS[width])), text("\n"))
		: Buffer.alloc(0);

	const cgstLine = input.cgst ? compose(text(padColumn("CGST", money(input.cgst), COLUMNS[width])), text("\n")) : Buffer.alloc(0);
	const sgstLine = input.sgst ? compose(text(padColumn("SGST", money(input.sgst), COLUMNS[width])), text("\n")) : Buffer.alloc(0);
	const igstLine = input.igst ? compose(text(padColumn("IGST", money(input.igst), COLUMNS[width])), text("\n")) : Buffer.alloc(0);

	const tipLine = input.tip ? compose(text(padColumn("Tip", money(input.tip), COLUMNS[width])), text("\n")) : Buffer.alloc(0);

	const grandTotalBlock = compose(
		text(rule(width)),
		text("\n"),
		bold(true),
		size(1, 1),
		text(padColumn("GRAND TOTAL", money(input.grandTotal), COLUMNS[width])),
		text("\n"),
		size(0, 0),
		bold(false),
	);

	const paymentBlock = compose(
		text(padColumn("Payment Mode", input.paymentMode.toUpperCase(), COLUMNS[width])),
		text("\n"),
		text(rule(width)),
		text("\n"),
		align("center"),
		text("Thank you for dining with us!\n"),
	);

	const irnBlock = input.irn
		? compose(align("left"), text(`IRN: ${input.irn}\n`))
		: Buffer.alloc(0);

	const qrBlock = input.qrPayload
		? compose(align("center"), qr(input.qrPayload), feed(2))
		: Buffer.alloc(0);

	const footer = compose(feed(3), cut(true));

	return compose(
		header,
		addressLines,
		gstinLine,
		divider,
		text(metaRow),
		divider,
		itemHeader,
		...itemLines,
		totalsBlock,
		discountLine,
		cgstLine,
		sgstLine,
		igstLine,
		tipLine,
		grandTotalBlock,
		paymentBlock,
		irnBlock,
		qrBlock,
		footer,
	);
}

export { size };
