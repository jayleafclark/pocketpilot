import { NextResponse } from "next/server";
import { requireHousehold } from "@/lib/auth";
import { plaidClient } from "@/lib/plaid";
import { CountryCode, Products } from "plaid";

export async function POST() {
  try {
    const { user } = await requireHousehold();

    const response = await plaidClient.linkTokenCreate({
      client_name: "PocketPilot",
      language: "en",
      country_codes: [CountryCode.Us],
      products: [Products.Transactions],
      user: { client_user_id: user.id },
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error("Failed to create link token:", error);
    return NextResponse.json(
      { error: "Failed to create link token" },
      { status: 500 }
    );
  }
}
