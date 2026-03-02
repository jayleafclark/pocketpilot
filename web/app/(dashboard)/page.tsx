"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BudgetData {
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

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  category: string | null;
  entity: string;
  date: string;
}

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  paidThisMonth: boolean;
  entity: string;
}

export default function DashboardPage() {
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = budget ? `$${Math.round(budget.remaining)} left · PocketPilot` : "PocketPilot";
  }, [budget]);

  useEffect(() => {
    Promise.all([
      fetch("/api/budget").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/transactions?date=today").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/bills").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([b, t, bl]) => {
        if (b) setBudget(b);
        setTxs(Array.isArray(t) ? t : []);
        setBills(Array.isArray(bl) ? bl : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const togglePaid = async (id: string, current: boolean) => {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, paidThisMonth: !current } : b)));
    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidThisMonth: !current }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setBills((prev) => prev.map((b) => (b.id === id ? { ...b, paidThisMonth: current } : b)));
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const unpaidBills = bills.filter((b) => !b.paidThisMonth);
  const unpaidTotal = unpaidBills.reduce((s, b) => s + b.amount, 0);

  if (loading) {
    return (
      <div>
        <div className="mb-7">
          <div className="h-8 w-48 bg-bg3 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-bg3 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-4 gap-3.5 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-[14px] p-5 border border-border">
              <div className="h-3 w-20 bg-bg3 rounded animate-pulse mb-3" />
              <div className="h-7 w-24 bg-bg3 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card rounded-[14px] p-5 border border-border h-64 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const b = budget || { dailyBudget: 0, spentToday: 0, remaining: 0, monthPool: 0, deposited: 0, billsDueCount: 0, billsDueAmount: 0, savingsGoal: 0 };

  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-[26px] font-bold text-t1" style={{ fontFamily: "var(--font-heading)" }}>
            Dashboard
          </h1>
          <p className="text-sm text-t3 mt-1">{dateStr}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        {[
          { l: "Month Pool", v: `$${Math.round(b.monthPool).toLocaleString()}`, c: "var(--color-ch)", s: "Income − bills − savings", href: "/analytics" },
          { l: "Deposited", v: `$${Math.round(b.deposited).toLocaleString()}`, c: "var(--color-ok)", s: "Karani + Ilai this month", href: "/analytics" },
          { l: "Bills Due", v: `$${Math.round(b.billsDueAmount)}`, c: "var(--color-warn)", s: `${b.billsDueCount} remaining`, href: "/bills" },
          { l: "Savings", v: `$${Math.round(b.savingsGoal)}`, c: "var(--color-t1)", s: `$${Math.round(b.savingsGoal)}/mo target`, href: "/settings" },
        ].map((stat) => (
          <Link
            key={stat.l}
            href={stat.href}
            className="bg-card rounded-[14px] p-5 border border-border no-underline transition-shadow hover:shadow-lg cursor-pointer"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 6px 24px rgba(0,0,0,0.03)" }}
          >
            <div className="text-[10px] text-t3 font-semibold uppercase tracking-[0.08em] mb-2">{stat.l}</div>
            <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color: stat.c }}>
              {stat.v}
            </div>
            <div className="text-[11px] text-t4 mt-1.5">{stat.s}</div>
          </Link>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 gap-4">
        {/* Today's Transactions */}
        <div className="bg-card rounded-[14px] p-5 border border-border">
          <div className="flex justify-between items-center mb-3.5">
            <span className="text-sm font-semibold text-t1">Today&apos;s Transactions</span>
            <Link href="/analytics" className="text-xs text-ch font-medium no-underline hover:underline">
              View all →
            </Link>
          </div>
          {txs.length === 0 ? (
            <p className="text-sm text-t3 text-center py-8">
              No spending yet today. Your budget is ${Math.round(b.dailyBudget)}.
            </p>
          ) : (
            txs.map((tx, i) => (
              <div
                key={tx.id}
                className="flex justify-between items-center py-2.5"
                style={{ borderTop: i > 0 ? "1px solid var(--color-border)" : "none" }}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-t1">{tx.merchant}</span>
                    {!tx.category && (
                      <span className="text-[11px] font-semibold text-ch bg-[rgba(176,144,73,0.07)] px-2.5 py-0.5 rounded-lg">
                        New
                      </span>
                    )}
                    {tx.entity && tx.entity !== "personal" && (
                      <span className="text-[11px] font-semibold text-t3 bg-bg2 px-2.5 py-0.5 rounded-lg">Biz</span>
                    )}
                  </div>
                  <span className="text-xs text-t3 block mt-0.5">
                    {tx.category || "Uncategorized"} ·{" "}
                    {new Date(tx.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <span className="text-[13px] font-medium text-t1" style={{ fontFamily: "var(--font-mono)" }}>
                  -${tx.amount.toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Upcoming Bills */}
        <div className="bg-card rounded-[14px] p-5 border border-border">
          <div className="flex justify-between items-center mb-3.5">
            <span className="text-sm font-semibold text-t1">Upcoming Bills</span>
            <Link href="/bills" className="text-xs text-ch font-medium no-underline hover:underline">
              Manage →
            </Link>
          </div>
          {unpaidBills.length === 0 ? (
            <p className="text-sm text-ok text-center py-8">All bills paid this month ✓</p>
          ) : (
            <>
              {unpaidBills.slice(0, 4).map((bill, i) => (
                <div
                  key={bill.id}
                  className="flex justify-between items-center py-2.5"
                  style={{ borderTop: i > 0 ? "1px solid var(--color-border)" : "none" }}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => togglePaid(bill.id, bill.paidThisMonth)}
                      className="w-[18px] h-[18px] rounded-full border-2 border-warn bg-transparent cursor-pointer flex items-center justify-center transition-all hover:bg-[rgba(196,135,59,0.07)]"
                    />
                    <div>
                      <span className="text-[13px] font-medium text-t1">{bill.name}</span>
                      <span className="text-xs text-t3 block mt-0.5">Due {bill.dueDay}th</span>
                    </div>
                  </div>
                  <span className="text-[13px] font-medium text-warn" style={{ fontFamily: "var(--font-mono)" }}>
                    ${bill.amount}
                  </span>
                </div>
              ))}
              {unpaidTotal > 0 && (
                <div className="mt-2.5 p-2.5 px-3.5 rounded-[10px] bg-[rgba(176,144,73,0.035)] flex justify-between items-center">
                  <span className="text-xs text-t2">
                    Transfer{" "}
                    <span className="text-ch font-semibold">${Math.round(unpaidTotal)}</span> to bills
                  </span>
                  <button className="px-3.5 py-1.5 rounded-[10px] text-xs font-semibold text-[#FFFDF5] border-none cursor-pointer" style={{ background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))" }}>
                    Done
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
