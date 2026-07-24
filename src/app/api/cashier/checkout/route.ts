/**
 * @file POST /api/cashier/checkout — create an order from the cashier screen.
 * @phase 2
 * @audit-finding n/a
 *
 * The CashierBilling UI builds a bill in component state. When the cashier
 * tenders (cash / UPI), this endpoint materialises that bill as a real
 * `orders` document with `paymentGateway: 'cash'` (default) and the products
 * attached, then generates an invoice. Returns `{ orderId, invoiceNumber }`
 * so the cashier can immediately call `/api/print/kot` and `/api/print/bill`.
 *
 * This is a cashier-only route — it does NOT award loyalty, deduct inventory
 * (the cashier flow assumes tableside inventory control), or send WhatsApp
 * confirmations. Those concerns stay on `/api/order/place` for customer-led
 * orders. The cashier flow is explicit and synchronous.
 */

import { NextResponse } from "next/server";

import { sendEmail } from "#utils/email";
import connectDB from "#utils/database/connect";
import { Invoices } from "#utils/database/models/invoice";
import { Menus } from "#utils/database/models/menu";
import { Orders, type TProduct } from "#utils/database/models/order";
import { appendAuditChain } from "#utils/helper/auditChain";
import { CatchNextResponse } from "#utils/helper/common";
import { generateInvoiceNumber } from "#utils/helper/invoiceHelper";
import { captureError } from "#utils/helper/sentryWrapper";
import { withPermission } from "#utils/helper/rbac";
import { sendWhatsAppText } from "#utils/whatsapp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface CheckoutItem {
        menuId: string;
        qty: number;
        modifiers?: string[];
}

interface CheckoutBody {
        table: string;
        items: CheckoutItem[];
        paymentMode: "cash" | "upi" | "card";
        discount?: number;
        tip?: number;
        customerName?: string;
        customerPhone?: string;
        /** Optional receipt dispatch — reuses existing email/WhatsApp helpers. */
        sendReceipt?: {
                email?: string;
                whatsapp?: string;
        };
}

export const POST = withPermission("orders.write", async (req, session) => {
        try {
                const body = (await req.json()) as CheckoutBody;
                if (!Array.isArray(body?.items) || body.items.length === 0) throw { status: 400, message: "items[] is required" };
                if (!body?.table) throw { status: 400, message: "table is required" };

                const restaurantID = (session.username as string) ?? "";
                if (!restaurantID) throw { status: 400, message: "Restaurant username missing from session" };

                await connectDB();

                const menuIds = body.items.map((i) => i.menuId);
                const menuDocs = await Menus.find({ _id: { $in: menuIds }, restaurantID }).lean();
                const menuById = new Map(menuDocs.map((m) => [String(m._id), m]));

                const products: TProduct[] = [];
                for (const item of body.items) {
                        const menu = menuById.get(item.menuId);
                        if (!menu) throw { status: 404, message: `Menu item ${item.menuId} not found` };
                        const rawTax = (Number(menu.price) * Number(menu.taxPercent)) / 100;
                        products.push({
                                product: menu._id,
                                quantity: Number(item.qty) || 1,
                                price: Number(menu.price),
                                tax: Number(rawTax.toFixed(2)),
                                station: (menu as { station?: string }).station ?? "main",
                        } as unknown as TProduct);
                }

                const subtotal = products.reduce((s, p) => s + p.price * p.quantity, 0);
                const taxTotal = products.reduce((s, p) => s + p.tax * p.quantity, 0);
                const discount = Number(body.discount ?? 0);
                const grandTotal = Math.max(0, subtotal + taxTotal - discount + Number(body.tip ?? 0));

                const order = await Orders.create({
                        restaurantID,
                        table: body.table,
                        paymentGateway: body.paymentMode === "upi" ? "razorpay" : body.paymentMode === "card" ? "stripe" : "cash",
                        state: "complete",
                        paymentStatus: "paid",
                        products,
                        discountAmount: discount,
                        orderTotal: subtotal,
                        taxTotal,
                        cartSnapshot: {
                                items: products.map((p) => ({
                                        name: menuById.get(String((p as unknown as { product: { toString(): string } }).product))?.name ?? "Item",
                                        price: p.price,
                                        tax: p.tax,
                                        quantity: p.quantity,
                                        veg: menuById.get(String((p as unknown as { product: { toString(): string } }).product))?.veg ?? "veg",
                                })),
                                subtotal,
                                taxTotal,
                                grandTotal,
                        },
                });

                const invoiceNumber = await generateInvoiceNumber(restaurantID);
                const invoice = await Invoices.create({
                        restaurantID,
                        order: order._id,
                        invoiceNumber,
                        customerName: body.customerName,
                        customerPhone: body.customerPhone,
                        items: products.map((p) => {
                                const menu = menuById.get(String((p as unknown as { product: { toString(): string } }).product));
                                return {
                                        name: menu?.name ?? "Item",
                                        quantity: p.quantity,
                                        price: p.price,
                                        taxPercent: Number(menu?.taxPercent ?? 0),
                                        taxAmount: p.tax,
                                        total: p.price * p.quantity,
                                };
                        }),
                        subtotal,
                        cgst: taxTotal / 2,
                        sgst: taxTotal / 2,
                        igst: 0,
                        grandTotal,
                        paymentMethod: body.paymentMode,
                });
                order.invoiceNumber = invoiceNumber;
                await order.save();

                try {
                        await appendAuditChain({
                                restaurantID,
                                actorRole: (session.role as string) ?? "admin",
                                actorId: (session.username as string) ?? restaurantID,
                                action: "create",
                                billId: String(order._id),
                                payload: {
                                        kind: "cashier_checkout",
                                        orderId: String(order._id),
                                        invoiceNumber,
                                        table: body.table,
                                        paymentMode: body.paymentMode,
                                        grandTotal,
                                },
                        });
                } catch (auditErr) {
                        captureError(auditErr, { route: "/api/cashier/checkout", context: "audit chain append failed" });
                }

                // Optional receipt dispatch — fire-and-forget so the cashier is unblocked.
                const receipt = body.sendReceipt ?? {};
                if (receipt.whatsapp) {
                        const msg = `Bill ${invoiceNumber} — Total: ₹${grandTotal.toFixed(2)}. Thank you for dining with us!`;
                        sendWhatsAppText(receipt.whatsapp, msg).catch((e: unknown) => captureError(e, { route: "/api/cashier/checkout", context: "whatsapp receipt" }));
                }
                if (receipt.email) {
                        sendEmail({
                                to: receipt.email,
                                template: "payment-receipt",
                                params: {
                                        restaurantName: restaurantID,
                                        orderId: invoiceNumber,
                                        items: products.map((p) => {
                                                const menu = menuById.get(String((p as unknown as { product: { toString(): string } }).product));
                                                return { name: menu?.name ?? "Item", qty: p.quantity, price: p.price };
                                        }),
                                        subtotal,
                                        gstAmount: taxTotal,
                                        total: grandTotal,
                                        currency: "INR",
                                        customerName: body.customerName ?? "Guest",
                                },
                        }).catch((e: unknown) => captureError(e, { route: "/api/cashier/checkout", context: "email receipt" }));
                }

                return NextResponse.json({ status: 200, orderId: String(order._id), invoiceNumber, grandTotal });
        } catch (err) {
                captureError(err, { route: "/api/cashier/checkout" });
                return CatchNextResponse(err);
        }
});
