import { getServerSession } from "next-auth";
import QRCode from "qrcode";

import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Tables } from "#utils/database/models/table";
import { authOptions } from "#utils/helper/authHelper";
import { rateLimitMiddleware } from "#utils/helper/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	const ip = req.headers.get("x-forwarded-for") ?? "unknown";
	const rateLimitResponse = await rateLimitMiddleware(`setup-tables:${ip}`, 10, 60000);
	if (rateLimitResponse) return rateLimitResponse;

	try {
		const session = await getServerSession(authOptions);
		if (!session || session.role !== "admin") {
			return Response.json({ message: "Unauthorized. Admin access required." }, { status: 401 });
		}
		const { restaurantID, count } = await req.json();

		if (!restaurantID || !count || count < 1) {
			return Response.json({ message: "Invalid request. Count must be at least 1." }, { status: 400 });
		}

		await connectDB();

		const account = await Accounts.findOne({ username: restaurantID });
		if (!account) {
			return Response.json({ message: "Restaurant not found" }, { status: 404 });
		}

		const existingTables = await Tables.find({ restaurantID });
		if (existingTables.length > 0) {
			return Response.json({ message: "Tables already exist for this restaurant" }, { status: 409 });
		}

		const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
		const createdTables = [];

		for (let i = 1; i <= count; i++) {
			const tableName = `T${i}`;
			await Tables.create({
				name: tableName,
				username: tableName,
				restaurantID,
			});

			const tableUrl = `${baseUrl}/${restaurantID}?table=${tableName}`;
			const qr = await QRCode.toDataURL(tableUrl, { width: 200, margin: 1 });

			createdTables.push({ name: tableName, qr });
		}

		return Response.json({ tables: createdTables });
	} catch (error) {
		console.error("Setup tables error:", error);
		return Response.json({ message: "Something went wrong" }, { status: 500 });
	}
}
