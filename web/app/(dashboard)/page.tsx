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
        <div style={{ marginBottom: 28 }}>
          <div className="bg-bg3 rounded-lg animate-pulse" style={{ height: 32, width: 200, marginBottom: 8 }} />
          <div className="bg-bg3 rounded animate-pulse" style={{ height: 18, width: 280 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border animate-pulse" style={{ borderRadius: 14, padding: 24, height: 110 }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border border-border animate-pulse" style={{ borderRadius: 14, padding: 24, height: 280 }} />
          ))}
        </div>
      </div>
    );
  }

  const b = budget || { dailyBudget: 0, spentToday: 0, remaining: 0, monthPool: 0, deposited: 0, billsDueCount: 0, billsDueAmount: 0, savingsGoal: 0 };

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="font-bold text-t1" style={{ fontSize: 24, fontFamily: "var(--font-heading)" }}>
            Dashboard
          </h1>
          <p className="text-t3" style={{ fontSize: 14, marginTop: 4 }}>{dateStr}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { l: "Month Pool", v: `$${Math.round(b.monthPool).toLocaleString()}`, c: "var(--color-ch)", s: "Income − bills − savings", href: "/analytics" },
          { l: "Deposited", v: `$${Math.round(b.deposited).toLocaleString()}`, c: "var(--color-ok)", s: "Karani + Ilai this month", href: "/analytics" },
          { l: "Bills Due", v: `$${Math.round(b.billsDueAmount)}`, c: "var(--color-warn)", s: `${b.billsDueCount} remaining`, href: "/bills" },
          { l: "Savings", v: `$${Math.round(b.savingsGoal)}`, c: "var(--color-t1)", s: `$${Math.round(b.savingsGoal)}/mo target`, href: "/settings" },
        ].map((stat) => (
          <Link
            key={stat.l}
            href={stat.href}
            className="bg-card border border-border no-underline transition-shadow hover:shadow-lg cursor-pointer"
            style={{ borderRadius: 14, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 6px 24px rgba(0,0,0,0.03)" }}
          >
            <div className="text-t3 font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.08em", marginBottom: 8 }}>{stat.l}</div>
            <div className="font-bold" style={{ fontSize: 28, fontFamily: "var(--font-heading)", color: stat.c }}>
              {stat.v}
            </div>
            <div className="text-t4" style={{ fontSize: 12, marginTop: 6 }}>{stat.s}</div>
          </Link>
        ))}
      </div>

      {/* Two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Today's Transactions */}
        <div className="bg-card border border-border" style={{ borderRadius: 14, padding: 24 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <span className="font-semibold text-t1" style={{ fontSize: 15 }}>Today&apos;s Transactions</span>
            <Link href="/analytics" className="text-ch font-medium no-underline hover:underline" style={{ fontSize: 13 }}>
              View all →
            </Link>
          </div>
          {txs.length === 0 ? (
            <p className="text-t3 text-center" style={{ fontSize: 14, padding: "32px 0" }}>
              No spending yet today. Your budget is ${Math.round(b.dailyBudget)}.
            </p>
          ) : (
            txs.map((tx, i) => (
              <div
                key={tx.id}
                className="flex justify-between items-center"
                style={{ padding: "10px 0", borderTop: i > 0 ? "1px solid var(--color-border)" : "none" }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-t1" style={{ fontSize: 14 }}>{tx.merchant}</span>
                    {!tx.category && (
                      <span className="font-semibold text-ch bg-[rgba(176,144,73,0.07)]" style={{ fontSize: 11, padding: "3px 10px", borderRadius: 8 }}>
                        New
                      </span>
                    )}
                    {tx.entity && tx.entity !== "personal" && (
                      <span className="font-semibold text-t3 bg-bg2" style={{ fontSize: 11, padding: "3px 10px", borderRadius: 8 }}>Biz</span>
                    )}
                  </div>
                  <span className="text-t3 block" style={{ fontSize: 12, marginTop: 2 }}>
                    {tx.category || "Uncategorized"} ·{" "}
                    {new Date(tx.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <span className="font-medium text-t1" style={{ fontSize: 14, fontFamily: "var(--font-mono)" }}>
                  -${tx.amount.toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Upcoming Bills */}
        <div className="bg-card border border-border" style={{ borderRadius: 14, padding: 24 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <span className="font-semibold text-t1" style={{ fontSize: 15 }}>Upcoming Bills</span>
            <Link href="/bills" className="text-ch font-medium no-underline hover:underline" style={{ fontSize: 13 }}>
              Manage →
            </Link>
          </div>
          {unpaidBills.length === 0 ? (
            <p className="text-ok text-center" style={{ fontSize: 14, padding: "32px 0" }}>All bills paid this month ✓</p>
          ) : (
            <>
              {unpaidBills.slice(0, 4).map((bill, i) => (
                <div
                  key={bill.id}
                  className="flex justify-between items-center"
                  style={{ padding: "10px 0", borderTop: i > 0 ? "1px solid var(--color-border)" : "none" }}
                >
                  <div className="flex items-center" style={{ gap: 10 }}>
                    <button
                      onClick={() => togglePaid(bill.id, bill.paidThisMonth)}
                      className="border-2 border-warn bg-transparent cursor-pointer flex items-center justify-center transition-all hover:bg-[rgba(196,135,59,0.07)]"
                      style={{ width: 20, height: 20, borderRadius: 10 }}
                    />
                    <div>
                      <span className="font-medium text-t1" style={{ fontSize: 14 }}>{bill.name}</span>
                      <span className="text-t3 block" style={{ fontSize: 12, marginTop: 1 }}>Due {bill.dueDay}th</span>
                    </div>
                  </div>
                  <span className="font-medium text-warn" style={{ fontSize: 14, fontFamily: "var(--font-mono)" }}>
                    ${bill.amount}
                  </span>
                </div>
              ))}
              {unpaidTotal > 0 && (
                <div className="flex justify-between items-center" style={{ marginTop: 12, padding: "10px 16px", borderRadius: 10, backgroundColor: "rgba(176,144,73,0.035)" }}>
                  <span className="text-t2" style={{ fontSize: 13 }}>
                    Transfer{" "}
                    <span className="text-ch font-semibold">${Math.round(unpaidTotal)}</span> to bills
                  </span>
                  <button className="font-semibold text-[#FFFDF5] border-none cursor-pointer" style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))" }}>
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
