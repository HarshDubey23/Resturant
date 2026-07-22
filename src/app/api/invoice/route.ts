import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Invoices } from "#utils/database/models/invoice";
import { Orders } from "#utils/database/models/order";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		await connectDB();

		const { searchParams } = new URL(req.url);
		const orderId = searchParams.get("orderId");
		const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
		const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
		const search = searchParams.get("search") || "";

		const restaurantID = session.restaurant?.username || session.username;

		if (orderId) {
			if (session.role === "admin") {
				const invoices = await Invoices.find({ restaurantID, order: orderId }).populate("order").sort({ generatedAt: -1 }).lean();
				if (!invoices || invoices.length === 0) throw { status: 404, message: "No invoices found for this order" };
				return NextResponse.json(invoices);
			}

			if (session.role === "customer") {
				const customerId = session.customer?._id;
				const order = await Orders.findOne({ _id: orderId, restaurantID, customer: customerId }).lean();
				if (!order) throw { status: 403, message: "Access denied" };
				const invoices = await Invoices.find({ order: orderId }).populate("order").lean();
				if (!invoices || invoices.length === 0) throw { status: 404, message: "No invoices found for this order" };
				return NextResponse.json(invoices);
			}

			throw { status: 403, message: "Access denied" };
		}

		if (session.role !== "admin") throw { status: 403, message: "Admin access required" };

		const skip = (page - 1) * limit;
		const query: Record<string, unknown> = { restaurantID };

		if (search) {
			query.$or = [
				{ invoiceNumber: { $regex: search, $options: "i" } },
				{ customerName: { $regex: search, $options: "i" } },
				{ customerPhone: { $regex: search, $options: "i" } },
			];
		}

		const [invoices, total] = await Promise.all([
			Invoices.find(query).sort({ generatedAt: -1 }).skip(skip).limit(limit).populate("order").lean(),
			Invoices.countDocuments(query),
		]);

		return NextResponse.json({
			invoices,
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		});
	} catch (err) {
		return CatchNextResponse(err);
	}
}
