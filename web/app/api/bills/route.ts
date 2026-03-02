import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    const bills = await prisma.bill.findMany({
      where: { userId: user.id },
      orderBy: { dueDay: "asc" },
    });
    return NextResponse.json(bills);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const bill = await prisma.bill.create({
      data: {
        userId: user.id,
        name: body.name,
        amount: parseFloat(body.amount),
        dueDay: parseInt(body.dueDay),
        dueMonth: body.dueMonth ? parseInt(body.dueMonth) : null,
        frequency: body.frequency || "monthly",
        vendor: body.vendor || null,
        category: body.category || null,
        entity: body.entity || "personal",
        accountId: body.accountId || null,
      },
    });

    return NextResponse.json(bill, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create bill" }, { status: 400 });
  }
}
