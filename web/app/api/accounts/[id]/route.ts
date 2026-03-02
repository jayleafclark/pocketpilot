import { NextRequest, NextResponse } from "next/server";
import { requireHousehold } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { householdId } = await requireHousehold();
    const { id } = await params;

    // Soft delete — mark as disconnected
    const account = await prisma.account.update({
      where: { id, householdId },
      data: { status: "disconnected" },
    });

    return NextResponse.json(account);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
