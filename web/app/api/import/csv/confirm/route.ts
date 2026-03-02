import { NextRequest, NextResponse } from "next/server";
import { requireHousehold } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Papa from "papaparse";

export async function POST(request: NextRequest) {
  try {
    const { user, householdId } = await requireHousehold();
    const body = await request.json();

    const { csvData, mapping, accountId } = body;
    // mapping = { date: "Date", merchant: "Description", amount: "Amount", category: "Category" }

    if (!csvData || !mapping?.date || !mapping?.merchant || !mapping?.amount) {
      return NextResponse.json({ error: "Missing required column mapping" }, { status: 400 });
    }

    const rows = Papa.parse(csvData, { header: true, skipEmptyLines: true }).data as Record<string, string>[];
    let created = 0;

    for (const row of rows) {
      const dateStr = row[mapping.date];
      const merchant = row[mapping.merchant];
      const amountStr = row[mapping.amount];
      const category = mapping.category ? row[mapping.category] : null;

      if (!dateStr || !merchant || !amountStr) continue;

      const amount = Math.abs(parseFloat(amountStr.replace(/[^0-9.\-]/g, "")) || 0);
      if (amount === 0) continue;

      const isCredit = amountStr.startsWith("+") || parseFloat(amountStr.replace(/[^0-9.\-]/g, "")) < 0;

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) continue;

      await prisma.transaction.create({
        data: {
          userId: user.id,
          householdId,
          accountId: accountId || null,
          merchant: merchant.trim(),
          amount,
          type: isCredit ? "credit" : "debit",
          category: category?.trim() || null,
          entity: "personal",
          date,
        },
      });
      created++;
    }

    return NextResponse.json({ imported: created });
  } catch {
    return NextResponse.json({ error: "Failed to import" }, { status: 500 });
  }
}
