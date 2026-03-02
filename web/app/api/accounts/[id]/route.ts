import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    // Soft delete — mark as disconnected
    const account = await prisma.account.update({
      where: { id, userId: user.id },
      data: { status: "disconnected" },
    });

    return NextResponse.json(account);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
