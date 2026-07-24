import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    // Landing page demo: return a placeholder profile name
    // In production, this would query the real user database
    const name = email.split("@")[0]?.replace(/[._-]/g, " ") || email;
    return NextResponse.json({ name, email });
  } catch (error) {
    console.error("Profile preview error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
