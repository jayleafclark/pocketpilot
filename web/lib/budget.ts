import { prisma } from "./db";

const safeNumber = (n: number | null | undefined): number => {
  if (n === null || n === undefined || isNaN(n) || !isFinite(n)) return 0;
  return n;
};

interface BudgetResult {
  dailyBudget: number;
  spentToday: number;
  remaining: number;
  pct: number;
  monthPool: number;
  estimatedMonthlyIncome: number;
  totalBills: number;
  savingsGoal: number;
  deposited: number;
  billsDueCount: number;
  billsDueAmount: number;
}

export async function computeBudget(userId: string): Promise<BudgetResult> {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Get or create Settings
  let settings = await prisma.settings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        userId,
        savingsGoal: 0,
        currentStreak: 0,
        bestStreak: 0,
        biometricEnabled: false,
        onboardingComplete: false,
      },
    });
  }

  // Get or create IncomeConfig
  let incomeConfig = await prisma.incomeConfig.findUnique({ where: { userId } });
  if (!incomeConfig) {
    incomeConfig = await prisma.incomeConfig.create({
      data: {
        userId,
        karaniDailyAvg: 0,
        ilaiBiweekly: 0,
        savingsGoal: 0,
      },
    });
  }

  const karaniDaily = safeNumber(incomeConfig.karaniDailyAvg);
  const ilaiBiweekly = safeNumber(incomeConfig.ilaiBiweekly);
  const savingsGoal = safeNumber(incomeConfig.savingsGoal);

  const estimatedMonthlyIncome = safeNumber(karaniDaily * 22 + ilaiBiweekly * 2);

  // Get all active bills and prorate
  const bills = await prisma.bill.findMany({ where: { userId, active: true } });
  let totalBills = 0;
  for (const bill of bills) {
    if (bill.frequency === "monthly") totalBills += safeNumber(bill.amount);
    else if (bill.frequency === "quarterly") totalBills += safeNumber(bill.amount) / 3;
    else if (bill.frequency === "annual") totalBills += safeNumber(bill.amount) / 12;
  }
  totalBills = safeNumber(totalBills);

  const monthPool = safeNumber(estimatedMonthlyIncome - totalBills - savingsGoal);
  const dailyBudget = safeNumber(Math.round((monthPool / daysInMonth) * 100) / 100);

  // Get today's spending (non-bill debits)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  const todayTxs = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startOfDay, lt: endOfDay },
      type: "debit",
      isBill: false,
    },
  });
  const spentToday = safeNumber(todayTxs.reduce((sum, tx) => sum + tx.amount, 0));

  const remaining = safeNumber(Math.round((dailyBudget - spentToday) * 100) / 100);
  const pct = safeNumber(dailyBudget > 0 ? spentToday / dailyBudget : 0);

  // Bills due (unpaid)
  const unpaidBills = bills.filter((b) => !b.paidThisMonth && b.active);
  const billsDueAmount = safeNumber(unpaidBills.reduce((s, b) => s + b.amount, 0));

  // Deposited this month (credits)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const deposits = await prisma.transaction.findMany({
    where: { userId, date: { gte: startOfMonth, lte: endOfMonth }, type: "credit" },
  });
  const deposited = safeNumber(deposits.reduce((s, tx) => s + tx.amount, 0));

  return {
    dailyBudget: safeNumber(dailyBudget),
    spentToday: safeNumber(Math.round(spentToday * 100) / 100),
    remaining: safeNumber(remaining),
    pct: safeNumber(Math.round(pct * 1000) / 1000),
    monthPool: safeNumber(Math.round(monthPool * 100) / 100),
    estimatedMonthlyIncome: safeNumber(estimatedMonthlyIncome),
    totalBills: safeNumber(Math.round(totalBills * 100) / 100),
    savingsGoal: safeNumber(savingsGoal),
    deposited: safeNumber(Math.round(deposited * 100) / 100),
    billsDueCount: unpaidBills.length,
    billsDueAmount: safeNumber(Math.round(billsDueAmount * 100) / 100),
  };
}
