import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function POST() {
  try {
    await requireUser();
    return NextResponse.json({ rationale: "Rationale generation coming in Sprint 2." });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
