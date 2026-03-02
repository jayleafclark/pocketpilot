import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { computeBudget } from "@/lib/budget";

export async function GET() {
  try {
    const user = await requireUser();
    const budget = await computeBudget(user.id);
    return NextResponse.json(budget);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
