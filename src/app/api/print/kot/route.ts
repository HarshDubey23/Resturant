/**
 * @file POST /api/print/kot — emit ESC/POS KOT bytes for an order.
 * @phase 2
 * @audit-finding n/a
 *
 * Requires auth + `kds.action` permission. Builds the KOT via `buildKot`,
 * appends the next `kotSerial` to the billAuditChain, and returns the raw
 * ESC/POS payload as `application/octet-stream`. The caller (LAN print agent
 * or WebUSB client) consumes the bytes — this route never touches the printer
 * directly so it stays testable and printer-agnostic.
 *
 * If `station` is provided in the body, only items whose `station` matches
 * are emitted (one KOT per station); otherwise all approved items are
 * printed as a single KOT.
 */

import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Orders } from "#utils/database/models/order";
import { appendAuditChain } from "#utils/helper/auditChain";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";
import { withPermission } from "#utils/helper/rbac";
import { buildKot, type KotItem } from "#utils/print/kot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PrintKotBody {
        orderId: string;
        station?: string;
        width?: 58 | 80;
}

async function handle(req: Request, session: { username?: string; email?: string; role?: string }) {
        const body = (await req.json()) as PrintKotBody;
        if (!body?.orderId) throw { status: 400, message: "orderId is required" };

        const restaurantID = (session.username as string) ?? "";
        if (!restaurantID) throw { status: 400, message: "Restaurant username missing from session" };

        await connectDB();

        const order = await Orders.findOne({ _id: body.orderId, restaurantID }).populate("products.product").lean();
        if (!order) throw { status: 404, message: "Order not found" };

        const orderDoc = order as unknown as {
                _id: { toString(): string };
                table: string;
                products: Array<{
                        name?: string;
                        product?: { name?: string; station?: string };
                        quantity?: number;
                        adminApproved?: boolean;
                        station?: string;
                }>;
                createdAt: Date;
        };

        const allItems: KotItem[] = orderDoc.products
                .filter((p) => p.adminApproved !== false)
                .map((p) => ({
                        name: String(p.name ?? p.product?.name ?? "Item"),
                        qty: Number(p.quantity ?? 1),
                        station: String(p.station ?? p.product?.station ?? "main"),
                }));

        const items = body.station ? allItems.filter((i) => i.station === body.station) : allItems;
        if (items.length === 0) throw { status: 400, message: "No KOT items for the given station" };

        let kotSerial = "0000";
        try {
                const entry = await appendAuditChain({
                        restaurantID,
                        actorRole: (session.role as string) ?? "admin",
                        actorId: (session.username as string) ?? restaurantID,
                        action: "create",
                        billId: orderDoc._id.toString(),
                        payload: {
                                kind: "kot_print",
                                orderId: orderDoc._id.toString(),
                                station: body.station ?? "all",
                                itemCount: items.length,
                        },
                });
                kotSerial = String(entry.sequenceNo).padStart(4, "0");
        } catch (auditErr) {
                captureError(auditErr, { route: "/api/print/kot", context: "audit chain append failed" });
        }

        const buffer = buildKot({
                restaurantName: restaurantID.toUpperCase(),
                table: String(orderDoc.table ?? "—"),
                orderNumber: `#${orderDoc._id.toString().slice(-6).toUpperCase()}`,
                timestamp: new Date(orderDoc.createdAt ?? Date.now()).toISOString(),
                steward: (session.email as string) ?? restaurantID,
                items,
                kotSerial,
                width: body.width ?? 80,
        });

        return new NextResponse(new Uint8Array(buffer), {
                status: 200,
                headers: {
                        "Content-Type": "application/octet-stream",
                        "Content-Length": String(buffer.length),
                        "X-KOT-Serial": kotSerial,
                        "Cache-Control": "no-store",
                },
        });
}

export const POST = withPermission("kds.action", async (req, session) => {
        try {
                return await handle(req, session);
        } catch (err) {
                captureError(err, { route: "/api/print/kot" });
                return CatchNextResponse(err);
        }
});
