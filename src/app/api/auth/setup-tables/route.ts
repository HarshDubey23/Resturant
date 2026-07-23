import { getServerSession } from "next-auth";
import QRCode from "qrcode";

import connectDB from "#utils/database/connect";
import { invalidateRestaurantCache } from "#utils/database/helper/account";
import { Accounts } from "#utils/database/models/account";
import { Tables } from "#utils/database/models/table";
import { recordAudit } from "#utils/helper/audit";
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
		// SECURITY: restaurantID MUST come from the session, not the request body.
		// Previously this accepted restaurantID from the body, allowing cross-tenant table creation.
		const restaurantID = session.username as string;
		const { count, prefix } = await req.json();

		if (!count || count < 1) {
			return Response.json({ message: "Invalid request. Count must be at least 1." }, { status: 400 });
		}

		await connectDB();

		const account = await Accounts.findOne({ username: restaurantID });
		if (!account) {
			return Response.json({ message: "Restaurant not found" }, { status: 404 });
		}

		const existingTables = await Tables.find({ restaurantID });

		// ── Plan enforcement: check table limit ──
		if (existingTables.length + count > account.maxTables) {
			return Response.json(
				{
					status: 402,
					message: `You've reached the ${account.maxTables}-table limit. Upgrade to add more tables.`,
					upgradeUrl: "/dashboard?tab=settings&subTab=billing",
				},
				{ status: 402 },
			);
		}

		// Idempotent: if tables already exist, return them instead of 409'ing.
		// This unbricks the wizard if a previous attempt failed mid-flow.
		// SECURITY: never fallback to localhost in production — QR codes must point to the public URL.
		const baseUrl = process.env.NEXT_PUBLIC_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
		if (!baseUrl) {
			return Response.json({ message: "NEXT_PUBLIC_URL is not configured. QR codes require a public base URL." }, { status: 500 });
		}

		if (existingTables.length > 0) {
			const existingWithQr = await Promise.all(
				existingTables.map(async (t) => {
					const tableUrl = `${baseUrl}/${restaurantID}?table=${t.username}`;
					const qr = await QRCode.toDataURL(tableUrl, { width: 200, margin: 1 });
					return { name: t.name, qr };
				}),
			);
			await invalidateRestaurantCache(restaurantID);

			await recordAudit({
				restaurantID,
				session: { username: session.username as string, role: session.role },
				action: "tables_setup",
				targetType: "table",
				ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
				userAgent: req.headers.get("user-agent") ?? undefined,
			});

			return Response.json({ tables: existingWithQr, reused: true });
		}

		const createdTables = [];

		for (let i = 1; i <= count; i++) {
			const tableName = `${prefix || "T"}${i}`;
			await Tables.create({
				name: tableName,
				username: tableName,
				restaurantID,
			});

			const tableUrl = `${baseUrl}/${restaurantID}?table=${tableName}`;
			const qr = await QRCode.toDataURL(tableUrl, { width: 200, margin: 1 });

			createdTables.push({ name: tableName, qr });
		}

		await invalidateRestaurantCache(restaurantID);

		await recordAudit({
			restaurantID,
			session: { username: session.username as string, role: session.role },
			action: "tables_setup",
			targetType: "table",
			metadata: { count, prefix },
			ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
			userAgent: req.headers.get("user-agent") ?? undefined,
		});

		return Response.json({ tables: createdTables });
	} catch (error) {
		console.error("Setup tables error:", error);
		return Response.json({ message: "Something went wrong" }, { status: 500 });
	}
}
