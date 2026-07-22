import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Customers } from "#utils/database/models/customer";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) throw { status: 401, message: "Authentication Required" };

		const customerId = session.customer?._id;
		if (!customerId) throw { status: 403, message: "Customer access required" };

		const { whatsappOptIn } = await req.json();
		if (typeof whatsappOptIn !== "boolean") throw { status: 400, message: "whatsappOptIn must be a boolean" };

		await connectDB();
		await Customers.findByIdAndUpdate(customerId, { whatsappOptIn });

		return NextResponse.json({ status: 200, whatsappOptIn });
	} catch (err) {
		return CatchNextResponse(err);
	}
}
