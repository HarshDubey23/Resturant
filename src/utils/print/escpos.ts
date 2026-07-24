/**
 * @file ESC/POS command builder — pure functions returning Buffer primitives.
 * @phase 2
 * @audit-finding n/a
 *
 * Each helper returns a Node `Buffer` of raw ESC/POS bytes. Callers (kot.ts,
 * bill.ts, print API routes) compose these via `compose(...)` to assemble a
 * full ticket. No I/O happens here — these are pure byte builders so they can
 * be unit-tested and reused by both the server (LAN print agent) and any
 * future WebUSB client path.
 */

/** Print-width enum used by KOT / bill builders. */
export type PrintWidth = 58 | 80;

/** Alignment options accepted by the ESC/POS `1B 61 n` command. */
export type Align = "left" | "center" | "right";

/** Barcode systems supported by the `1D 6B` command. */
export type BarcodeType = "UPC_A" | "UPC_E" | "EAN13" | "EAN8" | "CODE128" | "ITF" | "CODABAR";

const ALIGN_MAP: Record<Align, number> = {
	left: 0,
	center: 1,
	right: 2,
};

const BARCODE_MAP: Record<BarcodeType, number> = {
	UPC_A: 0,
	UPC_E: 1,
	EAN13: 2,
	EAN8: 3,
	ITF: 4,
	CODABAR: 6,
	CODE128: 73, // 0x49 — most thermal printers accept this for CODE128
};

/** Wrap raw bytes in a Buffer (Uint8Array-compatible). */
function buf(bytes: ArrayLike<number>): Buffer {
	return Buffer.from(bytes);
}

/** `1B 40` — initialise the printer (clears buffer + restores defaults). */
export function init(): Buffer {
	return buf([0x1b, 0x40]);
}

/** UTF-8 encoded text payload. Multi-byte chars handled natively by Buffer.from. */
export function text(str: string): Buffer {
	return Buffer.from(str, "utf8");
}

/** `1B 45 01` / `1B 45 00` — toggle bold styling. */
export function bold(on: boolean): Buffer {
	return buf([0x1b, 0x45, on ? 0x01 : 0x00]);
}

/** `1B 61 n` — left/center/right alignment. */
export function align(value: Align): Buffer {
	return buf([0x1b, 0x61, ALIGN_MAP[value]]);
}

/**
 * `1D 21 n` — character size. Width/height each take 0 or 1 (1 = double) so
 * we pack them into the low nibble: bit 0 = width, bit 4 = height.
 */
export function size(width: 0 | 1 | 2 | 3 = 0, height: 0 | 1 | 2 | 3 = 0): Buffer {
	const n = ((width & 0x03) << 4) | (height & 0x03);
	return buf([0x1d, 0x21, n]);
}

/** `1B 64 n` — feed n lines (paper feed before cut). */
export function feed(n: number): Buffer {
	const lines = Math.max(1, Math.min(255, Math.trunc(n)));
	return buf([0x1b, 0x64, lines]);
}

/**
 * `1D 56 00`/`01` — paper cut. `partial=true` (default) sends a full cut on
 * most printers; passing `false` sends a partial cut for printers that support
 * it. The spec asks for `01` to mean full and `00` to mean partial, which we
 * honour here verbatim.
 */
export function cut(partial = true): Buffer {
	// partial=true → 0x01 (full cut on common Epson-compatible printers,
	// matching the audit spec). partial=false → 0x00 partial cut.
	return buf([0x1d, 0x56, partial ? 0x01 : 0x00]);
}

/** `1B 70 00 32 00` — cash drawer kick (pulse to drawer 1, ~50ms on-time). */
export function drawerKick(): Buffer {
	return buf([0x1b, 0x70, 0x00, 0x32, 0x00]);
}

/**
 * ESC/POS QR-code sequence per Epson GB18030 spec:
 *   1D 28 6B 03 00 31 43 06      — module size = 6
 *   1D 28 6B 03 00 31 45 30      — error-correction level M (30)
 *   1D 28 6B <pL> <pH> 31 50 30 <data>  — store data
 *   1D 28 6B 03 00 31 51 30      — print the symbol
 */
export function qr(data: string): Buffer {
	const dataBytes = Buffer.from(data, "utf8");
	// (pL + pH) is the 16-bit little-endian length of [30 + data] = 1 + data.length
	const len = dataBytes.length + 1;
	const pL = len & 0xff;
	const pH = (len >> 8) & 0xff;
	const moduleSize = buf([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06]);
	const errorCorrection = buf([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30]);
	const storeData = Buffer.concat([buf([0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]), dataBytes]);
	const printSymbol = buf([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]);
	return Buffer.concat([moduleSize, errorCorrection, storeData, printSymbol]);
}

/**
 * `1D 6B <type> <len> <data>` — print a 1D barcode. CODE128 is the default
 * since most receipts embed an invoice/IRN reference rather than an EAN.
 */
export function barcode(data: string, type: BarcodeType = "CODE128"): Buffer {
	const dataBytes = Buffer.from(data, "ascii");
	const code = BARCODE_MAP[type];
	const len = Math.min(255, dataBytes.length);
	return Buffer.concat([buf([0x1d, 0x6b, code, len]), dataBytes.subarray(0, len)]);
}

/** Concatenate an arbitrary number of ESC/POS buffers into one ticket. */
export function compose(...buffers: Array<Buffer | Uint8Array>): Buffer {
	return Buffer.concat(
		buffers.map((b) => (Buffer.isBuffer(b) ? b : Buffer.from(b))),
	);
}

/**
 * Convenience wrapper that pads/truncates a string to fit a fixed-width
 * column. Used by kot.ts/bill.ts to keep item rows aligned on 58/80mm paper.
 */
export function padColumn(left: string, right: string, width: number): string {
	// Approximate monospace column width: each char counts as 1 (ASCII) so we
	// use the string .length. Multi-byte characters (e.g. ₹, emojis) will
	// visually differ on the printer but the byte-payload stays correct.
	const gap = Math.max(1, width - left.length - right.length);
	return `${left}${" ".repeat(gap)}${right}`;
}

/**
 * Stateful builder for callers that prefer a fluent API over the free
 * functions. Each method returns `this` so commands can be chained. `build()`
 * produces the final Buffer.
 */
export class EscPos {
	private chunks: Buffer[] = [];

	/** Append an arbitrary buffer (escape hatch for custom commands). */
	raw(b: Buffer | Uint8Array): this {
		this.chunks.push(Buffer.isBuffer(b) ? b : Buffer.from(b));
		return this;
	}

	init(): this {
		return this.raw(init());
	}

	write(str: string): this {
		return this.raw(text(str));
	}

	line(str = ""): this {
		return this.write(str).write("\n");
	}

	bold(on: boolean): this {
		return this.raw(bold(on));
	}

	align(value: Align): this {
		return this.raw(align(value));
	}

	size(width: 0 | 1 | 2 | 3 = 0, height: 0 | 1 | 2 | 3 = 0): this {
		return this.raw(size(width, height));
	}

	feed(n: number): this {
		return this.raw(feed(n));
	}

	cut(partial = true): this {
		return this.raw(cut(partial));
	}

	drawerKick(): this {
		return this.raw(drawerKick());
	}

	qr(data: string): this {
		return this.raw(qr(data));
	}

	barcode(data: string, type: BarcodeType = "CODE128"): this {
		return this.raw(barcode(data, type));
	}

	build(): Buffer {
		return Buffer.concat(this.chunks);
	}
}
