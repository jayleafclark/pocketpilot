import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    const settings = await prisma.settings.findUnique({ where: { userId: user.id } });

    return NextResponse.json({
      onboardingComplete: settings?.onboardingComplete ?? false,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
