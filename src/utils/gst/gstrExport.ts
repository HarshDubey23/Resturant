/** @file gstrExport — official GSTR-1 / GSTR-3B JSON exporters for India GST.
 *    Reads invoices for the month, groups B2B (customer GSTIN present) vs B2C,
 *    builds HSN summary, document-issue count, and reconciles against the
 *    billAuditChain so a missing/cancelled invoice is flagged before the
 *    return is filed.
 * @phase 2
 * @audit-finding n/a
 */

import connectDB from "#utils/database/connect";
import { BillAuditChains } from "#utils/database/models/billAuditChain";
import { Invoices } from "#utils/database/models/invoice";
import { Profiles } from "#utils/database/models/profile";
import { captureError } from "#utils/helper/sentryWrapper";

const RATES = [0, 5, 12, 18, 28] as const;

function monthBounds(month: string): { start: Date; end: Date } {
	// month format: 'YYYY-MM'
	const [y, m] = month.split("-").map((s) => Number.parseInt(s, 10));
	if (!y || !m) throw { status: 400, message: `Invalid month format: ${month}. Expected 'YYYY-MM'.` };
	const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
	const end = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
	return { start, end };
}

/** Naive HSN extraction — the master prompt does not store HSN per menu item,
 * so we synthesise an "UNKNOWN" HSN bucket. Real HSN integration is a Phase 3
 * enhancement (menu.hsn field + UI). */
function hsnForInvoice(): string {
	return "0000";
}

interface B2bEntry {
	inum: string;
	itms: Array<{
		num: number;
		itm_det: {
			txval: number;
			iamt: number;
			camt: number;
			samt: number;
			csamt: number;
			rt: number;
		};
	}>;
}

interface B2clEntry {
	inum: string;
	itms: Array<{
		num: number;
		itm_det: {
			txval: number;
			iamt: number;
			csamt: number;
			rt: number;
		};
	}>;
}

interface B2csEntry {
	ty: string;
	rt: number;
	txval: number;
	iamt: number;
	camt: number;
	samt: number;
	csamt: number;
}

interface HsnRow {
	num: number;
	hsn_sc: string;
	desc: string;
	uqc: string;
	qty: number;
	txval: number;
	iamt: number;
	camt: number;
	samt: number;
	csamt: number;
	rt: number;
}

export interface Gstr1Output {
	gstin: string;
	fp: string;
	gt: number;
	cur_rd: number;
	b2b: Array<{ ctin: string; inv: B2bEntry[] }>;
	b2cl: Array<{ pos: string; inv: B2clEntry[] }>;
	b2cs: B2csEntry[];
	hsn: { data: HsnRow[] };
	doc_issue: {
		doc_det: Array<{
			doc_num: number;
			doc_det: {
				num: number;
				from: string;
				to: string;
				totnum: number;
				cancel: number;
				net_issue: number;
			};
		}>;
	};
}

/**
 * Builds the official GSTR-1 JSON shape for the given restaurant + month.
 * Reference: CBIC GSTR-1 file format (returns schema v1.1).
 */
export async function exportGstr1(restaurantID: string, month: string): Promise<Gstr1Output> {
	await connectDB();
	const { start, end } = monthBounds(month);

	const [profile, invoices] = await Promise.all([
		Profiles.findOne({ restaurantID }).lean(),
		Invoices.find({
			restaurantID,
			generatedAt: { $gte: start, $lt: end },
		}).lean(),
	]);

	const gstin = (profile?.gstNumber as string) ?? "";

	// Group invoices: B2B if customerGstin present, else B2CL if inter-state
	// (we approximate intra-state — every B2C invoice is filed under B2CL POS
	// derived from GSTIN's first two digits when available).
	const homeState = gstin ? gstin.substring(0, 2) : "27";
	const b2bByCtin = new Map<string, B2bEntry[]>();
	const b2clByPos = new Map<string, B2clEntry[]>();
	const b2csByRate = new Map<number, B2csEntry>();
	const hsnByRate = new Map<string, HsnRow>();
	let grandTotal = 0;
	let netIssued = 0;

	for (const inv of invoices) {
		const inum = inv.invoiceNumber;
		const taxable = inv.subtotal ?? 0;
		const cgst = inv.cgst ?? 0;
		const sgst = inv.sgst ?? 0;
		const igst = inv.igst ?? 0;
		grandTotal += inv.grandTotal ?? 0;
		netIssued += 1;

		// Find the dominant rate from the first line.
		const rate = inv.items?.[0]?.taxPercent ?? 0;
		const isB2b = !!inv.customerGstin;
		const ctin = (inv.customerGstin as string) ?? "";

		if (isB2b) {
			const entry: B2bEntry = {
				inum,
				itms: [
					{
						num: 1,
						itm_det: { txval: taxable, iamt: igst, camt: cgst, samt: sgst, csamt: 0, rt: rate },
					},
				],
			};
			const arr = b2bByCtin.get(ctin) ?? [];
			arr.push(entry);
			b2bByCtin.set(ctin, arr);
		} else {
			// B2CL — inter-state (uses IGST) goes to b2cl, intra-state (CGST+SGST)
			// is aggregated into b2cs.
			const pos = igst > 0 ? (inv.customerGstin ? inv.customerGstin.substring(0, 2) : homeState) : homeState;
			if (igst > 0) {
				const entry: B2clEntry = {
					inum,
					itms: [
						{
							num: 1,
							itm_det: { txval: taxable, iamt: igst, csamt: 0, rt: rate },
						},
					],
				};
				const arr = b2clByPos.get(pos) ?? [];
				arr.push(entry);
				b2clByPos.set(pos, arr);
			}

			// b2cs is a rate-aggregated summary regardless of intra/inter.
			const b2cs = b2csByRate.get(rate) ?? {
				ty: "INVOICE",
				rt: rate,
				txval: 0,
				iamt: 0,
				camt: 0,
				samt: 0,
				csamt: 0,
			};
			b2cs.txval += taxable;
			b2cs.iamt += igst;
			b2cs.camt += cgst;
			b2cs.samt += sgst;
			b2csByRate.set(rate, b2cs);
		}

		// HSN summary bucket per rate.
		const hsn = hsnForInvoice();
		const hsnKey = `${hsn}|${rate}`;
		const hsnRow = hsnByRate.get(hsnKey) ?? {
			num: hsnByRate.size + 1,
			hsn_sc: hsn,
			desc: "Aggregated sales",
			uqc: "NOS",
			qty: 0,
			txval: 0,
			iamt: 0,
			camt: 0,
			samt: 0,
			csamt: 0,
			rt: rate,
		};
		hsnRow.qty += 1;
		hsnRow.txval += taxable;
		hsnRow.iamt += igst;
		hsnRow.camt += cgst;
		hsnRow.samt += sgst;
		hsnByRate.set(hsnKey, hsnRow);
	}

	// Document-issue summary: one series per restaurant (1–9999999), cancelled
	// count is approximated by counting chain `cancel` actions for the month.
	const chainCancels = await BillAuditChains.countDocuments({
		restaurantID,
		action: "cancel",
		timestamp: { $gte: start, $lt: end },
	}).catch((err: unknown) => {
		captureError(err, { route: "gstr/exportGstr1/chainCancels", restaurantID });
		return 0;
	});

	const b2b = Array.from(b2bByCtin.entries()).map(([ctin, inv]) => ({ ctin, inv }));
	const b2cl = Array.from(b2clByPos.entries()).map(([pos, inv]) => ({ pos, inv }));
	const b2cs = Array.from(b2csByRate.values());
	const hsn = { data: Array.from(hsnByRate.values()) };
	const doc_issue = {
		doc_det: [
			{
				doc_num: 1,
				doc_det: {
					num: 1,
					from: "1",
					to: "9999999",
					totnum: invoices.length,
					cancel: chainCancels,
					net_issue: netIssued,
				},
			},
		],
	};

	return {
		gstin,
		fp: month.replace("-", ""),
		gt: grandTotal,
		cur_rd: grandTotal,
		b2b,
		b2cl,
		b2cs,
		hsn,
		doc_issue,
	};
}

export interface Gstr3bOutput {
	gstin: string;
	ret_period: string;
	inwards: { unregistered: number };
	outward_supp: {
		inter: Record<(typeof RATES)[number], number>;
		intra: Record<(typeof RATES)[number], number>;
	};
	itc_elg: {
		itc_avl: Record<string, unknown>;
		itc_inelg: Record<string, unknown>;
	};
	tax_payable: {
		cgst: number;
		sgst: number;
		igst: number;
		cess: number;
		total: number;
	};
}

/**
 * Builds GSTR-3B summary: outward supplies split inter/intra by rate, total
 * tax payable (CGST+SGST+IGST), and a placeholder ITC section (real ITC needs
 * purchase-register ingestion, which is a Phase 3 feature).
 */
export async function exportGstr3b(restaurantID: string, month: string): Promise<Gstr3bOutput> {
	await connectDB();
	const { start, end } = monthBounds(month);

	const [profile, invoices] = await Promise.all([
		Profiles.findOne({ restaurantID }).lean(),
		Invoices.find({
			restaurantID,
			generatedAt: { $gte: start, $lt: end },
		}).lean(),
	]);

	const gstin = (profile?.gstNumber as string) ?? "";
	const homeState = gstin ? gstin.substring(0, 2) : "27";

	const inter = Object.fromEntries(RATES.map((r) => [r, 0])) as Record<(typeof RATES)[number], number>;
	const intra = Object.fromEntries(RATES.map((r) => [r, 0])) as Record<(typeof RATES)[number], number>;
	let cgstTotal = 0;
	let sgstTotal = 0;
	let igstTotal = 0;

	for (const inv of invoices) {
		const rate = inv.items?.[0]?.taxPercent ?? 0;
		// Snap rate to nearest slab for the bucket.
		const slab = RATES.reduce((best, r) => (Math.abs(r - rate) < Math.abs(best - rate) ? r : best), 0);
		const taxable = inv.subtotal ?? 0;
		const igst = inv.igst ?? 0;
		const pos = inv.customerGstin ? inv.customerGstin.substring(0, 2) : homeState;
		if (igst > 0 || pos !== homeState) {
			inter[slab] += taxable;
			igstTotal += igst;
		} else {
			intra[slab] += taxable;
			cgstTotal += inv.cgst ?? 0;
			sgstTotal += inv.sgst ?? 0;
		}
	}

	const tax_payable = {
		cgst: cgstTotal,
		sgst: sgstTotal,
		igst: igstTotal,
		cess: 0,
		total: cgstTotal + sgstTotal + igstTotal,
	};

	return {
		gstin,
		ret_period: month.replace("-", ""),
		inwards: { unregistered: 0 },
		outward_supp: { inter, intra },
		itc_elg: { itc_avl: {}, itc_inelg: {} },
		tax_payable,
	};
}

export interface ReconcileResult {
	matched: boolean;
	docCount: number;
	chainCount: number;
	discrepancy: number;
}

/**
 * Cross-checks the doc_issue count (number of invoices issued) against the
 * count of `create` actions in the bill audit chain for the same month. Any
 * gap means an invoice was issued without a chain entry (or vice-versa) — a
 * strong tampering signal.
 */
export async function reconcileWithChain(restaurantID: string, month: string): Promise<ReconcileResult> {
	await connectDB();
	const { start, end } = monthBounds(month);

	const [docCount, chainCount] = await Promise.all([
		Invoices.countDocuments({
			restaurantID,
			generatedAt: { $gte: start, $lt: end },
		}),
		BillAuditChains.countDocuments({
			restaurantID,
			action: "create",
			timestamp: { $gte: start, $lt: end },
		}),
	]);

	const discrepancy = Math.abs(docCount - chainCount);
	return {
		matched: discrepancy === 0,
		docCount,
		chainCount,
		discrepancy,
	};
}
