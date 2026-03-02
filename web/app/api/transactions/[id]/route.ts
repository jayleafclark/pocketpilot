import { NextRequest, NextResponse } from "next/server";
import { requireHousehold, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, householdId } = await requireRole("coadmin");
    const { id } = await params;
    const body = await request.json();

    const allowed = ["category", "entity", "note", "rationale", "receipt", "receiptUrl"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    const tx = await prisma.transaction.update({
      where: { id, householdId },
      data,
    });

    return NextResponse.json(tx);
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Viewer access is read-only" }, { status: 403 });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
