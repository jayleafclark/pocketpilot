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

    // Create defaults
    await Promise.all([
      prisma.incomeConfig.create({ data: { userId: user.id } }),
      prisma.settings.create({ data: { userId: user.id } }),
      prisma.entity.createMany({
        data: [
          { userId: user.id, slug: "trading", name: "Karani Markets LLC", type: "Trading", taxSchedule: "Schedule C", description: "Futures trading via NinjaTrader" },
          { userId: user.id, slug: "creative", name: "Ilai Collective LLC", type: "Creative", taxSchedule: "Schedule C", description: "Podcast, design, content" },
        ],
      }),
    ]);
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
