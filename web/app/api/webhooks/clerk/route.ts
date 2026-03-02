import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Clerk webhook to create user record on sign-up
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.type === "user.created") {
      const { id, email_addresses, first_name, last_name } = body.data;
      const email = email_addresses?.[0]?.email_address;
      if (!email) return NextResponse.json({ error: "No email" }, { status: 400 });

      const name = [first_name, last_name].filter(Boolean).join(" ") || null;

      // Create user with defaults
      const user = await prisma.user.create({
        data: {
          clerkId: id,
          email,
          name,
        },
      });

      // Create default income config
      await prisma.incomeConfig.create({
        data: { userId: user.id },
      });

      // Create default settings
      await prisma.settings.create({
        data: { userId: user.id },
      });

      // Create default entities
      await prisma.entity.createMany({
        data: [
          {
            userId: user.id,
            slug: "trading",
            name: "Karani Markets LLC",
            type: "Trading",
            taxSchedule: "Schedule C",
            description: "Futures trading via NinjaTrader",
          },
          {
            userId: user.id,
            slug: "creative",
            name: "Ilai Collective LLC",
            type: "Creative",
            taxSchedule: "Schedule C",
            description: "Podcast, design, content",
          },
        ],
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Clerk webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
