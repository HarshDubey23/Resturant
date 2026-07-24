/**
 * @file KOT (Kitchen Order Ticket) ESC/POS builder.
 * @phase 2
 * @audit-finding n/a
 *
 * Composes the pure primitives from `./escpos` into a kitchen-ready ticket.
 * One KOT per station — the caller is responsible for splitting `items` by
 * `station` before invoking `buildKot`. `kotSerial` is the hash-chained
 * sequence number issued by the print API (the caller appends it to the
 * billAuditChain before printing).
 */

import { align, bold, compose, cut, feed, init, type PrintWidth, size, text } from "./escpos";

export interface KotItem {
	/** Item name as it appears on the menu (e.g. "Paneer Butter Masala"). */
	name: string;
	/** Quantity to prepare (positive integer). */
	qty: number;
	/** Free-text modifier line (e.g. "No onion, Extra cream"). Optional. */
	modifiers?: string[];
	/** Kitchen station this ticket is routed to (e.g. "main", "grill"). */
	station: string;
}

export interface BuildKotInput {
	restaurantName: string;
	/** Table identifier (e.g. "T5"). */
	table: string;
	/** Human-readable order number (e.g. "#1024"). */
	orderNumber: string;
	/** ISO timestamp or pre-formatted datetime string. */
	timestamp: string;
	/** Steward name printed on the KOT for kitchen traceability. */
	steward: string;
	items: KotItem[];
	/** Zero-padded serial appended to the audit chain by the print API. */
	kotSerial: string;
	/** Thermal paper width — 58mm (~32 cols) or 80mm (~48 cols). */
	width?: PrintWidth;
}

/** Usable character columns at the default font for each paper width. */
const COLUMNS: Record<PrintWidth, number> = {
	58: 32,
	80: 48,
};

/** Repeat a single character to draw a horizontal rule across the ticket. */
function rule(width: PrintWidth): string {
	return "-".repeat(COLUMNS[width]);
}

/** Format the timestamp as `YYYY-MM-DD HH:MM` for the KOT header. */
function formatTimestamp(input: string): string {
	const date = new Date(input);
	if (Number.isNaN(date.getTime())) return input;
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Build the ESC/POS byte payload for a single-station KOT. Layout matches
 * the spec in the worklog: centred restaurant name + KOT label, table/order
 * header, timestamp + steward, item lines (qty × name with optional modifier
 * sublines), KOT serial footer, then paper cut.
 */
export function buildKot(input: BuildKotInput): Buffer {
	const width = input.width ?? 58;
	const cols = COLUMNS[width];
	const ts = formatTimestamp(input.timestamp);

	const header = compose(
		init(),
		align("center"),
		bold(true),
		text(input.restaurantName.toUpperCase()),
		text("\n"),
		bold(false),
		text("KOT"),
		text("\n"),
		align("left"),
		text(rule(width)),
		text("\n"),
	);

	// Table + Order row: `Table: T5    Order: #1024` — padded to the column width.
	const tableTag = `Table: ${input.table}`;
	const orderTag = `Order: ${input.orderNumber}`;
	const gap = Math.max(1, cols - tableTag.length - orderTag.length);
	const metaRow = `${tableTag}${" ".repeat(gap)}${orderTag}\n`;

	const stewardRow = `${ts}  Steward: ${input.steward}\n`;

	const divider = compose(text(rule(width)), text("\n"));

	// Item lines — each item occupies a qty/name row plus optional modifier rows.
	const itemBuffers = input.items.map((item) => {
		const qtyTag = `${item.qty}x`;
		const nameLine = `${qtyTag.padEnd(4)}${item.name}\n`;
		const modLines = (item.modifiers ?? []).map((m) => `     [${m}]\n`).join("");
		return compose(text(nameLine), text(modLines));
	});

	const footer = compose(text(rule(width)), text("\n"), bold(true), text(`KOT #: ${input.kotSerial}`), text("\n"), bold(false), feed(3), cut(true));

	return compose(header, text(metaRow), text(stewardRow), divider, ...itemBuffers, footer);
}

/** Re-export the size primitive so callers can adjust font scale if needed. */
export { size };
