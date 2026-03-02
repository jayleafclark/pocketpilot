import { NextRequest, NextResponse } from "next/server";
import { requireHousehold } from "@/lib/auth";
import { plaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { user, householdId } = await requireHousehold();
    const { accountId } = await request.json();

    // Find the account (must belong to this household and have a Plaid connection)
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        householdId,
        plaidAccessToken: { not: null },
      },
    });

    if (!account || !account.plaidAccessToken) {
      return NextResponse.json(
        { error: "Account not found or not connected via Plaid" },
        { status: 404 }
      );
    }

    // Fetch transactions from Plaid using transactionsSync
    const syncResponse = await plaidClient.transactionsSync({
      access_token: account.plaidAccessToken,
    });

    const transactions = syncResponse.data.added;

    // Upsert each transaction
    let count = 0;
    for (const tx of transactions) {
      await prisma.transaction.upsert({
        where: { plaidTxId: tx.transaction_id },
        update: {
          amount: Math.abs(tx.amount),
          merchant: tx.merchant_name || tx.name,
          category: tx.personal_finance_category?.primary || null,
        },
        create: {
          userId: user.id,
          householdId,
          accountId: account.id,
          plaidTxId: tx.transaction_id,
          merchant: tx.merchant_name || tx.name,
          amount: Math.abs(tx.amount),
          type: tx.amount > 0 ? "debit" : "credit",
          category: tx.personal_finance_category?.primary || null,
          entity: "personal",
          date: new Date(tx.date),
        },
      });
      count++;
    }

    // Update the account's lastSynced timestamp
    await prisma.account.update({
      where: { id: account.id },
      data: { lastSynced: new Date() },
    });

    return NextResponse.json({ synced: count });
  } catch (error) {
    console.error("Failed to sync transactions:", error);
    return NextResponse.json(
      { error: "Failed to sync transactions" },
      { status: 500 }
    );
  }
}
