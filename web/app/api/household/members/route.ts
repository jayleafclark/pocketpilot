import { NextRequest, NextResponse } from "next/server";
import { requireHousehold } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { householdId, role } = await requireHousehold();

    const members = await prisma.householdMember.findMany({
      where: { householdId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const invites = await prisma.householdInvite.findMany({
      where: { householdId, status: "pending" },
    });

    return NextResponse.json({ householdId, role, members, invites });
  } catch {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, householdId, role } = await requireHousehold();
    if (role !== "admin") {
      return NextResponse.json({ error: "Only admins can change roles" }, { status: 403 });
    }

    const body = await request.json();
    const { memberId, newRole } = body;

    if (!memberId || !newRole) {
      return NextResponse.json({ error: "memberId and newRole are required" }, { status: 400 });
    }

    // Cannot change own role
    const target = await prisma.householdMember.findFirst({
      where: { id: memberId, householdId },
    });

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (target.userId === user.id) {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    await prisma.householdMember.update({
      where: { id: memberId },
      data: { role: newRole },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, householdId, role } = await requireHousehold();
    if (role !== "admin") {
      return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 });
    }

    const body = await request.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    // Cannot remove self
    const target = await prisma.householdMember.findFirst({
      where: { id: memberId, householdId },
    });

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (target.userId === user.id) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    await prisma.householdMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
