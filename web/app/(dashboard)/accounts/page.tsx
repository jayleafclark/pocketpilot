"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";

interface Account {
  id: string;
  name: string;
  institution: string;
  last4: string;
  type: string;
  balance: number;
  lastSynced: string | null;
  status: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Accounts · PocketPilot";
    fetch("/api/accounts")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setAccounts(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalAssets = accounts.filter((a) => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const totalDebt = accounts.filter((a) => a.balance < 0).reduce((s, a) => s + a.balance, 0);
  const netPosition = totalAssets + totalDebt;

  const syncAccount = async (id: string) => {
    setSyncing(id);
    try {
      await fetch("/api/sync/revolut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: id }),
      });
      setAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, lastSynced: new Date().toISOString() } : a))
      );
    } catch { /* ignore */ }
    setSyncing(null);
  };

  const disconnectAccount = async (id: string) => {
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "disconnected" } : a)));
    }
    setConfirmDisconnect(null);
  };

  const timeSince = (date: string | null) => {
    if (!date) return "Never";
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  if (loading) {
    return (
      <div>
        <div className="h-8 w-44 bg-bg3 rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-3 gap-3.5 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-[14px] p-5 border border-border h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-t1" style={{ fontFamily: "var(--font-heading)" }}>Accounts</h1>
          <p className="text-sm text-t3 mt-1">Connected accounts and balances</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-[10px] text-[13px] font-semibold text-[#FFFDF5] border-none cursor-pointer"
          style={{ background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))" }}
        >
          {Icons.plus} Connect Account
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3.5 mb-6">
        {[
          { l: "Total Assets", v: `$${totalAssets.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, c: "var(--color-ok)" },
          { l: "Total Debt", v: totalDebt < 0 ? `-$${Math.abs(totalDebt).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0", c: "var(--color-red)" },
          { l: "Net Position", v: `$${netPosition.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, c: "var(--color-t1)" },
        ].map((s) => (
          <div key={s.l} className="bg-card rounded-[14px] p-5 border border-border">
            <div className="text-[11px] text-t3 font-medium uppercase tracking-[0.08em] mb-1">{s.l}</div>
            <div className="text-[22px] font-bold" style={{ fontFamily: "var(--font-heading)", color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {accounts.length === 0 ? (
        <div className="bg-card rounded-[14px] border border-border p-12 text-center">
          <p className="text-t3 mb-4">Connect your first account to get started.</p>
          <button
            onClick={() => setModal(true)}
            className="px-5 py-2.5 rounded-[10px] text-[13px] font-semibold text-[#FFFDF5] border-none cursor-pointer"
            style={{ background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))" }}
          >
            + Connect Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {accounts.map((a) => (
            <div key={a.id} className="bg-card rounded-[14px] p-5 border border-border">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm font-semibold text-t1">{a.name}</div>
                  <div className="text-xs text-t3 mt-0.5">{a.institution} ••{a.last4}</div>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                  style={{
                    color: a.status === "connected" ? "var(--color-ok)" : a.status === "error" ? "var(--color-red)" : "var(--color-t3)",
                    backgroundColor: a.status === "connected" ? "rgba(93,140,90,0.07)" : a.status === "error" ? "rgba(184,92,92,0.07)" : "var(--color-bg2)",
                  }}
                >
                  {a.status === "connected" ? "Connected" : a.status === "error" ? "Error" : "Disconnected"}
                </span>
              </div>

              <div
                className="text-2xl font-bold mb-2"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: a.balance < 0 ? "var(--color-red)" : "var(--color-t1)",
                  opacity: a.status === "disconnected" ? 0.4 : 1,
                }}
              >
                {a.balance < 0 ? "-" : ""}${Math.abs(a.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>

              <div className="text-[11px] text-t3 mb-3">
                {a.type} · Synced {timeSince(a.lastSynced)}
              </div>

              <div className="flex gap-2">
                {a.status === "connected" && (
                  <button
                    onClick={() => syncAccount(a.id)}
                    disabled={syncing === a.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-t2 bg-transparent border border-border cursor-pointer hover:border-[rgba(0,0,0,0.09)] disabled:opacity-50"
                  >
                    <span className={syncing === a.id ? "animate-spin" : ""}>{Icons.refresh}</span>
                    {syncing === a.id ? "Syncing..." : "Refresh"}
                  </button>
                )}
                {a.status !== "disconnected" ? (
                  confirmDisconnect === a.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-red">Disconnect?</span>
                      <button onClick={() => disconnectAccount(a.id)} className="text-xs font-semibold text-red bg-[rgba(184,92,92,0.07)] px-2.5 py-1 rounded-lg border-none cursor-pointer">
                        Yes
                      </button>
                      <button onClick={() => setConfirmDisconnect(null)} className="text-xs text-t3 bg-transparent border-none cursor-pointer">
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDisconnect(a.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-red bg-[rgba(184,92,92,0.07)] border border-[rgba(184,92,92,0.12)] cursor-pointer"
                    >
                      Disconnect
                    </button>
                  )
                ) : (
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-ch bg-transparent border border-border cursor-pointer">
                    Reconnect
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add card */}
          <div
            onClick={() => setModal(true)}
            className="rounded-[14px] p-5 border-2 border-dashed border-border cursor-pointer flex flex-col items-center justify-center gap-2 hover:border-ch transition-colors min-h-[180px]"
          >
            <span className="text-t4">{Icons.plus}</span>
            <span className="text-sm font-medium text-t3">Connect a new account</span>
            <span className="text-[11px] text-t4">Revolut · Plaid · Manual</span>
          </div>
        </div>
      )}

      {/* Sync Configuration */}
      <div className="bg-card rounded-[14px] border border-border p-5">
        <h3 className="text-sm font-semibold text-t1 mb-3">Sync Configuration</h3>
        <div className="space-y-2">
          {[
            { method: "Revolut Business API", schedule: "Every 2 hours" },
            { method: "Plaid", schedule: "Webhook-driven (instant)" },
            { method: "Full Reconciliation", schedule: "Daily at 4:00 AM" },
            { method: "Manual Refresh", schedule: "Anytime" },
          ].map((s) => (
            <div key={s.method} className="flex justify-between py-1.5" style={{ borderTop: "1px solid var(--color-border)" }}>
              <span className="text-xs text-t2">{s.method}</span>
              <span className="text-xs text-t3" style={{ fontFamily: "var(--font-mono)" }}>{s.schedule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Connect Modal */}
      {modal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center" onClick={() => setModal(false)}>
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[4px]" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-card rounded-[20px] p-7 w-[90%] max-w-[480px]"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-t1" style={{ fontFamily: "var(--font-heading)" }}>Connect Account</h3>
              <button onClick={() => setModal(false)} className="bg-transparent border-none cursor-pointer text-t3 text-xl leading-none">×</button>
            </div>
            <div className="space-y-3">
              {[
                { name: "Plaid", desc: "Chase, BofA, Amex, Marcus, and 10,000+ institutions" },
                { name: "Revolut Business API", desc: "Direct connection for Revolut Business accounts" },
                { name: "Manual Entry", desc: "Log transactions manually for cash or unsupported accounts" },
              ].map((opt) => (
                <button
                  key={opt.name}
                  onClick={() => { setModal(false); alert(`${opt.name} connection flow would open here`); }}
                  className="w-full text-left p-4 rounded-[14px] border border-border bg-card hover:bg-bg transition-colors cursor-pointer"
                >
                  <div className="text-sm font-semibold text-t1">{opt.name}</div>
                  <div className="text-xs text-t3 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
