"use client";

import { useEffect, useState } from "react";

interface BudgetData {
  dailyBudget: number;
  spentToday: number;
  monthPool: number;
  estimatedMonthlyIncome: number;
  totalBills: number;
  savingsGoal: number;
}

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  category: string | null;
  entity: string;
  date: string;
  type: string;
}

export default function AnalyticsPage() {
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("6m");

  useEffect(() => {
    document.title = "Analytics · PocketPilot";
    const from = new Date();
    from.setMonth(from.getMonth() - 6);

    Promise.all([
      fetch("/api/budget").then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/transactions?from=${from.toISOString()}`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([b, t]) => { if (b) setBudget(b); setTxs(Array.isArray(t) ? t : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Monthly chart data
  const months: { label: string; income: number; spending: number }[] = [];
  const rangeMonths = range === "3m" ? 3 : range === "12m" ? 12 : 6;
  for (let i = rangeMonths - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = d.getMonth();
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const monthTxs = txs.filter((t) => {
      const td = new Date(t.date);
      return td.getFullYear() === y && td.getMonth() === m;
    });
    const income = monthTxs.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const spending = monthTxs.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    months.push({ label, income, spending });
  }

  const maxBar = Math.max(...months.map((m) => Math.max(m.income, m.spending)), 1);

  // Categories
  const debits = txs.filter((t) => t.type === "debit" && t.category);
  const catMap: Record<string, number> = {};
  debits.forEach((t) => { catMap[t.category!] = (catMap[t.category!] || 0) + t.amount; });
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCat = topCats[0]?.[1] || 1;

  // Tax summary
  const bizTxs = txs.filter((t) => t.type === "debit" && (t.entity === "trading" || t.entity === "creative"));
  const tradingTotal = bizTxs.filter((t) => t.entity === "trading").reduce((s, t) => s + t.amount, 0);
  const creativeTotal = bizTxs.filter((t) => t.entity === "creative").reduce((s, t) => s + t.amount, 0);

  // Daily average (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const last30 = txs.filter((t) => t.type === "debit" && new Date(t.date) >= thirtyDaysAgo);
  const dailyAvg = last30.length > 0 ? last30.reduce((s, t) => s + t.amount, 0) / 30 : 0;

  if (loading) {
    return (
      <div>
        <div className="h-8 w-40 bg-bg3 rounded-lg animate-pulse mb-7" />
        <div className="bg-card rounded-[14px] border border-border h-64 animate-pulse mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-[14px] p-6 border border-border h-40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const b = budget || { savingsGoal: 800, dailyBudget: 0, estimatedMonthlyIncome: 0 };

  return (
    <div>
      <div className="flex justify-between items-start" style={{ marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontFamily: "var(--font-heading)", fontWeight: 700 }} className="text-t1">Analytics</h1>
          <p style={{ fontSize: 14, marginTop: 4 }} className="text-t3">Income, spending, and tax insights</p>
        </div>
        <div className="flex gap-1.5">
          {[
            { k: "3m", l: "3M" },
            { k: "6m", l: "6M" },
            { k: "12m", l: "12M" },
          ].map((r) => (
            <button
              key={r.k}
              onClick={() => setRange(r.k)}
              className="rounded-lg font-medium cursor-pointer transition-all"
              style={{
                fontSize: 14,
                padding: "8px 16px",
                backgroundColor: range === r.k ? "rgba(176,144,73,0.07)" : "transparent",
                color: range === r.k ? "var(--color-ch)" : "var(--color-t3)",
                border: range === r.k ? "1px solid var(--color-ch)" : "1px solid var(--color-border)",
              }}
            >
              {r.l}
            </button>
          ))}
        </div>
      </div>

      {/* Income vs Spending Chart */}
      <div className="bg-card border border-border mb-4" style={{ borderRadius: 14, padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600 }} className="text-t1 mb-4">Income vs Spending</h3>
        {months.every((m) => m.income === 0 && m.spending === 0) ? (
          <div className="py-10 text-center text-t3" style={{ fontSize: 14 }}>
            Not enough data yet. Chart will appear after your first month.
          </div>
        ) : (
          <>
            <div className="flex items-end gap-3" style={{ height: 192 }}>
              {months.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex gap-1 items-end w-full justify-center" style={{ height: 140 }}>
                    <div
                      className="w-[40%] rounded-t-md transition-all"
                      style={{
                        height: `${(m.income / maxBar) * 100}%`,
                        backgroundColor: "rgba(93,140,90,0.5)",
                        minHeight: m.income > 0 ? 4 : 0,
                      }}
                    />
                    <div
                      className="w-[40%] rounded-t-md transition-all"
                      style={{
                        height: `${(m.spending / maxBar) * 100}%`,
                        background: "linear-gradient(180deg, var(--color-ch), var(--color-ch-light))",
                        minHeight: m.spending > 0 ? 4 : 0,
                      }}
                    />
                  </div>
                  <span
                    className="mt-1"
                    style={{
                      fontSize: 12,
                      color: i === months.length - 1 ? "var(--color-ch)" : "var(--color-t3)",
                      fontWeight: i === months.length - 1 ? 600 : 400,
                    }}
                  >
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "rgba(93,140,90,0.5)" }} />
                <span style={{ fontSize: 12 }} className="text-t3">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))" }} />
                <span style={{ fontSize: 12 }} className="text-t3">Spending</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2" style={{ gap: 16 }}>
        {/* Savings Progress */}
        <div className="bg-card border border-border" style={{ borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }} className="text-t1 mb-3">Savings Progress</h3>
          {b.savingsGoal === 0 ? (
            <p style={{ fontSize: 14 }} className="text-t3">Set a savings goal in Settings to track progress.</p>
          ) : (
            <>
              <div className="mb-2" style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-ok)" }}>
                ${(b.savingsGoal * new Date().getMonth()).toLocaleString()}
              </div>
              <div className="h-2 rounded bg-bg3 mb-1.5">
                <div
                  className="h-2 rounded transition-all"
                  style={{
                    width: `${Math.min((new Date().getMonth() / 12) * 100, 100)}%`,
                    backgroundColor: "var(--color-ok)",
                  }}
                />
              </div>
              <span style={{ fontSize: 14 }} className="text-t3">
                ${(b.savingsGoal * new Date().getMonth()).toLocaleString()} of ${(b.savingsGoal * 12).toLocaleString()} ({new Date().getMonth()} months)
              </span>
            </>
          )}
        </div>

        {/* Daily Average */}
        <div className="bg-card border border-border" style={{ borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }} className="text-t1 mb-3">Daily Average</h3>
          {dailyAvg === 0 ? (
            <p style={{ fontSize: 14 }} className="text-t3">Spending data will appear after 7 days of activity.</p>
          ) : (
            <>
              <div className="mb-3" style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-t1)" }}>
                ${dailyAvg.toFixed(0)}
                <span style={{ fontSize: 14, fontWeight: 400 }} className="text-t3 ml-1">/day (30d avg)</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { l: "Budget per day", v: `$${Math.round(b.dailyBudget)}` },
                  { l: "30-day avg", v: `$${dailyAvg.toFixed(0)}` },
                ].map((s) => (
                  <div key={s.l} className="flex justify-between py-1" style={{ borderTop: "1px solid var(--color-border)" }}>
                    <span style={{ fontSize: 14 }} className="text-t3">{s.l}</span>
                    <span style={{ fontSize: 14, fontFamily: "var(--font-mono)" }} className="text-t1 font-medium">{s.v}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top Categories */}
        <div className="bg-card border border-border" style={{ borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }} className="text-t1 mb-3">Top Categories</h3>
          {topCats.length === 0 ? (
            <p style={{ fontSize: 14 }} className="text-t3">Categorize some transactions to see your top spending categories.</p>
          ) : (
            <div className="space-y-3">
              {topCats.map(([cat, amt]) => (
                <div key={cat}>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: 14 }} className="text-t2">{cat}</span>
                    <span style={{ fontSize: 14, fontFamily: "var(--font-mono)" }} className="text-t1 font-medium">
                      ${Math.round(amt).toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 rounded bg-bg3">
                    <div
                      className="h-1.5 rounded transition-all"
                      style={{
                        width: `${(amt / maxCat) * 100}%`,
                        background: "linear-gradient(90deg, var(--color-ch), var(--color-ch-light))",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tax Summary */}
        <div className="bg-card border border-border" style={{ borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }} className="text-t1 mb-3">Tax Summary</h3>
          {tradingTotal === 0 && creativeTotal === 0 ? (
            <p style={{ fontSize: 14 }} className="text-t3">No business expenses recorded yet.</p>
          ) : (
            <>
              <div className="mb-3" style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-ch)" }}>
                ${Math.round(tradingTotal + creativeTotal).toLocaleString()}
              </div>
              <div className="space-y-2">
                {tradingTotal > 0 && (
                  <div className="flex justify-between py-1.5" style={{ borderTop: "1px solid var(--color-border)" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }} className="text-t1">Karani Markets LLC</div>
                      <div style={{ fontSize: 14 }} className="text-t3">Trading · Schedule C</div>
                    </div>
                    <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 500 }} className="text-t1">
                      ${Math.round(tradingTotal).toLocaleString()}
                    </span>
                  </div>
                )}
                {creativeTotal > 0 && (
                  <div className="flex justify-between py-1.5" style={{ borderTop: "1px solid var(--color-border)" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }} className="text-t1">Ilai Collective LLC</div>
                      <div style={{ fontSize: 14 }} className="text-t3">Creative · Schedule C</div>
                    </div>
                    <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 500 }} className="text-t1">
                      ${Math.round(creativeTotal).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
