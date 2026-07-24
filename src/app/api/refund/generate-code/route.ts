/** @file POST /api/refund/generate-code — Phase 3 negative-feedback refund flow.
 *    Requires auth + `payments.refund` permission (or admin/owner role override
 *    via the rbac table). Creates a single-use refund code, persists it on the
 *    feedback doc (`refundCode`, `refundAmount`, `refunded=false` until
 *    redeemed), appends a `refund` entry to the tamper-proof billAuditChain,
 *    and dispatches the `feedback.refund_code_generated` n8n event so n8n
 *    sends the WhatsApp message containing the code to the customer. Returns
 *    `{ refundCode, refundAmount }`. No console calls; all failures go through
 *    captureError + the standard `throw {status, message}` → CatchNextResponse
 *    pattern.
 * @phase 3
 * @audit-finding n/a
 */
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { triggerN8nWorkflow } from "#lib/n8n/client";
import connectDB from "#utils/database/connect";
import { Customers } from "#utils/database/models/customer";
import { Feedbacks } from "#utils/database/models/feedback";
import { Orders } from "#utils/database/models/order";
import { appendAuditChain } from "#utils/helper/auditChain";
import { CatchNextResponse } from "#utils/helper/common";
import { requirePermission } from "#utils/helper/rbac";
import { captureError } from "#utils/helper/sentryWrapper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GenerateCodeBody {
        orderId?: string;
        amount?: number;
        reason?: string;
}

interface SessionWithRestaurant {
        user?: { username?: string; role?: string; restaurant?: { username?: string } };
        username?: string;
        role?: string;
        restaurant?: { username?: string };
}

export async function POST(req: Request) {
        try {
                const session = (await requirePermission("payments.refund")) as SessionWithRestaurant;

                // authHelper populates both `session.user.*` and flat `session.*` at runtime;
                // prefer user.* then fall back to flat for the restaurant-scoped username.
                const username =
                        session.user?.username ??
                        session.user?.restaurant?.username ??
                        session.username ??
                        session.restaurant?.username ??
                        "";
                const role = session.user?.role ?? session.role ?? "";
                if (!username) throw { status: 400, message: "Restaurant username missing from session" };

                const body = (await req.json().catch(() => null)) as GenerateCodeBody | null;
                if (!body) throw { status: 400, message: "Invalid JSON body" };

                const { orderId, amount, reason } = body;
                if (!orderId) throw { status: 400, message: "orderId is required" };
                const refundAmount = Number(amount);
                if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
                        throw { status: 400, message: "amount must be a positive number" };
                }

                await connectDB();

                const order = await Orders.findById(orderId).lean();
                if (!order) throw { status: 404, message: "Order not found" };
                if (order.restaurantID !== username && role !== "admin") {
                        throw { status: 403, message: "Order belongs to a different restaurant" };
                }

                // Locate the feedback doc tied to this order. There may be no feedback
                // row yet (owner is pre-emptively refunding); in that case we create one
                // with a minimal payload so the refundCode has a home.
                const refundCode = `RFD-${randomUUID().slice(0, 8).toUpperCase()}`;
                const existingFeedback = await Feedbacks.findOne({ order: order._id, restaurantID: order.restaurantID });
                let customerPhone = "";
                if (existingFeedback) {
                        existingFeedback.refundCode = refundCode;
                        existingFeedback.refundAmount = refundAmount;
                        existingFeedback.refunded = false;
                        await existingFeedback.save();
                        customerPhone = existingFeedback.customerPhone ?? "";
                } else {
                        const created = await Feedbacks.create({
                                restaurantID: order.restaurantID,
                                order: order._id,
                                customer: order.customer ?? undefined,
                                orderId: order._id,
                                customerId: order.customer ?? undefined,
                                rating: 0,
                                refundCode,
                                refundAmount,
                                refunded: false,
                                comment: reason ?? "Owner-initiated refund code",
                        });
                        customerPhone = created.customerPhone ?? "";
                }

                // Resolve the customer's phone if not already on the feedback doc — fall
                // back to the order's customer ref → customers.phone.
                if (!customerPhone && order.customer) {
                        const customerDoc = await Customers.findById(order.customer).select("phone").lean();
                        customerPhone = customerDoc?.phone ?? "";
                }

                // Append to the tamper-proof audit chain BEFORE dispatching n8n. If the
                // dispatch fails, the audit entry still stands — the owner can redeem the
                // code manually and we have a permanent record of the issuance.
                try {
                        await appendAuditChain({
                                billId: String(order._id),
                                restaurantID: order.restaurantID,
                                actorRole: role || "owner",
                                actorId: String(order.customer ?? ""),
                                action: "refund",
                                payload: {
                                        orderId: String(order._id),
                                        refundCode,
                                        refundAmount,
                                        reason: reason ?? "negative_feedback",
                                        customerPhone,
                                },
                        });
                } catch (auditErr) {
                        captureError(auditErr, {
                                route: "/api/refund/generate-code",
                                context: "audit chain append failed",
                                orderId: String(order._id),
                        });
                }

                // Fire-and-forget the n8n dispatch — the WhatsApp send is best-effort
                // (the refund code is already persisted). The dispatcher is idempotent
                // (eventId dedup) so a retry is safe if the first attempt fails.
                triggerN8nWorkflow("feedback.refund_code_generated", {
                        customerPhone,
                        refundCode,
                        refundAmount,
                        restaurantID: order.restaurantID,
                }).catch((err: unknown) => {
                        captureError(err, {
                                route: "/api/refund/generate-code",
                                context: "n8n dispatch failed",
                                orderId: String(order._id),
                                refundCode,
                        });
                });

                return NextResponse.json({ refundCode, refundAmount });
        } catch (err) {
                return CatchNextResponse(err);
        }
}
