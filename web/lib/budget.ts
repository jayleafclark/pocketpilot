import { prisma } from "./db";

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

  // Get income config
  const incomeConfig = await prisma.incomeConfig.findUnique({ where: { userId } });
  const karaniDaily = incomeConfig?.karaniDailyAvg ?? 400;
  const ilaiBiweekly = incomeConfig?.ilaiBiweekly ?? 3000;
  const savingsGoal = incomeConfig?.savingsGoal ?? 800;

  const estimatedMonthlyIncome = karaniDaily * 22 + ilaiBiweekly * 2;

  // Get all active bills and prorate
  const bills = await prisma.bill.findMany({ where: { userId, active: true } });
  let totalBills = 0;
  for (const bill of bills) {
    if (bill.frequency === "monthly") totalBills += bill.amount;
    else if (bill.frequency === "quarterly") totalBills += bill.amount / 3;
    else if (bill.frequency === "annual") totalBills += bill.amount / 12;
  }

  const monthPool = estimatedMonthlyIncome - totalBills - savingsGoal;
  const dailyBudget = Math.round((monthPool / daysInMonth) * 100) / 100;

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
  const spentToday = todayTxs.reduce((sum, tx) => sum + tx.amount, 0);

  const remaining = Math.round((dailyBudget - spentToday) * 100) / 100;
  const pct = dailyBudget > 0 ? spentToday / dailyBudget : 0;

  // Bills due (unpaid)
  const unpaidBills = bills.filter((b) => !b.paidThisMonth && b.active);
  const billsDueAmount = unpaidBills.reduce((s, b) => s + b.amount, 0);

  // Deposited this month (credits)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const deposits = await prisma.transaction.findMany({
    where: { userId, date: { gte: startOfMonth, lte: endOfMonth }, type: "credit" },
  });
  const deposited = deposits.reduce((s, tx) => s + tx.amount, 0);

  return {
    dailyBudget,
    spentToday: Math.round(spentToday * 100) / 100,
    remaining,
    pct: Math.round(pct * 1000) / 1000,
    monthPool: Math.round(monthPool * 100) / 100,
    estimatedMonthlyIncome,
    totalBills: Math.round(totalBills * 100) / 100,
    savingsGoal,
    deposited: Math.round(deposited * 100) / 100,
    billsDueCount: unpaidBills.length,
    billsDueAmount: Math.round(billsDueAmount * 100) / 100,
  };
}
