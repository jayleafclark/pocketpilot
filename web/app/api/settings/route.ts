import { NextRequest, NextResponse } from "next/server";
import { requireHousehold, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { user, householdId } = await requireHousehold();

    const [incomeConfig, settings, entities] = await Promise.all([
      prisma.incomeConfig.findUnique({ where: { userId: user.id } }),
      prisma.settings.findUnique({ where: { userId: user.id } }),
      prisma.entity.findMany({ where: { householdId } }),
    ]);

    return NextResponse.json({
      incomeConfig: incomeConfig || {
        karaniDailyAvg: 0,
        ilaiBiweekly: 0,
        savingsGoal: 0,
      },
      settings: settings || {
        taxYear: 2026,
        notificationsOn: true,
        quietHoursStart: 22,
        quietHoursEnd: 7,
        currentStreak: 0,
        bestStreak: 0,
        biometricEnabled: false,
        onboardingComplete: false,
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
    const { user } = await requireRole("coadmin");
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
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Viewer access is read-only" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update settings" }, { status: 400 });
  }
}
