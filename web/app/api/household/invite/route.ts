import { NextRequest, NextResponse } from "next/server";
import { requireHousehold } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { user, householdId, role } = await requireHousehold();
    if (role !== "admin" && role !== "coadmin") {
      return NextResponse.json({ error: "Only admins can invite" }, { status: 403 });
    }

    const body = await request.json();
    const invites: { email: string; role: string }[] = Array.isArray(body.invites) ? body.invites : [];

    if (invites.length === 0) {
      return NextResponse.json({ error: "No invites provided" }, { status: 400 });
    }

    const created = [];
    for (const invite of invites) {
      const email = invite.email?.toLowerCase()?.trim();
      if (!email) continue;

      // Skip if already a member
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        const existingMember = await prisma.householdMember.findFirst({
          where: { householdId, userId: existingUser.id },
        });
        if (existingMember) continue;
      }

      // Skip if already invited (pending)
      const existingInvite = await prisma.householdInvite.findFirst({
        where: { householdId, email, status: "pending" },
      });
      if (existingInvite) continue;

      const record = await prisma.householdInvite.create({
        data: {
          householdId,
          email,
          role: invite.role === "coadmin" ? "coadmin" : "viewer",
          invitedBy: user.id,
        },
      });
      created.push(record);
    }

    return NextResponse.json({ created: created.length });
  } catch {
    return NextResponse.json({ error: "Failed to send invites" }, { status: 500 });
  }
}
