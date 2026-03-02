import { NextRequest, NextResponse } from "next/server";
import { requireHousehold, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { user, householdId } = await requireHousehold();
    const accounts = await prisma.account.findMany({
      where: { householdId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(accounts);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, householdId } = await requireRole("coadmin");
    const body = await request.json();

    // Stub: In production, this would initiate Revolut OAuth
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        householdId,
        name: body.name,
        institution: body.institution,
        last4: body.last4,
        type: body.type,
        revolutId: body.revolutId || null,
        balance: body.balance || 0,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Viewer access is read-only" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create account" }, { status: 400 });
  }
}
