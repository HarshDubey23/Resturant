/** @file Internal active-restaurants endpoint. Protected by N8N_WEBHOOK_SECRET.
 *    Returns the list of active restaurant IDs + owner phones for the 11PM
 *    cron. `ownerPhone` is derived from `profile.phone` when not present on
 *    the account directly (the Account model has no `ownerPhone` field — the
 *    phone lives on the Profile model).
 *
 *    Auth accepts EITHER (a) `X-N8N-Signature` = HMAC-SHA256(timestamp, secret)
 *    — the original 2-C scheme, OR (b) `X-N8N-Secret` = the raw secret compared
 *    in constant time — the Phase 3 n8n workflow scheme (simpler for n8n HTTP
 *    nodes that can't easily compute HMAC). Both paths use timingSafeEqual.
 * @phase 2
 * @audit-finding n/a
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import connectDB from "#utils/database/connect";
import { Accounts } from "#utils/database/models/account";
import { Profiles } from "#utils/database/models/profile";
import { captureError } from "#utils/helper/sentryWrapper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyHmac(rawBody: string, signature: string, secret: string): boolean {
        if (!signature || !secret) return false;
        const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (a.length !== b.length) return false;
        return timingSafeEqual(a, b);
}

function verifyRawSecret(headerValue: string, secret: string): boolean {
        if (!headerValue || !secret) return false;
        const a = Buffer.from(headerValue);
        const b = Buffer.from(secret);
        if (a.length !== b.length) return false;
        return timingSafeEqual(a, b);
}

export async function GET(req: Request) {
        const secret = process.env.N8N_WEBHOOK_SECRET ?? "";
        if (!secret) {
                return NextResponse.json({ error: "missing_secret" }, { status: 500 });
        }

        // GET request has no body to HMAC — we instead HMAC the empty string with
        // the timestamp header so the secret is still required. This is the same
        // pattern Slack uses for signed GET webhooks.
        const timestamp = req.headers.get("x-n8n-timestamp") ?? "";
        const signature = req.headers.get("x-n8n-signature") ?? "";
        const rawSecret = req.headers.get("x-n8n-secret") ?? "";

        const hmacOk = verifyHmac(timestamp, signature, secret);
        const rawOk = verifyRawSecret(rawSecret, secret);
        if (!hmacOk && !rawOk) {
                captureError(new Error("Invalid auth on /api/internal/restaurants/active"), {
                        route: "internal/restaurants/active",
                });
                return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
        }

        await connectDB();

        const accounts = await Accounts.find(
                { accountActive: true, subscriptionActive: true },
                { username: 1, profile: 1, email: 1 },
        )
                .populate({ path: "profile", select: "phone" })
                .lean();

        const restaurants = accounts.map((a) => ({
                restaurantID: a.username,
                email: a.email,
                // @reason: Account has no ownerPhone field; we derive from profile.phone.
                ownerPhone: (a.profile as { phone?: string } | null)?.phone ?? "",
        }));

        return NextResponse.json({ count: restaurants.length, restaurants });
}
