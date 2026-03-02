import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";

export async function getUser() {
  const { userId } = await auth();
  if (!userId) return null;

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  // Auto-create user if they have a Clerk session but no DB record
  // (handles race condition before webhook fires)
  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) return null;

    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

    user = await prisma.user.create({
      data: { clerkId: userId, email, name },
    });
  }

  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function getHouseholdForUser(userId: string) {
  return prisma.householdMember.findFirst({
    where: { userId },
    include: { household: true },
  });
}

export async function requireHousehold() {
  const user = await requireUser();
  const membership = await getHouseholdForUser(user.id);
  if (!membership) throw new Error("No household");
  return { user, membership, householdId: membership.householdId, role: membership.role };
}
