import { NextResponse } from "next/server";
import { requireHousehold } from "@/lib/auth";
import { computeBudget } from "@/lib/budget";

export async function GET() {
  try {
    const { user, householdId } = await requireHousehold();
    const budget = await computeBudget(householdId);
    return NextResponse.json(budget);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
