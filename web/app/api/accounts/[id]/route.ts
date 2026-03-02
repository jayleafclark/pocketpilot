import { NextRequest, NextResponse } from "next/server";
import { requireHousehold, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { householdId } = await requireRole("coadmin");
    const { id } = await params;

    // Soft delete — mark as disconnected
    const account = await prisma.account.update({
      where: { id, householdId },
      data: { status: "disconnected" },
    });

    return NextResponse.json(account);
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Viewer access is read-only" }, { status: 403 });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
