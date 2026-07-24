import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Invoices } from "#utils/database/models/invoice";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		await connectDB();

		const invoice = await Invoices.findById(id).lean();
		if (!invoice) throw { status: 404, message: "Invoice not found" };

		const restaurantID = session.restaurant?.username || session.username;

		// FIX (audit C3): mirror the ownership check from /api/invoice/[id]/route.ts.
		// Previously the PDF route only checked restaurant scope, so any customer
		// of the same restaurant could download any other customer's invoice PDF
		// by guessing the invoice ObjectId — an IDOR exposing names, phone
		// numbers, and order totals.
		if (session.role === "admin") {
			if (invoice.restaurantID !== restaurantID) throw { status: 403, message: "Access denied" };
		} else if (session.role === "customer") {
			const customerId = session.customer?._id?.toString();
			// Fetch the order to compare ownership — invoice.customerPhone is
			// not a stable identity, so we walk through the order relation.
			const orderDoc = await Orders.findById(invoice.order).lean();
			const orderCustomerId = orderDoc?.customer?.toString();
			if (orderCustomerId !== customerId) throw { status: 403, message: "Access denied" };
		} else {
			// Staff roles (owner/manager/cashier/etc.) — requirePermission would
			// be the cleaner gate, but to preserve parity with the JSON route
			// we accept any authenticated staff role with restaurant scope.
			if (invoice.restaurantID !== restaurantID) throw { status: 403, message: "Access denied" };
		}

		const order = await Orders.findById(invoice.order).populate("customer").populate("products.product").lean();
		if (!order) throw { status: 404, message: "Order not found" };

		const { InvoiceDocument } = await import("#components/layout/InvoiceDocument");
		const { renderToStream } = await import("@react-pdf/renderer");

		const doc = InvoiceDocument({
			order: order as unknown as Parameters<typeof InvoiceDocument>[0]["order"],
			invoiceNumber: invoice.invoiceNumber,
		});

		const stream = await renderToStream(doc);
		const chunks: Buffer[] = [];
		for await (const chunk of stream) {
			chunks.push(Buffer.from(chunk));
		}
		const pdfBuffer = Buffer.concat(chunks);

		return new NextResponse(pdfBuffer, {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
				"Content-Length": pdfBuffer.length.toString(),
			},
		});
	} catch (err) {
		captureError(err, { route: "/api/invoice/[id]/pdf" });
		return CatchNextResponse(err);
	}
}
