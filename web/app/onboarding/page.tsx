"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface LocalBill {
  name: string;
  amount: number;
  dueDay: number;
  frequency: string;
  dueMonth: number | null;
}

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);
  const [showContent, setShowContent] = useState(true);

  // Step 1
  const [karaniDailyAvg, setKaraniDailyAvg] = useState("");
  // Step 2
  const [ilaiBiweekly, setIlaiBiweekly] = useState("");
  // Step 3
  const [savingsGoal, setSavingsGoal] = useState("");
  // Step 4
  const [localBills, setLocalBills] = useState<LocalBill[]>([]);
  const [showBillForm, setShowBillForm] = useState(false);
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billDueDay, setBillDueDay] = useState("");
  const [billFreq, setBillFreq] = useState("monthly");
  const [billDueMonth, setBillDueMonth] = useState(String(new Date().getMonth() + 1));
  // Step 5
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  const karaniNum = parseFloat(karaniDailyAvg) || 0;
  const ilaiNum = parseFloat(ilaiBiweekly) || 0;
  const savingsNum = parseFloat(savingsGoal) || 0;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  const billsMonthlyTotal = localBills.reduce((s, b) => {
    if (b.frequency === "monthly") return s + b.amount;
    if (b.frequency === "quarterly") return s + b.amount / 3;
    if (b.frequency === "annual") return s + b.amount / 12;
    return s;
  }, 0);

  const estimatedMonthly = karaniNum * 22 + ilaiNum * 2;
  const monthPool = estimatedMonthly - billsMonthlyTotal - savingsNum;
  const dailyBudget = Math.round(monthPool / daysInMonth);

  const animateTo = useCallback((next: number, direction: "forward" | "back") => {
    if (animating) return;
    setAnimating(true);
    setDir(direction);
    setShowContent(false);
    setTimeout(() => {
      setStep(next);
      setShowContent(true);
      setTimeout(() => setAnimating(false), 300);
    }, 300);
  }, [animating]);

  const goNext = () => animateTo(step + 1, "forward");
  const goBack = () => animateTo(step - 1, "back");

  const addBill = () => {
    if (!billName || !billAmount) return;
    const newBill: LocalBill = {
      name: billName,
      amount: parseFloat(billAmount) || 0,
      dueDay: parseInt(billDueDay) || 1,
      frequency: billFreq,
      dueMonth: billFreq !== "monthly" ? parseInt(billDueMonth) : null,
    };
    setLocalBills((prev) => [...prev, newBill]);
    setBillName("");
    setBillAmount("");
    setBillDueDay("");
    setBillFreq("monthly");
    setBillDueMonth(String(new Date().getMonth() + 1));
    setShowBillForm(false);
  };

  const removeBill = (idx: number) => {
    setLocalBills((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          karaniDailyAvg: karaniNum,
          ilaiBiweekly: ilaiNum,
          savingsGoal: savingsNum,
          bills: localBills,
        }),
      });
      if (!res.ok) throw new Error();
      router.push("/");
    } catch {
      setSaving(false);
      setToast("Something went wrong. Try again.");
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Progress dots
  const dots = [1, 2, 3, 4, 5];

  const slideClass = showContent
    ? "onb-slide-in"
    : dir === "forward"
      ? "onb-slide-out-left"
      : "onb-slide-out-right";

  return (
    <div style={{ background: "#F8F7F4", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }

        .onb-slide-in {
          animation: onbSlideIn 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .onb-slide-out-left {
          animation: onbSlideOutLeft 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .onb-slide-out-right {
          animation: onbSlideOutRight 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes onbSlideIn {
          from { opacity: 0; transform: translateX(${dir === "forward" ? "40px" : "-40px"}); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes onbSlideOutLeft {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-40px); }
        }
        @keyframes onbSlideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(40px); }
        }

        .onb-input-wrap { display: flex; align-items: center; width: 100%; height: 48px; border: 1px solid rgba(0,0,0,0.1); border-radius: 14px; background: #FFFFFF; padding: 0 16px; transition: border-color 200ms ease; }
        .onb-input-wrap:focus-within { border-color: #B09049; box-shadow: 0 0 0 3px rgba(176,144,73,0.1); }

        .onb-btn { width: 100%; height: 48px; background: #B09049; color: #FFFFFF; font-size: 15px; font-family: 'DM Sans', sans-serif; font-weight: 600; border: none; border-radius: 14px; cursor: pointer; transition: background-color 200ms ease, opacity 200ms ease; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .onb-btn:hover:not(:disabled) { background: #9A7A3D; }
        .onb-btn:active:not(:disabled) { background: #8A6A2D; }
        .onb-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .onb-skip { font-size: 13px; font-family: 'DM Sans', sans-serif; font-weight: 500; color: #B09049; cursor: pointer; background: none; border: none; text-align: center; display: block; width: 100%; margin-top: 16px; padding: 8px; border-radius: 8px; }
        .onb-skip:hover { text-decoration: underline; background: rgba(176,144,73,0.05); }

        .onb-toast {
          position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
          background: rgba(58,21,21,0.9); color: #fff; font-size: 14px; font-family: 'DM Sans', sans-serif;
          padding: 12px 24px; border-radius: 8px; z-index: 9999;
          animation: onbFadeIn 200ms ease;
        }
        @keyframes onbFadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

        .onb-bill-form-enter { animation: onbHeightIn 300ms ease forwards; }
        @keyframes onbHeightIn { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 500px; } }
      `}</style>

      {toast && <div className="onb-toast">{toast}</div>}

      <div style={{
        width: 560,
        background: "#FFFFFF",
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.055)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 6px 24px rgba(0,0,0,0.03)",
        padding: 48,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Back button (steps 2-4 only) */}
        {step >= 2 && step <= 4 && (
          <button
            onClick={goBack}
            disabled={animating}
            style={{
              position: "absolute", top: 20, left: 20,
              font: "500 13px 'DM Sans', sans-serif", color: "#9C9A95",
              cursor: "pointer", background: "none", border: "none", padding: "4px 8px", borderRadius: 6,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#1A1915"; e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#9C9A95"; e.currentTarget.style.background = "none"; }}
          >
            ← Back
          </button>
        )}

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 32 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#B09049" }} />
          <span style={{ fontSize: 18, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#1A1915" }}>PocketPilot</span>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 16 }}>
          {dots.map((d) => (
            <div
              key={d}
              style={{
                width: 8, height: 8, borderRadius: "50%",
                background: d <= step ? "#B09049" : "transparent",
                border: d <= step ? "none" : "1.5px solid #D4D0C8",
                transition: "background-color 200ms ease",
              }}
            />
          ))}
        </div>

        {/* Step counter */}
        <div style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: "#9C9A95", textAlign: "center", marginBottom: 24 }}>
          Step {step} of 5
        </div>

        {/* Animated content */}
        <div ref={contentRef} className={slideClass} style={{ minHeight: 200 }}>
          {step === 1 && <Step1 value={karaniDailyAvg} onChange={setKaraniDailyAvg} karaniNum={karaniNum} onContinue={goNext} animating={animating} />}
          {step === 2 && <Step2 value={ilaiBiweekly} onChange={setIlaiBiweekly} ilaiNum={ilaiNum} onContinue={goNext} onSkip={() => { setIlaiBiweekly("0"); goNext(); }} animating={animating} />}
          {step === 3 && <Step3 value={savingsGoal} onChange={setSavingsGoal} karaniNum={karaniNum} ilaiNum={ilaiNum} savingsNum={savingsNum} daysInMonth={daysInMonth} onContinue={goNext} onSkip={() => { setSavingsGoal("0"); goNext(); }} animating={animating} />}
          {step === 4 && (
            <Step4
              bills={localBills}
              onRemove={removeBill}
              showForm={showBillForm}
              onToggleForm={() => setShowBillForm(!showBillForm)}
              billName={billName} setBillName={setBillName}
              billAmount={billAmount} setBillAmount={setBillAmount}
              billDueDay={billDueDay} setBillDueDay={setBillDueDay}
              billFreq={billFreq} setBillFreq={setBillFreq}
              billDueMonth={billDueMonth} setBillDueMonth={setBillDueMonth}
              onAddBill={addBill}
              onCancelForm={() => { setShowBillForm(false); setBillName(""); setBillAmount(""); setBillDueDay(""); setBillFreq("monthly"); }}
              karaniNum={karaniNum} ilaiNum={ilaiNum} savingsNum={savingsNum}
              billsMonthlyTotal={billsMonthlyTotal} daysInMonth={daysInMonth}
              onContinue={goNext}
              onSkip={() => { setLocalBills([]); goNext(); }}
              animating={animating}
            />
          )}
          {step === 5 && (
            <Step5
              dailyBudget={dailyBudget}
              estimatedMonthly={estimatedMonthly}
              billsMonthlyTotal={billsMonthlyTotal}
              savingsNum={savingsNum}
              monthPool={monthPool}
              saving={saving}
              onComplete={handleComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── STEP 1 ── */
function Step1({ value, onChange, karaniNum, onContinue, animating }: {
  value: string; onChange: (v: string) => void; karaniNum: number; onContinue: () => void; animating: boolean;
}) {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontFamily: "'Bodoni Moda', serif", fontWeight: 600, color: "#1A1915", textAlign: "center", marginBottom: 8 }}>
        How much do you earn from trading?
      </h2>
      <p style={{ fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: "#9C9A95", textAlign: "center", marginBottom: 32 }}>
        Enter your average daily profit from ES Mini futures
      </p>

      <label style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#9C9A95", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "block" }}>
        DAILY AVERAGE
      </label>
      <div className="onb-input-wrap">
        <span style={{ fontSize: 18, fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, color: "#9C9A95", marginRight: 4, pointerEvents: "none" }}>$</span>
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && value && onContinue()}
          placeholder="400"
          style={{ fontSize: 18, fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, color: "#1A1915", background: "transparent", border: "none", outline: "none", width: "100%" }}
        />
      </div>

      <div style={{ marginTop: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, minHeight: 20 }}>
        {karaniNum > 0 ? (
          <span style={{ color: "#B09049" }}>≈ ${fmt(karaniNum * 22)}/month from trading</span>
        ) : (
          <span style={{ color: "#9C9A95" }}>Enter your daily average to calculate</span>
        )}
      </div>

      <button className="onb-btn" disabled={!value || animating} onClick={onContinue} style={{ marginTop: 40 }}>
        Continue
      </button>
    </div>
  );
}

/* ── STEP 2 ── */
function Step2({ value, onChange, ilaiNum, onContinue, onSkip, animating }: {
  value: string; onChange: (v: string) => void; ilaiNum: number; onContinue: () => void; onSkip: () => void; animating: boolean;
}) {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontFamily: "'Bodoni Moda', serif", fontWeight: 600, color: "#1A1915", textAlign: "center", marginBottom: 8 }}>
        Any other income sources?
      </h2>
      <p style={{ fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: "#9C9A95", textAlign: "center", marginBottom: 32 }}>
        Enter income from Ilai Collective or other work
      </p>

      <label style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#9C9A95", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "block" }}>
        BIWEEKLY AMOUNT
      </label>
      <div className="onb-input-wrap">
        <span style={{ fontSize: 18, fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, color: "#9C9A95", marginRight: 4, pointerEvents: "none" }}>$</span>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onContinue()}
          placeholder="3000"
          style={{ fontSize: 18, fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, color: "#1A1915", background: "transparent", border: "none", outline: "none", width: "100%" }}
        />
      </div>

      <div style={{ marginTop: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, minHeight: 20 }}>
        {ilaiNum > 0 ? (
          <span style={{ color: "#B09049" }}>≈ ${fmt(ilaiNum * 2)}/month</span>
        ) : (
          <span style={{ color: "#9C9A95" }}>Enter biweekly amount to calculate</span>
        )}
      </div>

      <button className="onb-btn" disabled={animating} onClick={onContinue} style={{ marginTop: 40 }}>
        Continue
      </button>
      <button className="onb-skip" onClick={onSkip} disabled={animating}>Skip — I only have trading income</button>
    </div>
  );
}

/* ── STEP 3 ── */
function Step3({ value, onChange, karaniNum, ilaiNum, savingsNum, daysInMonth, onContinue, onSkip, animating }: {
  value: string; onChange: (v: string) => void; karaniNum: number; ilaiNum: number; savingsNum: number; daysInMonth: number;
  onContinue: () => void; onSkip: () => void; animating: boolean;
}) {
  const est = karaniNum * 22 + ilaiNum * 2;
  const daily = Math.round((est - savingsNum) / daysInMonth);
  const isNeg = daily < 0;

  return (
    <div>
      <h2 style={{ fontSize: 24, fontFamily: "'Bodoni Moda', serif", fontWeight: 600, color: "#1A1915", textAlign: "center", marginBottom: 8 }}>
        Monthly savings goal
      </h2>
      <p style={{ fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: "#9C9A95", textAlign: "center", marginBottom: 32 }}>
        How much do you want to set aside each month?
      </p>

      <label style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#9C9A95", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "block" }}>
        MONTHLY SAVINGS
      </label>
      <div className="onb-input-wrap">
        <span style={{ fontSize: 18, fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, color: "#9C9A95", marginRight: 4, pointerEvents: "none" }}>$</span>
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onContinue()}
          placeholder="800"
          style={{ fontSize: 18, fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, color: "#1A1915", background: "transparent", border: "none", outline: "none", width: "100%" }}
        />
      </div>

      {/* Budget preview */}
      <div style={{ marginTop: 24, background: "#F5F0E6", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#1A1915", lineHeight: "28px" }}>
          <span>Estimated Monthly Income</span>
          <span>${fmt(est)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: "28px" }}>
          <span style={{ color: "#1A1915" }}>− Savings Goal</span>
          <span style={{ color: "#9C9A95" }}>-${fmt(savingsNum)}</span>
        </div>
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", margin: "8px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 16, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#1A1915" }}>= Daily Budget</span>
          <span style={{ fontSize: 20, fontFamily: "'Bodoni Moda', serif", fontWeight: 600, color: isNeg ? "#E06B6B" : "#B09049" }}>${fmt(daily)}</span>
        </div>
      </div>

      <button className="onb-btn" disabled={animating} onClick={onContinue} style={{ marginTop: 40 }}>
        Continue
      </button>
      <button className="onb-skip" onClick={onSkip} disabled={animating}>Skip — no savings goal</button>
    </div>
  );
}

/* ── STEP 4 ── */
function Step4({ bills, onRemove, showForm, onToggleForm, billName, setBillName, billAmount, setBillAmount, billDueDay, setBillDueDay, billFreq, setBillFreq, billDueMonth, setBillDueMonth, onAddBill, onCancelForm, karaniNum, ilaiNum, savingsNum, billsMonthlyTotal, daysInMonth, onContinue, onSkip, animating }: {
  bills: LocalBill[]; onRemove: (i: number) => void; showForm: boolean; onToggleForm: () => void;
  billName: string; setBillName: (v: string) => void; billAmount: string; setBillAmount: (v: string) => void;
  billDueDay: string; setBillDueDay: (v: string) => void; billFreq: string; setBillFreq: (v: string) => void;
  billDueMonth: string; setBillDueMonth: (v: string) => void;
  onAddBill: () => void; onCancelForm: () => void;
  karaniNum: number; ilaiNum: number; savingsNum: number; billsMonthlyTotal: number; daysInMonth: number;
  onContinue: () => void; onSkip: () => void; animating: boolean;
}) {
  const est = karaniNum * 22 + ilaiNum * 2;
  const daily = Math.round((est - billsMonthlyTotal - savingsNum) / daysInMonth);
  const isNeg = daily < 0;

  const inputStyle: React.CSSProperties = { width: "100%", height: 44, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, padding: "0 12px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#1A1915", background: "#FFFFFF", outline: "none" };
  const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none" as const, WebkitAppearance: "none" as const };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontFamily: "'Bodoni Moda', serif", fontWeight: 600, color: "#1A1915", textAlign: "center", marginBottom: 8 }}>
        Add your recurring bills
      </h2>
      <p style={{ fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: "#9C9A95", textAlign: "center", marginBottom: 24 }}>
        Bills are subtracted before calculating your daily budget
      </p>

      {/* Bill list */}
      {bills.length === 0 ? (
        <div style={{ border: "2px dashed #D4D0C8", borderRadius: 14, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#9C9A95" }}>No bills added yet</span>
        </div>
      ) : (
        <div style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: 14, overflow: "hidden" }}>
          {bills.map((bill, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: i < bills.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
              <div>
                <div style={{ fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: "#1A1915" }}>{bill.name}</div>
                <div style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: "#9C9A95" }}>
                  {bill.frequency.charAt(0).toUpperCase() + bill.frequency.slice(1)} · Due {bill.dueDay}{bill.dueDay === 1 ? "st" : bill.dueDay === 2 ? "nd" : bill.dueDay === 3 ? "rd" : "th"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 15, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: "#1A1915" }}>${fmt(bill.amount)}</span>
                <button
                  onClick={() => onRemove(i)}
                  style={{ fontSize: 18, color: "#C8C4BC", cursor: "pointer", background: "none", border: "none", padding: 4, lineHeight: 1 }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#E06B6B"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#C8C4BC"; }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add bill button */}
      {!showForm && (
        <button
          onClick={onToggleForm}
          style={{ marginTop: 16, width: "100%", height: 44, border: "1px solid #B09049", color: "#B09049", background: "transparent", fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, borderRadius: 14, cursor: "pointer" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(176,144,73,0.05)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          + Add Bill
        </button>
      )}

      {/* Inline bill form */}
      {showForm && (
        <div className="onb-bill-form-enter" style={{ marginTop: 12, padding: 20, background: "#FAFAF8", borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input value={billName} onChange={(e) => setBillName(e.target.value)} placeholder="e.g., Car Insurance" style={inputStyle} />
            <div style={{ ...inputStyle, display: "flex", alignItems: "center", padding: "0 12px" }}>
              <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", color: "#9C9A95", marginRight: 4, pointerEvents: "none" }}>$</span>
              <input type="number" min="0" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} placeholder="187.00" style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: 14, fontFamily: "'JetBrains Mono', monospace", color: "#1A1915", height: "100%" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input type="number" min="1" max="31" value={billDueDay} onChange={(e) => setBillDueDay(e.target.value)} placeholder="20" style={inputStyle} />
              <select value={billFreq} onChange={(e) => setBillFreq(e.target.value)} style={selectStyle}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            {billFreq !== "monthly" && (
              <div style={{ overflow: "hidden", transition: "max-height 200ms ease", maxHeight: 60 }}>
                <select value={billDueMonth} onChange={(e) => setBillDueMonth(e.target.value)} style={selectStyle}>
                  {months.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 4 }}>
              <button onClick={onCancelForm} style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#9C9A95", cursor: "pointer", background: "none", border: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#1A1915"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#9C9A95"; }}
              >Cancel</button>
              <button
                onClick={onAddBill}
                disabled={!billName || !billAmount}
                style={{ background: "#B09049", color: "#fff", fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, height: 36, borderRadius: 12, padding: "0 20px", border: "none", cursor: "pointer", opacity: (!billName || !billAmount) ? 0.4 : 1 }}
              >Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Budget preview */}
      <div style={{ marginTop: 24, background: "#F5F0E6", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#1A1915", lineHeight: "28px" }}>
          <span>Estimated Monthly Income</span><span>${fmt(est)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: "28px" }}>
          <span style={{ color: "#1A1915" }}>− Total Bills</span><span style={{ color: "#E06B6B" }}>-${fmt(Math.round(billsMonthlyTotal))}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: "28px" }}>
          <span style={{ color: "#1A1915" }}>− Savings Goal</span><span style={{ color: "#9C9A95" }}>-${fmt(savingsNum)}</span>
        </div>
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", margin: "8px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#9C9A95", lineHeight: "28px" }}>
          <span>÷ {daysInMonth} days</span><span></span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 16, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#1A1915" }}>= Daily Budget</span>
          <span style={{ fontSize: 20, fontFamily: "'Bodoni Moda', serif", fontWeight: 600, color: isNeg ? "#E06B6B" : "#B09049" }}>${fmt(daily)}/day</span>
        </div>
      </div>

      <button className="onb-btn" disabled={animating} onClick={onContinue} style={{ marginTop: 24 }}>
        Continue
      </button>
      <button className="onb-skip" onClick={onSkip} disabled={animating}>Skip for now</button>
    </div>
  );
}

/* ── STEP 5 ── */
function Step5({ dailyBudget, estimatedMonthly, billsMonthlyTotal, savingsNum, monthPool, saving, onComplete }: {
  dailyBudget: number; estimatedMonthly: number; billsMonthlyTotal: number; savingsNum: number; monthPool: number;
  saving: boolean; onComplete: () => void;
}) {
  return (
    <div>
      <h2 style={{ fontSize: 28, fontFamily: "'Bodoni Moda', serif", fontWeight: 600, color: "#1A1915", textAlign: "center", marginBottom: 4 }}>
        You&apos;re all set!
      </h2>
      <p style={{ fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: "#9C9A95", textAlign: "center", marginBottom: 32 }}>
        Your daily spending budget
      </p>

      <div style={{ fontSize: 64, fontFamily: "'Bodoni Moda', serif", fontWeight: 700, color: "#B09049", textAlign: "center", lineHeight: 1 }}>
        ${fmt(dailyBudget)}
      </div>
      <div style={{ fontSize: 16, fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: "#9C9A95", textAlign: "center", marginTop: 8, marginBottom: 32 }}>
        per day
      </div>

      {/* Summary card */}
      <div style={{ background: "#F5F0E6", borderRadius: 12, padding: 20, marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#1A1915", lineHeight: "28px" }}>
          <span>Monthly Income</span><span>${fmt(estimatedMonthly)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: "28px" }}>
          <span style={{ color: "#1A1915" }}>Monthly Bills</span>
          <span style={{ color: billsMonthlyTotal > 0 ? "#E06B6B" : "#9C9A95" }}>
            {billsMonthlyTotal > 0 ? `-$${fmt(Math.round(billsMonthlyTotal))}` : "$0"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: "28px" }}>
          <span style={{ color: "#1A1915" }}>Savings Goal</span>
          <span style={{ color: "#9C9A95" }}>{savingsNum > 0 ? `-$${fmt(savingsNum)}` : "$0"}</span>
        </div>
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", margin: "8px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: "28px" }}>
          <span style={{ color: "#1A1915", fontWeight: 600 }}>Monthly Pool</span>
          <span style={{ color: "#1A1915", fontWeight: 600 }}>${fmt(Math.round(monthPool))}</span>
        </div>
      </div>

      <button className="onb-btn" onClick={onComplete} disabled={saving}>
        {saving ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
            </svg>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Setting up...
          </>
        ) : "Go to Dashboard"}
      </button>
    </div>
  );
}
