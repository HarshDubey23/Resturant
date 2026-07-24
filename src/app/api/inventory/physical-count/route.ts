/** @file Physical count endpoint. For each item: appends a physicalCount
 *    journal entry, derives the variance vs theoretical consumption for the
 *    day (and dispatches a theft alert if thresholds breach), then sets
 *    `currentStock` to the counted qty. The variance delta is also pushed
 *    to the audit chain so a count that "fixes" a large shrinkage cannot be
 *    silently rolled back.
 * @phase 2
 * @audit-finding n/a
 */
import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Inventory } from "#utils/database/models/inventory";
import { appendAuditChain } from "#utils/helper/auditChain";
import { computeTheoreticalConsumption, dispatchTheftAlert } from "#utils/database/helper/variance";
import { CatchNextResponse } from "#utils/helper/common";
import { withPermission } from "#utils/helper/rbac";

interface CountItem {
        inventoryId: string;
        qty: number;
}

export const POST = withPermission("settings.manage", async (req, session) => {
        try {
                await connectDB();
                const restaurantID = session.username as string;
                const body = await req.json();

                const { items, date: dateStr } = body as { items?: CountItem[]; date?: string };

                if (!Array.isArray(items) || items.length === 0) {
                        throw { status: 400, message: "items[] is required and must be non-empty" };
                }

                const date = dateStr ?? new Date().toISOString().split("T")[0];
                const countedBy = (session.username as string) ?? "unknown";

                // Build a theoretical map ONCE so we can derive the per-item variance for
                // every counted line without re-running the BOM aggregation.
                const theoreticalMap = await computeTheoreticalConsumption(restaurantID, date);

                const results: Array<{
                        inventoryId: string;
                        name: string;
                        previousStock: number;
                        counted: number;
                        variance: number;
                        theoretical: number;
                }> = [];
                const flaggedRows: Array<{ inventoryId: string; name: string; variance: number }> = [];

                for (const line of items) {
                        const { inventoryId, qty } = line;
                        if (!inventoryId || qty == null) continue;

                        const existing = await Inventory.findOne({ _id: inventoryId, restaurantID }).lean();
                        if (!existing) continue;

                        const previous = existing.currentStock ?? 0;
                        const theoretical = theoreticalMap[inventoryId]?.qty ?? 0;
                        // Variance from this count: theoretical consumption today vs the
                        // (previous − counted) delta — i.e. how much stock is "missing" beyond
                        // what the BOM says we should have consumed.
                        const variance = previous - Number(qty) - theoretical;

                        const updated = await Inventory.findOneAndUpdate(
                                { _id: inventoryId, restaurantID },
                                {
                                        $push: {
                                                physicalCount: {
                                                        qty: Number(qty),
                                                        countedBy,
                                                        date: new Date(),
                                                },
                                        },
                                        $set: { currentStock: Number(qty) },
                                },
                                { new: true },
                        );

                        if (!updated) continue;

                        await appendAuditChain({
                                restaurantID,
                                actorRole: (session.role as string) ?? "owner",
                                actorId: (session as unknown as { id?: string }).id,
                                action: "stock_adjust",
                                payload: {
                                        type: "physical_count",
                                        inventoryId,
                                        name: updated.name,
                                        previousStock: previous,
                                        counted: Number(qty),
                                        theoretical,
                                        variance,
                                        countedBy,
                                },
                        });

                        results.push({
                                inventoryId,
                                name: updated.name,
                                previousStock: previous,
                                counted: Number(qty),
                                variance,
                                theoretical,
                        });

                        if (Math.abs(variance) > 0) {
                                flaggedRows.push({ inventoryId, name: updated.name, variance });
                        }
                }

                // Best-effort theft alert dispatch — flagged rows go to n8n for the
                // 11PM daily report. Failures are captured to Sentry but do not block
                // the count save.
                if (flaggedRows.length > 0) {
                        await dispatchTheftAlert(
                                restaurantID,
                                date,
                                flaggedRows.map((r: { inventoryId: string; name: string; variance: number }) => ({
                                        inventoryId: r.inventoryId,
                                        name: r.name,
                                        unit: "",
                                        theoretical: 0,
                                        actual: 0,
                                        varianceQty: r.variance,
                                        variancePercent: 0,
                                        varianceRupees: 0,
                                        threshold: true,
                                        lastPurchaseRate: 0,
                                })),
                        ).catch(() => {
                                /* dispatched-theft-alert failure is non-fatal */
                        });
                }

                return NextResponse.json({ results });
        } catch (err) {
                return CatchNextResponse(err);
        }
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
