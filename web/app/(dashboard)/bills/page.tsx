"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  frequency: string;
  vendor: string | null;
  category: string | null;
  entity: string;
  accountId: string | null;
  paidThisMonth: boolean;
  active: boolean;
}

interface Account {
  id: string;
  name: string;
}

const empty = { name: "", amount: "", dueDay: "", frequency: "monthly", vendor: "", entity: "personal", accountId: "" };

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    document.title = `Bills (${bills.filter((b) => !b.paidThisMonth).length} due) · PocketPilot`;
  }, [bills]);

  useEffect(() => {
    Promise.all([
      fetch("/api/bills").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/accounts").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([b, a]) => {
        setBills(Array.isArray(b) ? b : []);
        setAccounts(Array.isArray(a) ? a : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = bills.filter(
    (b) =>
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.vendor && b.vendor.toLowerCase().includes(search.toLowerCase()))
  );

  const personal = filtered.filter((b) => !b.entity || b.entity === "personal");
  const business = filtered.filter((b) => b.entity === "trading" || b.entity === "creative");

  const totalMonthly = bills.reduce((s, b) => s + b.amount, 0);
  const paidTotal = bills.filter((b) => b.paidThisMonth).reduce((s, b) => s + b.amount, 0);
  const dueTotal = bills.filter((b) => !b.paidThisMonth).reduce((s, b) => s + b.amount, 0);

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

  const openAdd = () => {
    setForm(empty);
    setEditId(null);
    setConfirmDelete(false);
    setModal("add");
  };

  const openEdit = (bill: Bill) => {
    setForm({
      name: bill.name,
      amount: String(bill.amount),
      dueDay: String(bill.dueDay),
      frequency: bill.frequency,
      vendor: bill.vendor || "",
      entity: bill.entity,
      accountId: bill.accountId || "",
    });
    setEditId(bill.id);
    setConfirmDelete(false);
    setModal("edit");
  };

  const saveBill = async () => {
    const payload = {
      name: form.name,
      amount: form.amount,
      dueDay: form.dueDay,
      frequency: form.frequency,
      vendor: form.vendor || null,
      entity: form.entity,
      accountId: form.accountId || null,
    };

    if (modal === "add") {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newBill = await res.json();
        setBills((prev) => [...prev, newBill]);
      }
    } else if (editId) {
      const res = await fetch(`/api/bills/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setBills((prev) => prev.map((b) => (b.id === editId ? updated : b)));
      }
    }
    setModal(null);
  };

  const deleteBill = async () => {
    if (!editId) return;
    const res = await fetch(`/api/bills/${editId}`, { method: "DELETE" });
    if (res.ok) {
      setBills((prev) => prev.filter((b) => b.id !== editId));
    }
    setModal(null);
  };

  const BillRow = ({ bill, i }: { bill: Bill; i: number }) => (
    <div
      className="flex justify-between items-center"
      style={{ padding: "12px 24px", borderTop: i > 0 ? "1px solid var(--color-border)" : "none" }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => togglePaid(bill.id, bill.paidThisMonth)}
          className="w-[20px] h-[20px] rounded-full border-2 cursor-pointer flex items-center justify-center transition-all"
          style={{
            borderColor: bill.paidThisMonth ? "var(--color-ok)" : "var(--color-warn)",
            backgroundColor: bill.paidThisMonth ? "var(--color-ok)" : "transparent",
          }}
        >
          {bill.paidThisMonth && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
        <div>
          <span
            className="text-[14px] font-medium"
            style={{
              color: bill.paidThisMonth ? "var(--color-t3)" : "var(--color-t1)",
              textDecoration: bill.paidThisMonth ? "line-through" : "none",
              opacity: bill.paidThisMonth ? 0.5 : 1,
            }}
          >
            {bill.name}
          </span>
          <span className="text-[12px] text-t3 block" style={{ marginTop: 1 }}>
            {bill.vendor ? `${bill.vendor} · ` : ""}Due {bill.dueDay}th
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[14px] font-medium text-t1" style={{ fontFamily: "var(--font-mono)" }}>
          ${bill.amount.toFixed(2)}
        </span>
        <span className="text-[13px] text-t3">{bill.frequency}</span>
        <button
          onClick={() => openEdit(bill)}
          className="text-[14px] text-t3 bg-transparent border-none cursor-pointer hover:text-ch"
        >
          Edit
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div>
        <div className="h-8 w-32 bg-bg3 rounded-lg animate-pulse mb-7" />
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
          <h1 className="text-[24px] font-bold text-t1" style={{ fontFamily: "var(--font-heading)" }}>Bills</h1>
          <p className="text-[14px] text-t3" style={{ marginTop: 4 }}>Recurring expenses and subscriptions</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-[10px] text-[14px] font-semibold text-[#FFFDF5] border-none cursor-pointer"
          style={{ padding: "10px 22px", background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))" }}
        >
          {Icons.plus} Add Bill
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { l: "Monthly Total", v: `$${Math.round(totalMonthly).toLocaleString()}`, c: "var(--color-t1)" },
          { l: "Paid This Month", v: `$${Math.round(paidTotal).toLocaleString()}`, c: "var(--color-ok)" },
          { l: "Still Due", v: `$${Math.round(dueTotal).toLocaleString()}`, c: "var(--color-warn)" },
        ].map((s) => (
          <div key={s.l} className="bg-card border border-border" style={{ borderRadius: 14, padding: 24 }}>
            <div className="text-[11px] text-t3 font-medium uppercase" style={{ letterSpacing: "0.08em", marginBottom: 8 }}>{s.l}</div>
            <div className="text-[28px] font-bold" style={{ fontFamily: "var(--font-heading)", color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-5 flex items-center gap-2.5 px-4 py-2.5 border border-border bg-card max-w-[320px]" style={{ borderRadius: 14 }}>
        <span className="text-t4 flex">{Icons.search}</span>
        <input
          data-search
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bills..."
          className="border-none outline-none text-[14px] text-t1 bg-transparent flex-1"
          style={{ fontFamily: "var(--font-body)" }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="bg-transparent border-none cursor-pointer text-t4 text-base leading-none">×</button>
        )}
      </div>

      {bills.length === 0 ? (
        <div className="bg-card border border-border p-12 text-center" style={{ borderRadius: 14 }}>
          <p className="text-t3 mb-4 text-[14px]">No recurring bills yet. Add your first bill to get started.</p>
          <button
            onClick={openAdd}
            className="rounded-[10px] text-[14px] font-semibold text-[#FFFDF5] border-none cursor-pointer"
            style={{ padding: "10px 22px", background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))" }}
          >
            + Add Bill
          </button>
        </div>
      ) : (
        <>
          {/* Personal */}
          {personal.length > 0 && (
            <div className="bg-card border border-border overflow-hidden mb-4" style={{ borderRadius: 14 }}>
              <div className="border-b border-border" style={{ padding: "16px 24px" }}>
                <span className="text-[14px] font-semibold text-t3 uppercase tracking-[0.08em]">Personal & Household</span>
              </div>
              {personal.map((b, i) => <BillRow key={b.id} bill={b} i={i} />)}
            </div>
          )}

          {/* Business */}
          {business.length > 0 && (
            <div className="bg-card border border-border overflow-hidden" style={{ borderRadius: 14 }}>
              <div className="border-b border-border" style={{ padding: "16px 24px" }}>
                <span className="text-[14px] font-semibold text-t3 uppercase tracking-[0.08em]">Business Subscriptions</span>
              </div>
              {business.map((b, i) => <BillRow key={b.id} bill={b} i={i} />)}
            </div>
          )}

          {filtered.length === 0 && search && (
            <div className="text-center py-10 text-t3 text-[14px]">No bills match your search.</div>
          )}
        </>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center" onClick={() => setModal(null)}>
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[4px]" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-card w-[90%] max-w-[480px] max-h-[80vh] overflow-y-auto"
            style={{ borderRadius: 20, padding: "28px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[18px] font-bold text-t1" style={{ fontFamily: "var(--font-heading)" }}>
                {modal === "add" ? "Add Bill" : "Edit Bill"}
              </h3>
              <button onClick={() => setModal(null)} className="bg-transparent border-none cursor-pointer text-t3 text-xl leading-none">
                ×
              </button>
            </div>

            <div className="space-y-4">
              {[
                { label: "Name", key: "name", placeholder: "Car Insurance" },
                { label: "Amount", key: "amount", placeholder: "187.00", type: "number" },
                { label: "Due Day", key: "dueDay", placeholder: "20", type: "number" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-[12px] font-semibold text-t3 uppercase tracking-[0.08em] mb-1.5 block">{f.label}</label>
                  <input
                    type={f.type || "text"}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-card text-[14px] text-t1 outline-none"
                    style={{ fontFamily: f.type === "number" ? "var(--font-mono)" : "var(--font-body)" }}
                  />
                </div>
              ))}

              <div>
                <label className="text-[12px] font-semibold text-t3 uppercase tracking-[0.08em] mb-1.5 block">Frequency</label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-card text-[14px] text-t1 outline-none"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-t3 uppercase tracking-[0.08em] mb-1.5 block">Entity</label>
                <select
                  value={form.entity}
                  onChange={(e) => setForm({ ...form, entity: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-card text-[14px] text-t1 outline-none"
                >
                  <option value="personal">Personal</option>
                  <option value="trading">Karani Markets</option>
                  <option value="creative">Ilai Collective</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-t3 uppercase tracking-[0.08em] mb-1.5 block">Vendor (optional)</label>
                <input
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  placeholder="GEICO"
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-card text-[14px] text-t1 outline-none"
                />
              </div>

              {accounts.length > 0 && (
                <div>
                  <label className="text-[12px] font-semibold text-t3 uppercase tracking-[0.08em] mb-1.5 block">Pay From</label>
                  <select
                    value={form.accountId}
                    onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-card text-[14px] text-t1 outline-none"
                  >
                    <option value="">None</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-6">
              {modal === "edit" && (
                <div>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] text-red">Delete {form.name}?</span>
                      <button onClick={deleteBill} className="text-[14px] font-semibold text-red bg-[rgba(184,92,92,0.07)] px-3 py-1.5 rounded-lg border-none cursor-pointer">
                        Confirm
                      </button>
                      <button onClick={() => setConfirmDelete(false)} className="text-[14px] text-t3 bg-transparent border-none cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="text-[14px] font-medium text-red bg-[rgba(184,92,92,0.07)] px-3 py-1.5 rounded-lg border border-[rgba(184,92,92,0.12)] cursor-pointer"
                    >
                      Delete Bill
                    </button>
                  )}
                </div>
              )}
              <div className={`flex gap-2 ${modal === "add" ? "ml-auto" : ""}`}>
                <button onClick={() => setModal(null)} className="rounded-[10px] text-[14px] font-medium text-t2 bg-transparent border border-border cursor-pointer" style={{ padding: "10px 22px" }}>
                  Cancel
                </button>
                <button
                  onClick={saveBill}
                  disabled={!form.name || !form.amount || !form.dueDay}
                  className="rounded-[10px] text-[14px] font-semibold text-[#FFFDF5] border-none cursor-pointer disabled:opacity-50"
                  style={{ padding: "10px 22px", background: "linear-gradient(135deg, var(--color-ch), var(--color-ch-light))" }}
                >
                  {modal === "add" ? "Add Bill" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
