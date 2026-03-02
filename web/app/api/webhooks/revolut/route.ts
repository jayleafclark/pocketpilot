import { NextRequest, NextResponse } from "next/server";

// Public endpoint — no auth required (Revolut sends webhooks here)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO Sprint 2: Handle Revolut webhook for real-time transactions
    console.log("Revolut webhook received:", body.event);
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
