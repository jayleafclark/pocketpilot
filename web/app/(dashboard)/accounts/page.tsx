"use client";

import { useEffect, useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Icons } from "@/components/icons";
import CsvImportModal from "@/components/csv-import-modal";

interface Account {
  id: string;
  name: string;
  institution: string;
  last4: string;
  type: string;
  balance: number;
  lastSynced: string | null;
  status: string;
  connectionType?: string;
}

function PlaidLinkButton({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plaid/create-link-token", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.link_token) setLinkToken(d.link_token); })
      .catch(() => {});
  }, []);

  const onPlaidSuccess = useCallback(async (publicToken: string) => {
    await fetch("/api/plaid/exchange-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicToken }),
    });
    onSuccess();
  }, [onSuccess]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: () => onClose(),
  });

  useEffect(() => {
    if (ready && linkToken) open();
  }, [ready, linkToken, open]);

  return (
    <div className="py-10 text-center">
      <div className="text-t3" style={{ fontSize: 14 }}>
        {linkToken ? "Opening Plaid Link..." : "Preparing connection..."}
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);
  const [plaidOpen, setPlaidOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);

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

  const reloadAccounts = () => {
    fetch("/api/accounts")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setAccounts(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  const syncAccount = async (id: string) => {
    setSyncing(id);
    try {
      const account = accounts.find((a) => a.id === id);
      const endpoint = account?.connectionType === "plaid" ? "/api/plaid/sync" : "/api/sync/revolut";
      await fetch(endpoint, {
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
        <div className="h-8 w-44 bg-bg3 rounded-lg animate-pulse mb-7" />
        <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-[14px] p-6 border border-border h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="font-bold text-t1" style={{ fontSize: 28, fontFamily: "var(--font-heading)" }}>Accounts</h1>
          <p className="text-t3" style={{ fontSize: 14, marginTop: 4 }}>Connected accounts and balances</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-1.5 font-semibold text-[#FFFDF5] border-none cursor-pointer"
          style={{ fontSize: 14, padding: "10px 22px", borderRadius: 14, minHeight: 44, background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))" }}
        >
          {Icons.plus} Connect Account
        </button>
      </div>

      {/* Stats */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { l: "Total Assets", v: `$${totalAssets.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, c: "var(--color-ok)" },
          { l: "Total Debt", v: totalDebt < 0 ? `-$${Math.abs(totalDebt).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0", c: "var(--color-red)" },
          { l: "Net Position", v: `$${netPosition.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, c: "var(--color-t1)" },
        ].map((s) => (
          <div key={s.l} className="bg-card border border-border" style={{ borderRadius: 14, padding: 24 }}>
            <div className="text-t3 font-medium uppercase" style={{ fontSize: 11, letterSpacing: "0.08em", marginBottom: 8 }}>{s.l}</div>
            <div className="font-bold" style={{ fontSize: 28, fontFamily: "var(--font-mono)", color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {accounts.length === 0 ? (
        <div className="bg-card rounded-[14px] border border-border p-12 text-center">
          <p className="text-t3 mb-4" style={{ fontSize: 14 }}>Connect your first account to get started.</p>
          <button
            onClick={() => setModal(true)}
            className="font-semibold text-[#FFFDF5] border-none cursor-pointer"
            style={{ fontSize: 14, padding: "10px 22px", borderRadius: 10, background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))" }}
          >
            + Connect Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 mb-4" style={{ gap: 16 }}>
          {accounts.map((a) => (
            <div key={a.id} className="bg-card border border-border" style={{ borderRadius: 14, padding: "20px 24px" }}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold text-t1" style={{ fontSize: 16 }}>{a.name}</div>
                  <div className="text-t3 mt-0.5" style={{ fontSize: 13 }}>{a.institution} ••{a.last4}</div>
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
                className="font-bold mb-2"
                style={{
                  fontSize: 28,
                  fontFamily: "var(--font-mono)",
                  color: a.balance < 0 ? "var(--color-red)" : "var(--color-t1)",
                  opacity: a.status === "disconnected" ? 0.4 : 1,
                }}
              >
                {a.balance < 0 ? "-" : ""}${Math.abs(a.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>

              <div className="text-t3 mb-3" style={{ fontSize: 13 }}>
                {a.type} · Synced {timeSince(a.lastSynced)}
              </div>

              <div className="flex gap-2">
                {a.status === "connected" && (
                  <button
                    onClick={() => syncAccount(a.id)}
                    disabled={syncing === a.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-t2 bg-transparent border border-border cursor-pointer hover:border-[rgba(0,0,0,0.09)] disabled:opacity-50"
                    style={{ fontSize: 13 }}
                  >
                    <span className={syncing === a.id ? "animate-spin" : ""}>{Icons.refresh}</span>
                    {syncing === a.id ? "Syncing..." : "Refresh"}
                  </button>
                )}
                {a.status !== "disconnected" ? (
                  confirmDisconnect === a.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-red" style={{ fontSize: 13 }}>Disconnect?</span>
                      <button onClick={() => disconnectAccount(a.id)} className="font-semibold text-red bg-[rgba(184,92,92,0.07)] px-2.5 py-1 rounded-lg border-none cursor-pointer" style={{ fontSize: 13 }}>
                        Yes
                      </button>
                      <button onClick={() => setConfirmDisconnect(null)} className="text-t3 bg-transparent border-none cursor-pointer" style={{ fontSize: 13 }}>
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDisconnect(a.id)}
                      className="px-3 py-1.5 rounded-lg font-medium text-red bg-[rgba(184,92,92,0.07)] border border-[rgba(184,92,92,0.12)] cursor-pointer"
                      style={{ fontSize: 13 }}
                    >
                      Disconnect
                    </button>
                  )
                ) : (
                  <button className="px-3 py-1.5 rounded-lg font-medium text-ch bg-transparent border border-border cursor-pointer" style={{ fontSize: 13 }}>
                    Reconnect
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add card */}
          <div
            onClick={() => setModal(true)}
            className="border-2 border-dashed border-border cursor-pointer flex flex-col items-center justify-center gap-2 hover:border-ch transition-colors min-h-[180px]"
            style={{ borderRadius: 14, padding: "20px 24px" }}
          >
            <span className="text-t4">{Icons.plus}</span>
            <span className="font-medium text-t3" style={{ fontSize: 14 }}>Connect a new account</span>
            <span className="text-t4" style={{ fontSize: 14 }}>Revolut · Plaid · Manual</span>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      {modal && !plaidOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center" onClick={() => setModal(false)}>
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[4px]" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-card w-[90%] max-w-[480px]"
            style={{ borderRadius: 20, padding: "28px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-t1" style={{ fontSize: 18, fontFamily: "var(--font-heading)" }}>Connect Account</h3>
              <button onClick={() => setModal(false)} className="bg-transparent border-none cursor-pointer text-t3 text-xl leading-none">×</button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => { setModal(false); setPlaidOpen(true); }}
                className="w-full text-left rounded-[14px] border border-border bg-card hover:bg-bg transition-colors cursor-pointer"
                style={{ padding: "16px" }}
              >
                <div className="font-semibold text-t1" style={{ fontSize: 14 }}>Plaid</div>
                <div className="text-t3 mt-0.5" style={{ fontSize: 14 }}>Chase, BofA, Amex, Marcus, and 10,000+ institutions</div>
              </button>
              <button
                disabled
                className="w-full text-left rounded-[14px] border border-border bg-card opacity-60 cursor-not-allowed"
                style={{ padding: "16px" }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-t1" style={{ fontSize: 14 }}>Revolut Business API</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-bg2 text-t3">Coming Soon</span>
                </div>
                <div className="text-t3 mt-0.5" style={{ fontSize: 14 }}>Direct connection for Revolut Business accounts</div>
              </button>
              <button
                onClick={() => { setModal(false); setCsvOpen(true); }}
                className="w-full text-left rounded-[14px] border border-border bg-card hover:bg-bg transition-colors cursor-pointer"
                style={{ padding: "16px" }}
              >
                <div className="font-semibold text-t1" style={{ fontSize: 14 }}>Import CSV</div>
                <div className="text-t3 mt-0.5" style={{ fontSize: 14 }}>Upload bank statements, credit card exports, etc.</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plaid Link flow */}
      {plaidOpen && (
        <PlaidLinkButton
          onSuccess={() => { setPlaidOpen(false); reloadAccounts(); }}
          onClose={() => setPlaidOpen(false)}
        />
      )}

      {/* CSV Import Modal */}
      {csvOpen && (
        <CsvImportModal
          onClose={() => setCsvOpen(false)}
          onImported={() => reloadAccounts()}
        />
      )}
    </div>
  );
}
