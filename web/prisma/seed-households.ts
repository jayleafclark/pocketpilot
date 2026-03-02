import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find all users who don't yet have a HouseholdMember record
  const users = await prisma.user.findMany({
    where: {
      memberships: { none: {} },
    },
  });

  console.log(`Found ${users.length} users without a household`);

  for (const user of users) {
    const household = await prisma.household.create({
      data: {
        name: user.name ? `${user.name}'s Household` : "My Household",
        members: {
          create: { userId: user.id, role: "admin" },
        },
      },
    });

    // Backfill householdId on all financial data
    const hid = household.id;

    const [accounts, transactions, bills, entities, incomeConfigs] = await Promise.all([
      prisma.account.updateMany({ where: { userId: user.id, householdId: null }, data: { householdId: hid } }),
      prisma.transaction.updateMany({ where: { userId: user.id, householdId: null }, data: { householdId: hid } }),
      prisma.bill.updateMany({ where: { userId: user.id, householdId: null }, data: { householdId: hid } }),
      prisma.entity.updateMany({ where: { userId: user.id, householdId: null }, data: { householdId: hid } }),
      prisma.incomeConfig.updateMany({ where: { userId: user.id, householdId: null }, data: { householdId: hid } }),
    ]);

    console.log(
      `User ${user.email}: household ${hid} — ` +
      `${accounts.count} accounts, ${transactions.count} txs, ${bills.count} bills, ` +
      `${entities.count} entities, ${incomeConfigs.count} income configs`
    );
  }

  console.log("Done!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
