import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(accounts);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();

    // Stub: In production, this would initiate Revolut OAuth
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: body.name,
        institution: body.institution,
        last4: body.last4,
        type: body.type,
        revolutId: body.revolutId || null,
        balance: body.balance || 0,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create account" }, { status: 400 });
  }
}
