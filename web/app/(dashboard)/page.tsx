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
  const hasDeposits = budget && budget.deposited > 0;

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <div className="bg-bg3 rounded-lg animate-pulse" style={{ height: 36, width: 200, marginBottom: 8 }} />
          <div className="bg-bg3 rounded animate-pulse" style={{ height: 18, width: 280 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse" style={{ borderRadius: 14, padding: 20, height: 110, background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.055)" }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 24 }}>
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse" style={{ borderRadius: 14, padding: 24, height: 280, background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.055)" }} />
          ))}
        </div>
      </div>
    );
  }

  const b = budget || { dailyBudget: 0, spentToday: 0, remaining: 0, monthPool: 0, deposited: 0, billsDueCount: 0, billsDueAmount: 0, savingsGoal: 0 };

  const cardStyle: React.CSSProperties = {
    background: "#FFFFFF",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.055)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 6px 24px rgba(0,0,0,0.03)",
  };

  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontFamily: "var(--font-heading)", fontWeight: 600, color: "#1A1915" }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 14, fontFamily: "var(--font-body)", fontWeight: 400, color: "#9C9A95", marginTop: 4 }}>{dateStr}</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { l: "Month Pool", v: `$${Math.round(b.monthPool).toLocaleString()}`, c: "#1A1915", s: "Income − bills − savings", href: "/analytics" },
          { l: "Deposited", v: `$${Math.round(b.deposited).toLocaleString()}`, c: "#1A1915", s: "Karani + Ilai this month", href: "/analytics" },
          { l: "Bills Due", v: `$${Math.round(b.billsDueAmount)}`, c: "#B09049", s: `${b.billsDueCount} remaining`, href: "/bills" },
          { l: "Savings", v: `$${Math.round(b.savingsGoal)}`, c: "#1A1915", s: `$${Math.round(b.savingsGoal)}/mo target`, href: "/settings" },
        ].map((stat) => (
          <Link
            key={stat.l}
            href={stat.href}
            className="no-underline transition-shadow cursor-pointer"
            style={{ ...cardStyle, padding: 20 }}
          >
            <div style={{ fontSize: 11, fontFamily: "var(--font-body)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9C9A95", marginBottom: 8 }}>
              {stat.l}
            </div>
            <div style={{ fontSize: 28, fontFamily: "var(--font-mono)", fontWeight: 600, color: stat.c }}>
              {stat.v}
            </div>
            <div style={{ fontSize: 12, fontFamily: "var(--font-body)", fontWeight: 400, color: "#9C9A95", marginTop: 4 }}>{stat.s}</div>
          </Link>
        ))}
      </div>

      {/* Two columns: 3fr 2fr */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 24 }}>
        {/* Today's Transactions */}
        <div style={{ ...cardStyle, padding: 24 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontFamily: "var(--font-body)", fontWeight: 600, color: "#1A1915" }}>Today&apos;s Transactions</span>
            <Link href="/analytics" className="no-underline" style={{ fontSize: 14, fontFamily: "var(--font-body)", fontWeight: 500, color: "#B09049" }}>
              View all →
            </Link>
          </div>
          {txs.length === 0 ? (
            <p style={{ fontSize: 14, fontFamily: "var(--font-body)", color: "#9C9A95", textAlign: "center", padding: "40px 0" }}>
              No spending yet today. Your budget is ${Math.round(b.dailyBudget)}.
            </p>
          ) : (
            txs.map((tx, i) => (
              <div
                key={tx.id}
                className="flex justify-between items-center"
                style={{ padding: "12px 0", borderBottom: i < txs.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none" }}
              >
                <div>
                  <span style={{ fontSize: 14, fontFamily: "var(--font-body)", fontWeight: 500, color: "#1A1915" }}>{tx.merchant}</span>
                  <span className="block" style={{ fontSize: 12, fontFamily: "var(--font-body)", color: "#9C9A95", marginTop: 2 }}>
                    {tx.category || "Uncategorized"} ·{" "}
                    {new Date(tx.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 15, fontFamily: "var(--font-mono)", fontWeight: 600, color: "#1A1915" }}>
                    -${tx.amount.toFixed(2)}
                  </span>
                  {tx.category && (
                    <span className="block" style={{ fontSize: 11, fontFamily: "var(--font-body)", fontWeight: 500, padding: "2px 8px", borderRadius: 10, background: "rgba(176,144,73,0.15)", color: "#B09049", marginTop: 4, display: "inline-block" }}>
                      {tx.category}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right column: Upcoming Bills + Transfer card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...cardStyle, padding: 24 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontFamily: "var(--font-body)", fontWeight: 600, color: "#1A1915" }}>Upcoming Bills</span>
              <Link href="/bills" className="no-underline" style={{ fontSize: 14, fontFamily: "var(--font-body)", fontWeight: 500, color: "#B09049" }}>
                Manage →
              </Link>
            </div>
            {unpaidBills.length === 0 ? (
              <p style={{ fontSize: 14, fontFamily: "var(--font-body)", color: "#4CAF50", textAlign: "center", padding: "40px 0" }}>All bills paid this month ✓</p>
            ) : (
              <>
                {unpaidBills.slice(0, 4).map((bill, i) => (
                  <div
                    key={bill.id}
                    className="flex justify-between items-center"
                    style={{ padding: "12px 0", borderBottom: i < Math.min(unpaidBills.length, 4) - 1 ? "1px solid rgba(0,0,0,0.06)" : "none" }}
                  >
                    <div className="flex items-center" style={{ gap: 12 }}>
                      <button
                        onClick={() => togglePaid(bill.id, bill.paidThisMonth)}
                        className="border-2 bg-transparent cursor-pointer flex items-center justify-center transition-all"
                        style={{
                          width: 20, height: 20, borderRadius: "50%",
                          borderColor: "#D4D0C8",
                        }}
                      />
                      <div>
                        <span style={{ fontSize: 14, fontFamily: "var(--font-body)", fontWeight: 500, color: "#1A1915" }}>{bill.name}</span>
                        <span className="block" style={{ fontSize: 12, fontFamily: "var(--font-body)", color: "#9C9A95" }}>Due {bill.dueDay}th</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 15, fontFamily: "var(--font-mono)", fontWeight: 500, color: "#1A1915" }}>
                      ${bill.amount}
                    </span>
                  </div>
                ))}
                {unpaidBills.length > 4 && (
                  <Link href="/bills" className="no-underline block" style={{ fontSize: 14, fontFamily: "var(--font-body)", fontWeight: 500, color: "#B09049", textAlign: "center", marginTop: 12 }}>
                    and {unpaidBills.length - 4} more →
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Transfer recommendation card */}
          {unpaidBills.length > 0 && hasDeposits && (
            <div style={{ background: "#F5F0E6", borderRadius: 14, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontFamily: "var(--font-body)", fontWeight: 500, color: "#1A1915" }}>
                Transfer ${Math.round(unpaidTotal)} to cover bills
              </span>
              <button style={{ fontSize: 13, fontFamily: "var(--font-body)", fontWeight: 600, color: "#B09049", background: "none", border: "none", cursor: "pointer" }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
