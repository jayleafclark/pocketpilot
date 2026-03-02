"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  category: string | null;
  entity: string;
  date: string;
  receipt: boolean;
  rationale: string | null;
  account?: { name: string; last4: string } | null;
}

export default function BusinessPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [entity, setEntity] = useState("all");
  const [search, setSearch] = useState("");
  const [editRat, setEditRat] = useState<string | null>(null);
  const [ratText, setRatText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Business · PocketPilot";
    fetch("/api/transactions?entity=trading,creative")
      .then((r) => r.json())
      .then(setTxs)
      .finally(() => setLoading(false));
  }, []);

  const filtered = txs.filter(
    (t) =>
      (entity === "all" || t.entity === entity) &&
      (!search ||
        t.merchant.toLowerCase().includes(search.toLowerCase()) ||
        (t.category && t.category.toLowerCase().includes(search.toLowerCase())))
  );

  const total = filtered.reduce((s, t) => s + t.amount, 0);
  const rcpt = filtered.filter((t) => t.receipt).length;
  const noRat = filtered.filter((t) => !t.rationale).length;
  const auditPct = filtered.length ? Math.round((rcpt / filtered.length) * 100) : 0;

  const toggleReceipt = async (id: string, current: boolean) => {
    setTxs((prev) => prev.map((t) => (t.id === id ? { ...t, receipt: !current } : t)));
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt: !current }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTxs((prev) => prev.map((t) => (t.id === id ? { ...t, receipt: current } : t)));
    }
  };

  const saveRat = async (id: string) => {
    const old = txs.find((t) => t.id === id)?.rationale;
    setTxs((prev) => prev.map((t) => (t.id === id ? { ...t, rationale: ratText } : t)));
    setEditRat(null);
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rationale: ratText }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTxs((prev) => prev.map((t) => (t.id === id ? { ...t, rationale: old ?? null } : t)));
    }
  };

  const exportCSV = () => {
    const rows = filtered.map((t) => [
      new Date(t.date).toISOString().split("T")[0],
      t.merchant,
      t.amount.toFixed(2),
      t.entity === "trading" ? "Karani Markets" : "Ilai Collective",
      t.category || "",
      t.receipt ? "Yes" : "No",
      t.rationale || "",
      t.account ? `${t.account.name} ••${t.account.last4}` : "",
      t.id,
    ]);
    const header = "Date,Merchant,Amount,Entity,Category,Receipt,Rationale,Account,Transaction ID";
    const csv = "\uFEFF" + header + "\n" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const entityLabel = entity === "all" ? "All" : entity === "trading" ? "Karani" : "Ilai";
    const month = new Date().toISOString().slice(0, 7);
    a.href = url;
    a.download = `PocketPilot_Business_${entityLabel}_${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div>
        <div className="h-8 w-56 bg-bg3 rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-4 gap-3.5 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-[14px] p-5 border border-border h-24 animate-pulse" />
          ))}
        </div>
        <div className="bg-card rounded-[14px] border border-border h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-t1" style={{ fontFamily: "var(--font-heading)" }}>
            Business Center
          </h1>
          <p className="text-sm text-t3 mt-1">Tax compliance, deductions, and audit readiness</p>
        </div>
        <button
          onClick={exportCSV}
          className="px-5 py-2.5 rounded-[10px] text-[13px] font-semibold text-[#FFFDF5] border-none cursor-pointer"
          style={{ background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))", boxShadow: "0 2px 12px rgba(176,144,73,0.12)" }}
        >
          Export for Accountant
        </button>
      </div>

      {/* Entity Filter + Search */}
      <div className="flex gap-3 mb-5 items-center flex-wrap">
        {[
          ["all", "All Entities"],
          ["trading", "Karani Markets"],
          ["creative", "Ilai Collective"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setEntity(k)}
            className="px-4 py-2 rounded-[10px] text-[13px] cursor-pointer transition-all"
            style={{
              fontFamily: "var(--font-body)",
              border: entity === k ? "1.5px solid var(--color-ch)" : "1px solid var(--color-border)",
              backgroundColor: entity === k ? "rgba(176,144,73,0.07)" : "transparent",
              color: entity === k ? "var(--color-ch)" : "var(--color-t3)",
              fontWeight: entity === k ? 600 : 400,
            }}
          >
            {l}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-card max-w-[320px]">
          <span className="text-t4 flex">{Icons.search}</span>
          <input
            data-search
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses..."
            className="border-none outline-none text-[13px] text-t1 bg-transparent flex-1"
            style={{ fontFamily: "var(--font-body)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="bg-transparent border-none cursor-pointer text-t4 text-base leading-none">
              ×
            </button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        {[
          { l: "Total Deductible", v: `$${Math.round(total).toLocaleString()}`, c: "var(--color-ch)" },
          { l: "Audit Ready", v: `${auditPct}%`, c: auditPct >= 85 ? "var(--color-ok)" : "var(--color-warn)" },
          { l: "Missing Receipts", v: String(filtered.length - rcpt), c: filtered.length - rcpt > 0 ? "var(--color-red)" : "var(--color-ok)" },
          { l: "No Rationale", v: String(noRat), c: noRat > 0 ? "var(--color-warn)" : "var(--color-ok)" },
        ].map((s) => (
          <div key={s.l} className="bg-card rounded-[14px] p-5 border border-border">
            <div className="text-[11px] text-t3 font-medium uppercase tracking-[0.08em] mb-1">{s.l}</div>
            <div className="text-[22px] font-bold" style={{ fontFamily: "var(--font-heading)", color: s.c }}>
              {s.v}
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Table */}
      <div className="bg-card rounded-[14px] border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <span className="text-[13px] font-semibold text-t1">Business Expenses ({filtered.length})</span>
        </div>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-t3 text-sm">No expenses match your search.</div>
        )}
        {filtered.map((tx, i) => (
          <div key={tx.id} style={{ borderTop: i > 0 ? "1px solid var(--color-border)" : "none" }}>
            <div className="px-5 py-3.5 flex items-center gap-4">
              <div className="flex-[2] min-w-0">
                <div className="text-[13px] font-medium text-t1">{tx.merchant}</div>
                <div className="text-xs text-t3 mt-0.5">
                  {tx.category || "Uncategorized"} · {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
              <div className="w-24">
                <span
                  className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg"
                  style={{
                    color: tx.entity === "trading" ? "var(--color-t2)" : "var(--color-ch)",
                    backgroundColor: tx.entity === "trading" ? "var(--color-bg2)" : "rgba(176,144,73,0.07)",
                  }}
                >
                  {tx.entity === "trading" ? "Karani" : "Ilai"}
                </span>
              </div>
              <div className="w-20 text-right text-[13px] font-medium text-t1" style={{ fontFamily: "var(--font-mono)" }}>
                ${tx.amount.toFixed(2)}
              </div>
              <div className="w-24">
                <button
                  onClick={() => toggleReceipt(tx.id, tx.receipt)}
                  className="text-xs font-medium cursor-pointer bg-transparent border-none"
                  style={{ color: tx.receipt ? "var(--color-ok)" : "var(--color-red)" }}
                >
                  {tx.receipt ? "✓ Receipt" : "+ Receipt"}
                </button>
              </div>
              <div className="w-24">
                <button
                  onClick={() => {
                    setEditRat(editRat === tx.id ? null : tx.id);
                    setRatText(tx.rationale || "");
                  }}
                  className="text-xs font-medium cursor-pointer bg-transparent border-none"
                  style={{ color: tx.rationale ? "var(--color-t2)" : "var(--color-warn)" }}
                >
                  {tx.rationale ? "Edit" : "+ Rationale"}
                </button>
              </div>
            </div>

            {/* Rationale display */}
            {tx.rationale && editRat !== tx.id && (
              <div className="px-5 pb-3 -mt-1">
                <div className="text-xs text-t3 bg-bg rounded-lg px-3.5 py-2.5">
                  <span className="font-medium">Business Purpose:</span> {tx.rationale}
                </div>
              </div>
            )}

            {/* Rationale editor */}
            {editRat === tx.id && (
              <div className="px-5 pb-3.5">
                <textarea
                  value={ratText}
                  onChange={(e) => setRatText(e.target.value)}
                  rows={2}
                  placeholder="Why was this expense necessary for business?"
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-card text-[13px] text-t1 outline-none resize-y leading-relaxed"
                  style={{ fontFamily: "var(--font-body)" }}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => saveRat(tx.id)}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-[#FFFDF5] border-none cursor-pointer"
                    style={{ background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))" }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditRat(null)}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium text-t2 bg-transparent border border-border cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
