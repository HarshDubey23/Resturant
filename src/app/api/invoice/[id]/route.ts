import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Invoices } from "#utils/database/models/invoice";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		await connectDB();

		const invoice = await Invoices.findById(id).populate("order").lean();
		if (!invoice) throw { status: 404, message: "Invoice not found" };

		const restaurantID = session.restaurant?.username || session.username;

		if (session.role === "admin") {
			if (invoice.restaurantID !== restaurantID) throw { status: 403, message: "Access denied" };
		} else if (session.role === "customer") {
			const customerId = session.customer?._id?.toString();
			const orderObj = invoice.order as unknown as { customer?: { _id?: string } | string };
			const orderCustomerId = typeof orderObj?.customer === "object" ? orderObj.customer._id?.toString() : orderObj?.customer?.toString();
			if (orderCustomerId !== customerId) throw { status: 403, message: "Access denied" };
		} else {
			throw { status: 403, message: "Access denied" };
		}

		return NextResponse.json(invoice);
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
