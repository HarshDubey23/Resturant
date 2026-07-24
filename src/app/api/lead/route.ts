import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_LEADS_PER_HOUR = 5;
const ONE_HOUR_MS = 60 * 60 * 1000;

type LeadCartItem = {
        name?: unknown;
        qty?: unknown;
        price?: unknown;
};

type LeadBody = {
        name?: unknown;
        email?: unknown;
        phone?: unknown;
        restaurantName?: unknown;
        cartItems?: unknown;
        total?: unknown;
        source?: unknown;
};

function isString(value: unknown): value is string {
        return typeof value === "string";
}

function isNumber(value: unknown): value is number {
        return typeof value === "number" && Number.isFinite(value);
}

export async function POST(req: NextRequest) {
        try {
                const body = (await req.json().catch(() => null)) as LeadBody | null;
                if (!body) {
                        return NextResponse.json(
                                { ok: false, error: "Invalid JSON body" },
                                { status: 400 },
                        );
                }

                const name = isString(body.name) ? body.name.trim() : "";
                const email = isString(body.email) ? body.email.trim().toLowerCase() : "";
                const phone = isString(body.phone) ? body.phone.trim() : "";
                const restaurantName = isString(body.restaurantName)
                        ? body.restaurantName.trim()
                        : "";
                const total = isNumber(body.total) ? body.total : 0;
                const source = isString(body.source) && body.source.trim()
                        ? body.source.trim()
                        : "cart_checkout";

                // Validate required fields
                if (!name) {
                        return NextResponse.json(
                                { ok: false, error: "Name is required" },
                                { status: 400 },
                        );
                }
                if (!email) {
                        return NextResponse.json(
                                { ok: false, error: "Email is required" },
                                { status: 400 },
                        );
                }
                if (!EMAIL_REGEX.test(email)) {
                        return NextResponse.json(
                                { ok: false, error: "Please enter a valid email address" },
                                { status: 400 },
                        );
                }
                if (!phone) {
                        return NextResponse.json(
                                { ok: false, error: "Phone number is required" },
                                { status: 400 },
                        );
                }

                // Normalize cart items
                let cartItemsRaw: LeadCartItem[] = [];
                if (Array.isArray(body.cartItems)) {
                        cartItemsRaw = body.cartItems.filter(
                                (item): item is LeadCartItem =>
                                        item !== null && typeof item === "object",
                        );
                }
                const cartItems = cartItemsRaw.map((item) => ({
                        name: isString(item.name) ? item.name : "",
                        qty: isNumber(item.qty) && item.qty > 0 ? Math.floor(item.qty) : 1,
                        price: isNumber(item.price) && item.price >= 0 ? item.price : 0,
                }));

                // Rate limit: max 5 leads per email per hour
                const oneHourAgo = new Date(Date.now() - ONE_HOUR_MS);
                const recentLeads = await db.leadCapture.count({
                        where: {
                                email,
                                createdAt: { gte: oneHourAgo },
                        },
                });
                if (recentLeads >= MAX_LEADS_PER_HOUR) {
                        return NextResponse.json(
                                {
                                        ok: false,
                                        error:
                                                "Too many submissions from this email. Please try again later.",
                                },
                                { status: 429 },
                        );
                }

                const lead = await db.leadCapture.create({
                        data: {
                                name,
                                email,
                                phone,
                                restaurantName: restaurantName || null,
                                cartItems: JSON.stringify(cartItems),
                                total,
                                source,
                        },
                        select: { id: true },
                });

                return NextResponse.json({ ok: true, id: lead.id });
        } catch (error) {
                console.error("Lead capture error:", error);
                return NextResponse.json(
                        { ok: false, error: "Failed to capture lead. Please try again." },
                        { status: 500 },
                );
        }
}
