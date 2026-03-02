"use client";

import { useEffect, useState, useCallback } from "react";
import { useHousehold } from "@/lib/household-context";

interface SettingsData {
  incomeConfig: {
    karaniDailyAvg: number;
    ilaiBiweekly: number;
    savingsGoal: number;
  };
  settings: {
    taxYear: number;
    notificationsOn: boolean;
    quietHoursStart: number;
    quietHoursEnd: number;
    currentStreak: number;
    bestStreak: number;
    biometricEnabled: boolean;
  };
  entities: { id: string; name: string; slug: string; type: string; taxSchedule: string; description: string | null }[];
  user: { name: string | null; email: string; timezone: string; currency: string };
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [karani, setKarani] = useState("400");
  const [ilai, setIlai] = useState("3000");
  const [savings, setSavings] = useState("800");
  const [saved, setSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { role, members, reload: reloadHousehold } = useHousehold();
  const canWrite = role !== "viewer";
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<{ id: string; email: string; role: string; createdAt: string }[]>([]);

  useEffect(() => {
    document.title = "Settings · PocketPilot";
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setData(d);
        setKarani(String(d.incomeConfig?.karaniDailyAvg ?? 0));
        setIlai(String(d.incomeConfig?.ilaiBiweekly ?? 0));
        setSavings(String(d.incomeConfig?.savingsGoal ?? 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/household/members")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.invites) setPendingInvites(d.invites); })
      .catch(() => {});
  }, []);

  const sendInvite = async () => {
    if (!invEmail.trim()) return;
    setInviting(true);
    try {
      await fetch("/api/household/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invites: [{ email: invEmail.trim(), role: invRole }] }),
      });
      setInvEmail("");
      reloadHousehold();
      const res = await fetch("/api/household/members");
      if (res.ok) { const d = await res.json(); setPendingInvites(d.invites || []); }
    } catch { /* ignore */ }
    setInviting(false);
  };

  const removeMember = async (memberId: string) => {
    await fetch("/api/household/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    reloadHousehold();
  };

  const changeRole = async (memberId: string, newRole: string) => {
    await fetch("/api/household/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, newRole }),
    });
    reloadHousehold();
  };

  const karaniNum = parseFloat(karani) || 0;
  const ilaiNum = parseFloat(ilai) || 0;
  const savingsNum = parseFloat(savings) || 0;

  const estimatedMonthly = karaniNum * 22 + ilaiNum * 2;
  const totalBills = 0; // Would come from budget API in full implementation
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dailyBudget = (estimatedMonthly - totalBills - savingsNum) / daysInMonth;

  const saveField = useCallback(async (field: string) => {
    setSaved(null);
    setSaveError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incomeConfig: {
            karaniDailyAvg: parseFloat(karani) || 400,
            ilaiBiweekly: parseFloat(ilai) || 3000,
            savingsGoal: parseFloat(savings) || 800,
          },
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(field);
      setTimeout(() => setSaved(null), 2000);
    } catch {
      setSaveError(field);
      setTimeout(() => setSaveError(null), 3000);
    }
  }, [karani, ilai, savings]);

  if (loading) {
    return (
      <div>
        <div className="h-8 w-36 bg-bg3 rounded-lg animate-pulse mb-7" />
        <div className="space-y-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-[14px] p-6 border border-border h-40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontFamily: "var(--font-heading)", fontWeight: 700 }} className="text-t1">Settings</h1>
        <p style={{ fontSize: 14, marginTop: 4 }} className="text-t3">Income configuration and preferences</p>
      </div>

      <div className="max-w-2xl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Income Configuration */}
        <div className="bg-card border border-border" style={{ borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }} className="text-t1 mb-4">Income Configuration</h3>
          <div className="space-y-4">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em" }} className="text-t3 uppercase mb-1.5 block">
                Karani Markets — Daily Avg
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={karani}
                  onChange={(e) => canWrite && setKarani(e.target.value)}
                  onBlur={() => canWrite && saveField("karani")}
                  readOnly={!canWrite}
                  className="w-full border border-border bg-card text-t1 outline-none"
                  style={{
                    fontSize: 14,
                    padding: "10px 14px",
                    borderRadius: 10,
                    fontFamily: "var(--font-mono)",
                    animation: saved === "karani" ? "flash-champagne 0.3s ease" : saveError === "karani" ? "flash-champagne 0.3s ease" : "none",
                    borderColor: saveError === "karani" ? "var(--color-red)" : undefined,
                  }}
                />
                {saved === "karani" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ok font-medium animate-[fadeUp_0.2s_ease]" style={{ fontSize: 13 }}>
                    Saved
                  </span>
                )}
                {saveError === "karani" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red font-medium" style={{ fontSize: 13 }}>
                    Failed
                  </span>
                )}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em" }} className="text-t3 uppercase mb-1.5 block">
                Ilai Collective — Biweekly
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={ilai}
                  onChange={(e) => canWrite && setIlai(e.target.value)}
                  onBlur={() => canWrite && saveField("ilai")}
                  readOnly={!canWrite}
                  className="w-full border border-border bg-card text-t1 outline-none"
                  style={{
                    fontSize: 14,
                    padding: "10px 14px",
                    borderRadius: 10,
                    fontFamily: "var(--font-mono)",
                    borderColor: saveError === "ilai" ? "var(--color-red)" : undefined,
                  }}
                />
                {saved === "ilai" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ok font-medium" style={{ fontSize: 13 }}>Saved</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <div style={{ fontSize: 14 }} className="font-medium text-t1">
                Estimated Monthly:{" "}
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-ch)" }}>
                  ${estimatedMonthly.toLocaleString()}
                </span>
              </div>
              <div style={{ fontSize: 14 }} className="text-t3 mt-1">
                ({karaniNum} × 22 trading days) + ({ilaiNum} × 2 pay periods)
              </div>
            </div>
          </div>
        </div>

        {/* Budget Derivation */}
        <div className="bg-card border border-border" style={{ borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }} className="text-t1 mb-4">Budget Derivation</h3>
          <div className="mb-4">
            <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em" }} className="text-t3 uppercase mb-1.5 block">
              Monthly Savings Goal
            </label>
            <div className="relative">
              <input
                type="number"
                value={savings}
                onChange={(e) => canWrite && setSavings(e.target.value)}
                onBlur={() => canWrite && saveField("savings")}
                readOnly={!canWrite}
                className="w-full border border-border bg-card text-t1 outline-none"
                style={{
                  fontSize: 14,
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontFamily: "var(--font-mono)",
                }}
              />
              {saved === "savings" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ok font-medium" style={{ fontSize: 13 }}>Saved</span>
              )}
            </div>
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-bg">
            {[
              { l: "Estimated Monthly Income", v: `$${estimatedMonthly.toLocaleString()}`, c: "var(--color-t1)" },
              { l: "− Total Bills", v: `-$${totalBills}`, c: "var(--color-red)" },
              { l: "− Savings Goal", v: `-$${savingsNum.toLocaleString()}`, c: "var(--color-red)" },
              { l: `÷ ${daysInMonth} days`, v: "", c: "var(--color-t3)" },
            ].map((row) => (
              <div key={row.l} className="flex justify-between">
                <span style={{ fontSize: 14 }} className="text-t3">{row.l}</span>
                {row.v && (
                  <span className="font-medium" style={{ fontSize: 14, fontFamily: "var(--font-mono)", color: row.c }}>
                    {row.v}
                  </span>
                )}
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-border">
              <span style={{ fontSize: 14 }} className="font-semibold text-t1">= Daily Budget</span>
              <span
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-heading)", color: "var(--color-ch)" }}
              >
                ${dailyBudget.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Business Entities */}
        <div className="bg-card border border-border" style={{ borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }} className="text-t1 mb-4">Business Entities</h3>
          {data?.entities?.length ? (
            <div className="space-y-3">
              {data.entities.map((e) => (
                <div key={e.id} className="p-3.5 rounded-xl bg-bg border border-border">
                  <div style={{ fontSize: 14 }} className="font-semibold text-t1">{e.name}</div>
                  <div style={{ fontSize: 14 }} className="text-t3 mt-0.5">
                    {e.type} · {e.taxSchedule}
                  </div>
                  {e.description && <div style={{ fontSize: 13 }} className="text-t4 mt-1">{e.description}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 32 }}>
              <div style={{ fontSize: 14, color: "#9C9A95" }}>No business entities configured</div>
              <div style={{ fontSize: 12, color: "#9C9A95", marginTop: 4 }}>Complete onboarding to set up your entities</div>
            </div>
          )}
        </div>

        {/* Household Members */}
        <div className="bg-card border border-border" style={{ borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }} className="text-t1 mb-4">Household Members</h3>
          <div className="space-y-2 mb-4">
            {members.map((m) => (
              <div key={m.id} className="flex justify-between items-center" style={{ padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
                <div>
                  <span style={{ fontSize: 14 }} className="font-medium text-t1">{m.user.name || m.user.email}</span>
                  {m.user.name && <span style={{ fontSize: 13 }} className="text-t3 ml-2">{m.user.email}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {role === "admin" && m.role !== "admin" ? (
                    <select
                      value={m.role}
                      onChange={(e) => changeRole(m.id, e.target.value)}
                      className="text-[12px] font-semibold border border-border rounded-md bg-card text-t2 cursor-pointer"
                      style={{ padding: "2px 8px", height: 28 }}
                    >
                      <option value="coadmin">Co-Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                      style={{ color: m.role === "admin" ? "var(--color-ch)" : "var(--color-t3)", background: m.role === "admin" ? "rgba(176,144,73,0.12)" : "var(--color-bg2)" }}
                    >
                      {m.role === "admin" ? "Admin" : m.role === "coadmin" ? "Co-Admin" : "Viewer"}
                    </span>
                  )}
                  {role === "admin" && m.role !== "admin" && (
                    <button
                      onClick={() => removeMember(m.id)}
                      className="text-red bg-transparent border-none cursor-pointer font-medium"
                      style={{ fontSize: 12 }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pending invites */}
          {pendingInvites.length > 0 && (
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-t3 uppercase tracking-[0.08em] mb-2">Pending Invites</div>
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex justify-between items-center py-2">
                  <span style={{ fontSize: 13 }} className="text-t3">{inv.email}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-bg2 text-t4">
                    {inv.role} · Pending
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Invite form */}
          {(role === "admin" || role === "coadmin") && (
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                value={invEmail}
                onChange={(e) => setInvEmail(e.target.value)}
                className="flex-1 border border-border bg-card text-t1 outline-none"
                style={{ fontSize: 14, padding: "8px 12px", borderRadius: 10 }}
              />
              <select
                value={invRole}
                onChange={(e) => setInvRole(e.target.value)}
                className="border border-border bg-card text-t2"
                style={{ fontSize: 13, padding: "8px 10px", borderRadius: 10 }}
              >
                <option value="coadmin">Co-Admin</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                onClick={sendInvite}
                disabled={inviting || !invEmail.trim()}
                className="font-semibold text-[#FFFDF5] border-none cursor-pointer disabled:opacity-50"
                style={{ fontSize: 13, padding: "8px 18px", borderRadius: 10, background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))" }}
              >
                {inviting ? "..." : "Invite"}
              </button>
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="bg-card border border-border" style={{ borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }} className="text-t1 mb-4">Preferences</h3>
          <div className="space-y-2">
            {[
              { l: "Tax Year", v: String(data?.settings?.taxYear || 2026) },
              { l: "Currency", v: data?.user?.currency || "USD" },
              { l: "Timezone", v: data?.user?.timezone || "Auto (follows device)" },
              { l: "Notifications", v: data?.settings?.notificationsOn ? "Enabled" : "Disabled" },
              { l: "Quiet Hours", v: `${data?.settings?.quietHoursStart || 22}:00–${data?.settings?.quietHoursEnd || 7}:00` },
            ].map((pref) => (
              <div key={pref.l} className="flex justify-between items-center" style={{ borderTop: "1px solid var(--color-border)", minHeight: 48 }}>
                <span style={{ fontSize: 14 }} className="text-t3">{pref.l}</span>
                <span style={{ fontSize: 14 }} className="text-t1 font-medium">{pref.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
