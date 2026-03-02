import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function POST() {
  try {
    await requireUser();
    // TODO Sprint 2: Trigger Revolut sync for specific account
    return NextResponse.json({ message: "Revolut sync will be available in Sprint 2" });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
