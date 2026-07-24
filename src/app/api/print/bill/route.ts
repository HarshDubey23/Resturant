/**
 * @file POST /api/print/bill — emit ESC/POS customer bill bytes for an order.
 * @phase 2
 * @audit-finding n/a
 *
 * Builds the bill via `buildBill` and returns the raw ESC/POS payload as
 * `application/octet-stream`. If the order has an IRN + signed QR payload
 * (from e-invoicing), they are embedded before the cut command. Field names
 * mirror `InvoiceDocument.tsx` for visual parity with the PDF invoice.
 */

import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Invoices } from "#utils/database/models/invoice";
import { Orders } from "#utils/database/models/order";
import { Profiles } from "#utils/database/models/profile";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";
import { withPermission } from "#utils/helper/rbac";
import { buildBill, type BillItem } from "#utils/print/bill";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PrintBillBody {
	orderId: string;
	width?: 58 | 80;
	/** Optional tip captured by the cashier before printing. */
	tip?: number;
	/** Optional discount amount captured by the cashier. */
	discount?: number;
	/** Optional payment-mode override (defaults to order.paymentGateway). */
	paymentMode?: string;
	/** Pre-built QR payload (signed IRN QR or UPI deep-link). */
	qrPayload?: string;
}

async function handle(req: Request, session: { username?: string; email?: string; id?: string }) {
	const body = (await req.json()) as PrintBillBody;
	if (!body?.orderId) throw { status: 400, message: "orderId is required" };

	const restaurantID = (session.username as string) ?? "";
	if (!restaurantID) throw { status: 400, message: "Restaurant username missing from session" };

	await connectDB();

	const [order, profile, invoice] = await Promise.all([
		Orders.findOne({ _id: body.orderId, restaurantID }).populate("products.product").lean(),
		Profiles.findOne({ restaurantID }).lean(),
		Invoices.findOne({ order: body.orderId }).lean(),
	]);
	if (!order) throw { status: 404, message: "Order not found" };

	const orderDoc = order as unknown as {
		_id: { toString(): string };
		table: string;
		orderTotal?: number;
		taxTotal?: number;
		discountAmount?: number;
		paymentGateway?: string;
		createdAt: Date;
		invoiceNumber?: string;
		products: Array<{
			name?: string;
			product?: { name?: string; price?: number; taxPercent?: number };
			price?: number;
			quantity?: number;
			tax?: number;
		}>;
	};
	const profileDoc = profile as { name?: string; address?: string; gstNumber?: string; currency?: string } | null;
	const invoiceDoc = invoice as {
		invoiceNumber?: string;
		cgst?: number;
		sgst?: number;
		igst?: number;
		subtotal?: number;
		grandTotal?: number;
		irn?: string;
	} | null;

	const items: BillItem[] = orderDoc.products.map((p) => ({
		name: String(p.name ?? p.product?.name ?? "Item"),
		qty: Number(p.quantity ?? 1),
		price: Number(p.price ?? p.product?.price ?? 0),
		total: Number(p.price ?? p.product?.price ?? 0) * Number(p.quantity ?? 1),
	}));

	const subtotal = Number(invoiceDoc?.subtotal ?? orderDoc.orderTotal ?? 0);
	const taxTotal = Number(orderDoc.taxTotal ?? 0);
	const cgst = Number(invoiceDoc?.cgst ?? taxTotal / 2);
	const sgst = Number(invoiceDoc?.sgst ?? taxTotal / 2);
	const igst = Number(invoiceDoc?.igst ?? 0);
	const discount = Number(body.discount ?? orderDoc.discountAmount ?? 0);
	const tip = Number(body.tip ?? 0);
	const grandTotal = Number(invoiceDoc?.grandTotal ?? subtotal + taxTotal - discount + tip);
	const paymentMode = body.paymentMode ?? orderDoc.paymentGateway ?? "cash";
	const irn = invoiceDoc?.irn;
	const qrPayload = body.qrPayload;

	const buffer = buildBill({
		restaurantName: profileDoc?.name ?? restaurantID,
		address: profileDoc?.address,
		gstin: profileDoc?.gstNumber,
		table: String(orderDoc.table ?? "—"),
		orderNumber: invoiceDoc?.invoiceNumber ?? orderDoc.invoiceNumber ?? `#${orderDoc._id.toString().slice(-6).toUpperCase()}`,
		timestamp: new Date(orderDoc.createdAt ?? Date.now()).toISOString(),
		items,
		subtotal,
		cgst,
		sgst,
		igst,
		discount: discount || undefined,
		tip: tip || undefined,
		grandTotal,
		paymentMode,
		irn,
		qrPayload,
		width: body.width ?? 80,
	});

	return new NextResponse(new Uint8Array(buffer), {
		status: 200,
		headers: {
			"Content-Type": "application/octet-stream",
			"Content-Length": String(buffer.length),
			"Cache-Control": "no-store",
		},
	});
}

export const POST = withPermission("kds.action", async (req, session) => {
	try {
		return await handle(req, session);
	} catch (err) {
		captureError(err, { route: "/api/print/bill" });
		return CatchNextResponse(err);
	}
});
