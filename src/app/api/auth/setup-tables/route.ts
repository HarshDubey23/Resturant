import { getServerSession } from "next-auth";
import QRCode from "qrcode";

import connectDB from "#utils/database/connect";
import { invalidateRestaurantCache } from "#utils/database/helper/account";
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
                const { restaurantID, count, prefix } = await req.json();

                if (!restaurantID || !count || count < 1) {
                        return Response.json({ message: "Invalid request. Count must be at least 1." }, { status: 400 });
                }

                await connectDB();

                const account = await Accounts.findOne({ username: restaurantID });
                if (!account) {
                        return Response.json({ message: "Restaurant not found" }, { status: 404 });
                }

                const existingTables = await Tables.find({ restaurantID });
                // Idempotent: if tables already exist, return them instead of 409'ing.
                // This unbricks the wizard if a previous attempt failed mid-flow.
                const baseUrl = process.env.NEXT_PUBLIC_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

                if (existingTables.length > 0) {
                        const existingWithQr = await Promise.all(
                                existingTables.map(async (t) => {
                                        const tableUrl = `${baseUrl}/${restaurantID}?table=${t.username}`;
                                        const qr = await QRCode.toDataURL(tableUrl, { width: 200, margin: 1 });
                                        return { name: t.name, qr };
                                }),
                        );
                        await invalidateRestaurantCache(restaurantID);
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

                return Response.json({ tables: createdTables });
        } catch (error) {
                console.error("Setup tables error:", error);
                return Response.json({ message: "Something went wrong" }, { status: 500 });
        }
}
