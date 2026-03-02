import { NextRequest, NextResponse } from "next/server";
import { requireHousehold } from "@/lib/auth";
import { plaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { user, householdId } = await requireHousehold();
    const { public_token, metadata } = await request.json();

    // Exchange the public token for an access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    const { access_token, item_id } = exchangeResponse.data;

    // Fetch accounts from Plaid
    const accountsResponse = await plaidClient.accountsGet({ access_token });
    const plaidAccounts = accountsResponse.data.accounts;

    // Create an Account record for each Plaid account
    const created = await Promise.all(
      plaidAccounts.map((account) =>
        prisma.account.create({
          data: {
            userId: user.id,
            householdId,
            name: account.name,
            institution: metadata?.institution?.name || "Unknown",
            last4: account.mask || "0000",
            type: account.type || "depository",
            plaidAccessToken: access_token,
            plaidItemId: item_id,
            plaidAccountId: account.account_id,
            connectionType: "plaid",
            balance: account.balances?.current || 0,
            lastSynced: new Date(),
            status: "connected",
          },
        })
      )
    );

    return NextResponse.json({ success: true, accounts: created.length });
  } catch (error) {
    console.error("Failed to exchange token:", error);
    return NextResponse.json(
      { error: "Failed to exchange token" },
      { status: 500 }
    );
  }
}
