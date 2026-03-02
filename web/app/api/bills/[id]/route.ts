import { NextRequest, NextResponse } from "next/server";
import { requireHousehold } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, householdId } = await requireHousehold();
    const { id } = await params;
    const body = await request.json();

    const allowed = ["name", "amount", "dueDay", "dueMonth", "frequency", "vendor", "category", "entity", "accountId", "paidThisMonth", "active"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) {
        if (key === "amount") data[key] = parseFloat(body[key]);
        else if (key === "dueDay" || key === "dueMonth") data[key] = parseInt(body[key]);
        else data[key] = body[key];
      }
    }

    const bill = await prisma.bill.update({
      where: { id, householdId },
      data,
    });

    return NextResponse.json(bill);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, householdId } = await requireHousehold();
    const { id } = await params;

    // Unlink transactions from this bill
    await prisma.transaction.updateMany({
      where: { billId: id, householdId },
      data: { billId: null, isBill: false },
    });

    await prisma.bill.delete({
      where: { id, householdId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
