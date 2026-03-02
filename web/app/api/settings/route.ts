import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();

    const [incomeConfig, settings, entities] = await Promise.all([
      prisma.incomeConfig.findUnique({ where: { userId: user.id } }),
      prisma.settings.findUnique({ where: { userId: user.id } }),
      prisma.entity.findMany({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      incomeConfig: incomeConfig || {
        karaniDailyAvg: 400,
        ilaiBiweekly: 3000,
        savingsGoal: 800,
      },
      settings: settings || {
        taxYear: 2026,
        notificationsOn: true,
        quietHoursStart: 22,
        quietHoursEnd: 7,
        currentStreak: 0,
        bestStreak: 0,
        biometricEnabled: false,
      },
      entities,
      user: {
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        currency: user.currency,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();

    // Upsert income config
    if (body.incomeConfig) {
      await prisma.incomeConfig.upsert({
        where: { userId: user.id },
        update: body.incomeConfig,
        create: { userId: user.id, ...body.incomeConfig },
      });
    }

    // Upsert settings
    if (body.settings) {
      await prisma.settings.upsert({
        where: { userId: user.id },
        update: body.settings,
        create: { userId: user.id, ...body.settings },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 400 });
  }
}
