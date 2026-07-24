/**
 * @file GET /api/cashier/shift/x-report — mid-shift X-report snapshot.
 * @phase 2
 * @audit-finding n/a
 *
 * Returns a real-time snapshot of the current open shift WITHOUT closing it.
 * Includes opening cash, sales by payment mode, voids, discounts, refunds,
 * KOT count, and tips. Used by the ShiftXReport UI component.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Orders } from "#utils/database/models/order";
import { Profiles } from "#utils/database/models/profile";
import { Shifts, type TShift } from "#utils/database/models/shift";
import { authOptions } from "#utils/helper/authHelper";
import { CatchNextResponse } from "#utils/helper/common";
import { captureError } from "#utils/helper/sentryWrapper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface XReportResponse {
        status: number;
        shift: TShift | null;
        metrics: {
                cashSales: number;
                upiSales: number;
                cardSales: number;
                totalSales: number;
                voids: { count: number; amount: number };
                discounts: { count: number; amount: number };
                refunds: { count: number; amount: number };
                kotCount: number;
                tips: number;
                expectedCash: number;
                tolerance: number;
        };
}

export async function GET(): Promise<NextResponse<XReportResponse>> {
        try {
                const session = await getServerSession(authOptions);
                if (!session) throw { status: 401, message: "Authentication required" };

                const restaurantID = (session.username as string) ?? "";
                if (!restaurantID) throw { status: 400, message: "Restaurant username missing from session" };

                await connectDB();

                const account = await Accounts.findOne({ username: restaurantID }).select("_id").lean();
                const profile = (await Profiles.findOne({ restaurantID }).lean()) as { settings?: { cashTolerance?: number } } | null;
                const tolerance = Number(profile?.settings?.cashTolerance ?? 0);
                if (!account) {
                        return NextResponse.json<XReportResponse>({
                                status: 200,
                                shift: null,
                                metrics: {
                                        cashSales: 0,
                                        upiSales: 0,
                                        cardSales: 0,
                                        totalSales: 0,
                                        voids: { count: 0, amount: 0 },
                                        discounts: { count: 0, amount: 0 },
                                        refunds: { count: 0, amount: 0 },
                                        kotCount: 0,
                                        tips: 0,
                                        expectedCash: 0,
                                        tolerance,
                                },
                        });
                }

                const shift = await Shifts.findOne<TShift>({ restaurantID, cashierId: account._id, status: "open" }).lean();
                if (!shift) {
                        return NextResponse.json<XReportResponse>({
                                status: 200,
                                shift: null,
                                metrics: {
                                        cashSales: 0,
                                        upiSales: 0,
                                        cardSales: 0,
                                        totalSales: 0,
                                        voids: { count: 0, amount: 0 },
                                        discounts: { count: 0, amount: 0 },
                                        refunds: { count: 0, amount: 0 },
                                        kotCount: 0,
                                        tips: 0,
                                        expectedCash: 0,
                                        tolerance,
                                },
                        });
                }

                const orders = await Orders.find({ restaurantID, createdAt: { $gte: shift.openedAt } }).lean();

                const acc = orders.reduce(
                        (a, o) => {
                                const order = o as unknown as {
                                        paymentGateway?: string;
                                        state?: string;
                                        orderTotal?: number;
                                        taxTotal?: number;
                                        discountAmount?: number;
                                        refundedAmount?: number;
                                        products?: Array<{ adminApproved?: boolean }>;
                                };
                                const total = Number(order.orderTotal ?? 0) + Number(order.taxTotal ?? 0) - Number(order.discountAmount ?? 0);
                                if (order.state === "cancel") {
                                        a.voids.count += 1;
                                        a.voids.amount += total;
                                        return a;
                                }
                                if (order.paymentGateway === "cash") a.cashSales += total;
                                else if (order.paymentGateway === "razorpay") a.upiSales += total;
                                else if (order.paymentGateway === "stripe") a.cardSales += total;
                                if (order.discountAmount && order.discountAmount > 0) {
                                        a.discounts.count += 1;
                                        a.discounts.amount += Number(order.discountAmount);
                                }
                                if (order.refundedAmount && order.refundedAmount > 0) {
                                        a.refunds.count += 1;
                                        a.refunds.amount += Number(order.refundedAmount);
                                }
                                if (order.products?.some((p) => p.adminApproved)) a.kotCount += 1;
                                return a;
                        },
                        {
                                cashSales: 0,
                                upiSales: 0,
                                cardSales: 0,
                                voids: { count: 0, amount: 0 },
                                discounts: { count: 0, amount: 0 },
                                refunds: { count: 0, amount: 0 },
                                kotCount: 0,
                                tips: 0,
                        },
                );

                const expectedCash = Number(shift.openingCash) + acc.cashSales;

                return NextResponse.json<XReportResponse>({
                        status: 200,
                        shift,
                        metrics: {
                                cashSales: acc.cashSales,
                                upiSales: acc.upiSales,
                                cardSales: acc.cardSales,
                                totalSales: acc.cashSales + acc.upiSales + acc.cardSales,
                                voids: acc.voids,
                                discounts: acc.discounts,
                                refunds: acc.refunds,
                                kotCount: acc.kotCount,
                                tips: acc.tips,
                                expectedCash,
                                tolerance,
                        },
                });
        } catch (err) {
                captureError(err, { route: "/api/cashier/shift/x-report" });
                return CatchNextResponse(err);
        }
}
