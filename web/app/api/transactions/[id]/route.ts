import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();

    const allowed = ["category", "entity", "note", "rationale", "receipt", "receiptUrl"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    const tx = await prisma.transaction.update({
      where: { id, userId: user.id },
      data,
    });

    return NextResponse.json(tx);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
