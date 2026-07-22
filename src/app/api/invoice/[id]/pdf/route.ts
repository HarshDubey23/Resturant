import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Invoices } from "#utils/database/models/invoice";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

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
		if (invoice.restaurantID !== restaurantID) throw { status: 403, message: "Access denied" };

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
		return CatchNextResponse(err);
	}
}
