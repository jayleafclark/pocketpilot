import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const karaniDailyAvg = parseFloat(body.karaniDailyAvg) || 0;
    const ilaiBiweekly = parseFloat(body.ilaiBiweekly) || 0;
    const savingsGoal = parseFloat(body.savingsGoal) || 0;
    const bills: { name: string; amount: number; dueDay: number; frequency: string; dueMonth: number | null }[] = Array.isArray(body.bills) ? body.bills : [];

    await prisma.$transaction(async (tx) => {
      // a. Upsert IncomeConfig
      await tx.incomeConfig.upsert({
        where: { userId: user.id },
        update: { karaniDailyAvg, ilaiBiweekly, savingsGoal },
        create: { userId: user.id, karaniDailyAvg, ilaiBiweekly, savingsGoal },
      });

      // b. Upsert Settings with onboardingComplete: true
      await tx.settings.upsert({
        where: { userId: user.id },
        update: { savingsGoal, onboardingComplete: true },
        create: { userId: user.id, savingsGoal, onboardingComplete: true },
      });

      // c. If karaniDailyAvg > 0: create Entity "Karani Markets LLC"
      if (karaniDailyAvg > 0) {
        const existing = await tx.entity.findUnique({
          where: { userId_slug: { userId: user.id, slug: "trading" } },
        });
        if (!existing) {
          await tx.entity.create({
            data: {
              userId: user.id,
              slug: "trading",
              name: "Karani Markets LLC",
              type: "Trading",
              taxSchedule: "Schedule C",
              description: "Futures trading via NinjaTrader",
            },
          });
        }
      }

      // d. If ilaiBiweekly > 0: create Entity "Ilai Collective LLC"
      if (ilaiBiweekly > 0) {
        const existing = await tx.entity.findUnique({
          where: { userId_slug: { userId: user.id, slug: "creative" } },
        });
        if (!existing) {
          await tx.entity.create({
            data: {
              userId: user.id,
              slug: "creative",
              name: "Ilai Collective LLC",
              type: "Creative",
              taxSchedule: "Schedule C",
              description: "Podcast, design, content",
            },
          });
        }
      }

      // e. Create Bill records
      for (const bill of bills) {
        await tx.bill.create({
          data: {
            userId: user.id,
            name: bill.name,
            amount: parseFloat(String(bill.amount)) || 0,
            dueDay: parseInt(String(bill.dueDay)) || 1,
            frequency: bill.frequency || "monthly",
            dueMonth: bill.dueMonth ? parseInt(String(bill.dueMonth)) : null,
            entity: "personal",
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
