import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s+()-]{7,15}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const date = typeof body.date === "string" ? body.date.trim() : "";
    const time = typeof body.time === "string" ? body.time.trim() : "";
    const guests = typeof body.guests === "string" ? parseInt(body.guests, 10) : (typeof body.guests === "number" ? body.guests : 2);
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!email || !EMAIL_REGEX.test(email)) return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    if (!phone || !PHONE_REGEX.test(phone)) return NextResponse.json({ error: "Valid phone is required" }, { status: 400 });
    if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });
    if (!time) return NextResponse.json({ error: "Time is required" }, { status: 400 });
    if (guests < 1 || guests > 20) return NextResponse.json({ error: "Guests must be 1-20" }, { status: 400 });

    const reservation = await db.reservation.create({
      data: { name, email, phone, date, time, guests, message, status: "confirmed" },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: reservation.id });
  } catch (error) {
    console.error("Reservation error:", error);
    return NextResponse.json({ error: "Failed to make reservation" }, { status: 500 });
  }
}
