import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const inviteId = body.inviteId;

    if (!inviteId) {
      return NextResponse.json({ error: "Missing inviteId" }, { status: 400 });
    }

    const invite = await prisma.householdInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.status !== "pending") {
      return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
    }

    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: "Invite is for a different email" }, { status: 403 });
    }

    // Check if already a member of this household
    const existingMember = await prisma.householdMember.findFirst({
      where: { householdId: invite.householdId, userId: user.id },
    });
    if (existingMember) {
      await prisma.householdInvite.update({ where: { id: inviteId }, data: { status: "accepted" } });
      return NextResponse.json({ success: true, alreadyMember: true });
    }

    // Accept: create membership + update invite status
    await prisma.$transaction([
      prisma.householdMember.create({
        data: {
          householdId: invite.householdId,
          userId: user.id,
          role: invite.role,
        },
      }),
      prisma.householdInvite.update({
        where: { id: inviteId },
        data: { status: "accepted" },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
