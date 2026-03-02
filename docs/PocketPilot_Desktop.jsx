import { useState, useCallback } from "react";

/* ══════════════════════════════════════════════════
   POCKETPILOT DESKTOP v2 — Full Audit Fix
   Quiet luxury fintech. Every button works.
   ══════════════════════════════════════════════════ */

const FH = '"Bodoni Moda","Playfair Display",Georgia,serif';
const FB = '"DM Sans",-apple-system,system-ui,sans-serif';
const FM = '"JetBrains Mono","SF Mono",monospace';

const T = {
  bg: "#F8F7F4", bg2: "#F1EFE9", bg3: "#E8E5DD",
  card: "#FFFFFF", cardH: "#FDFCFA",
  t1: "#1A1915", t2: "#6B6960", t3: "#9E9B92", t4: "#C4C1B9",
  ch: "#B09049", chL: "#CCAA5C", chD: "#8E7338",
  chM: "rgba(176,144,73,0.07)", chG: "rgba(176,144,73,0.035)",
  ok: "#5D8C5A", okM: "rgba(93,140,90,0.07)",
  warn: "#C4873B", warnM: "rgba(196,135,59,0.07)",
  red: "#B85C5C", redM: "rgba(184,92,92,0.07)",
  border: "rgba(0,0,0,0.055)", borderH: "rgba(0,0,0,0.09)",
  sh: "0 1px 3px rgba(0,0,0,0.03), 0 6px 24px rgba(0,0,0,0.03)",
  shH: "0 2px 8px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.06)",
};

/* ═══ SVG ICONS ═══ */
const IC = {
  home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  biz: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="12.01"/></svg>,
  bill: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  bank: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  chart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  gear: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

/* ═══ ARC ═══ */
function Arc({ pct, size, sw = 3, trackColor, fillColor, overColor, gapDeg = 65 }) {
  const r = (size - sw * 2) / 2, cx = size / 2, cy = size / 2;
  const sa = 90 + gapDeg / 2, sweep = 360 - gapDeg;
  const fill = Math.min(pct, 1), isOver = pct > 1;
  const pol = (d) => { const rad = (d - 90) * Math.PI / 180; return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]; };
  const arc = (a, b) => { const s = Math.min(b - a, 359.5); if (s <= 0) return ""; const [x1, y1] = pol(a); const [x2, y2] = pol(a + s); return `M ${x1} ${y1} A ${r} ${r} 0 ${s > 180 ? 1 : 0} 1 ${x2} ${y2}`; };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={arc(sa, sa + sweep)} fill="none" stroke={trackColor || T.bg3} strokeWidth={sw} strokeLinecap="round" />
      {fill > 0 && <path d={arc(sa, sa + sweep * fill)} fill="none" stroke={isOver ? (overColor || T.red) : (fillColor || T.ch)} strokeWidth={sw} strokeLinecap="round" />}
      {isOver && <path d={arc(sa + sweep - 1, sa + sweep + Math.min((pct - 1) * 3, 0.3) * sweep)} fill="none" stroke={overColor || T.red} strokeWidth={sw} strokeLinecap="round" opacity={0.6} />}
    </svg>
  );
}

/* ═══ COMPONENTS ═══ */
function Badge({ children, color, bg }) { return <span style={{ fontSize: 11, fontWeight: 600, color: color || T.ch, backgroundColor: bg || T.chM, padding: "3px 10px", borderRadius: 8, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>{children}</span>; }

function Btn({ children, primary, danger, small, style, onClick }) {
  return <button onClick={onClick} style={{
    padding: small ? "7px 14px" : "10px 22px", borderRadius: 10, fontSize: small ? 12 : 13, fontWeight: 600, cursor: "pointer", fontFamily: FB, transition: "all 0.15s",
    ...(primary ? { background: `linear-gradient(135deg, ${T.ch}, ${T.chL})`, color: "#FFFDF5", border: "none", boxShadow: `0 2px 12px ${T.ch}20` } :
       danger ? { background: T.redM, color: T.red, border: `1px solid ${T.red}20` } :
       { background: "transparent", color: T.t2, border: `1px solid ${T.border}` }),
    ...style,
  }}>{children}</button>;
}

function Stat({ label, value, sub, color }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ fontSize: 11, color: T.t3, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
    <span style={{ fontSize: 22, fontWeight: 700, color: color || T.t1, fontFamily: FH }}>{value}</span>
    {sub && <span style={{ fontSize: 12, color: T.t3 }}>{sub}</span>}
  </div>;
}

function SearchBar({ value, onChange, placeholder }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, border: `1px solid ${T.border}`, backgroundColor: T.card, maxWidth: 320 }}>
    <span style={{ color: T.t4, display: "flex" }}>{IC.search}</span>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || "Search..."} style={{ border: "none", outline: "none", fontSize: 13, color: T.t1, fontFamily: FB, flex: 1, backgroundColor: "transparent" }} />
    {value && <button onClick={() => onChange("")} style={{ background: "none", border: "none", cursor: "pointer", color: T.t4, fontSize: 16, lineHeight: 1 }}>×</button>}
  </div>;
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
    <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)" }} />
    <div onClick={e => e.stopPropagation()} style={{ position: "relative", backgroundColor: T.card, borderRadius: 20, padding: "28px 32px", maxWidth: wide ? 640 : 480, width: "90%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: T.t1, fontFamily: FH }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: T.t3, lineHeight: 1 }}>×</button>
      </div>
      {children}
    </div>
  </div>;
}

function Field({ label, value, onChange, type, placeholder, options, textarea }) {
  const s = { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13, color: T.t1, fontFamily: type === "money" ? FM : FB, outline: "none", backgroundColor: T.card };
  return <div style={{ marginBottom: 16 }}>
    <label style={{ fontSize: 11, fontWeight: 600, color: T.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "block" }}>{label}</label>
    {options ? <select value={value} onChange={e => onChange(e.target.value)} style={{ ...s, appearance: "auto" }}>{options.map(o => <option key={o} value={o}>{o}</option>)}</select>
     : textarea ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} placeholder={placeholder} style={{ ...s, resize: "vertical", lineHeight: 1.5 }} />
     : <input type={type === "money" ? "text" : type || "text"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={s} />}
  </div>;
}

/* ═══ INITIAL DATA ═══ */
const initBills = [
  { id: 1, name: "Rent", amount: 1800, due: "1st", paid: true, freq: "Monthly", vendor: "", cat: "Housing", account: "Chase Checking", entity: "" },
  { id: 2, name: "Duke Energy", amount: 294, due: "15th", paid: true, freq: "Monthly", vendor: "Duke Energy", cat: "Utilities", account: "Chase Checking", entity: "" },
  { id: 3, name: "Car Insurance", amount: 187, due: "20th", paid: false, freq: "Monthly", vendor: "GEICO", cat: "Insurance", account: "Chase Checking", entity: "" },
  { id: 4, name: "Internet", amount: 80, due: "22nd", paid: false, freq: "Monthly", vendor: "Spectrum", cat: "Utilities", account: "Chase Checking", entity: "" },
  { id: 5, name: "Phone", amount: 45, due: "25th", paid: false, freq: "Monthly", vendor: "T-Mobile", cat: "Utilities", account: "Chase Checking", entity: "" },
  { id: 6, name: "NinjaTrader", amount: 199, due: "5th", paid: true, freq: "Monthly", vendor: "NinjaTrader", cat: "Software", account: "Revolut Business", entity: "trading" },
  { id: 7, name: "TradingView", amount: 29.95, due: "10th", paid: true, freq: "Monthly", vendor: "TradingView", cat: "Software", account: "Revolut Business", entity: "trading" },
  { id: 8, name: "Adobe CC", amount: 54.99, due: "3rd", paid: true, freq: "Monthly", vendor: "Adobe", cat: "Software", account: "Revolut Business", entity: "creative" },
  { id: 9, name: "Canva Pro", amount: 12.99, due: "12th", paid: true, freq: "Monthly", vendor: "Canva", cat: "Software", account: "Revolut Business", entity: "creative" },
  { id: 10, name: "AWS", amount: 34.12, due: "1st", paid: true, freq: "Monthly", vendor: "AWS", cat: "Hosting", account: "Revolut Business", entity: "creative" },
];

const initBizTxs = [
  { id: 1, merchant: "Adobe CC", amount: 54.99, category: "Software", date: "Mar 1", entity: "creative", receipt: true, rationale: "Content creation tools for Ilai Collective podcast and social media production" },
  { id: 2, merchant: "NinjaTrader", amount: 199, category: "Software", date: "Feb 27", entity: "trading", receipt: false, rationale: "Trading platform license — primary execution software for ES Mini futures trading" },
  { id: 3, merchant: "Fiverr", amount: 250, category: "Contractors", date: "Feb 26", entity: "creative", receipt: true, rationale: "Contracted design work for Ilai Collective brand refresh" },
  { id: 4, merchant: "TradingView", amount: 29.95, category: "Software", date: "Feb 24", entity: "trading", receipt: true, rationale: "Charting and analysis platform — essential for pre-market analysis and level identification" },
  { id: 5, merchant: "Canva Pro", amount: 12.99, category: "Software", date: "Feb 23", entity: "creative", receipt: true, rationale: "Graphic design tool for social media content" },
  { id: 6, merchant: "AWS", amount: 34.12, category: "Hosting", date: "Feb 21", entity: "creative", receipt: true, rationale: "Cloud infrastructure for Ilai Collective digital properties" },
  { id: 7, merchant: "AMZN*2847XK", amount: 42.11, category: "Equipment", date: "Feb 20", entity: "creative", receipt: false, rationale: "" },
  { id: 8, merchant: "Zoom Pro", amount: 13.33, category: "Software", date: "Feb 18", entity: "creative", receipt: true, rationale: "Video conferencing for podcast guest interviews" },
  { id: 9, merchant: "Best Buy", amount: 89.99, category: "Equipment", date: "Feb 15", entity: "trading", receipt: false, rationale: "" },
  { id: 10, merchant: "WeWork", amount: 350, category: "Office", date: "Feb 12", entity: "creative", receipt: true, rationale: "Co-working space for focused production — Ilai Collective content days" },
];

const ACCTS = [
  { id: 1, name: "Chase Checking", last4: "4821", type: "Checking", balance: 3420.18, institution: "Chase", lastSync: "2 min ago" },
  { id: 2, name: "Revolut Business", last4: "7733", type: "Business", balance: 12840.50, institution: "Revolut", lastSync: "5 min ago" },
  { id: 3, name: "Amex Gold", last4: "1009", type: "Credit", balance: -1247.30, institution: "Amex", lastSync: "1 hr ago" },
  { id: 4, name: "Marcus Savings", last4: "5502", type: "Savings", balance: 28500, institution: "Goldman Sachs", lastSync: "3 hrs ago" },
];

const TODAY_TXS = [
  { id: 1, m: "Blue Bottle Coffee", a: 6.40, c: "Food & Drink", t: "9:14 AM", e: "personal" },
  { id: 2, m: "Uber Eats", a: 23.50, c: "Food & Drink", t: "12:32 PM", e: "personal" },
  { id: 3, m: "AMZN*2847XK", a: 42.11, c: null, t: "2:15 PM", e: null },
  { id: 4, m: "Adobe CC", a: 54.99, c: "Software", t: "3:00 AM", e: "creative" },
];

/* ═══ LOGIN ═══ */
function LoginScreen({ onLogin }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mfa, setMfa] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const go = () => {
    if (step === "email") { setStep("password"); return; }
    if (step === "password") { setStep("mfa"); return; }
    setLoading(true); setTimeout(onLogin, 800);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: T.bg, fontFamily: FB }}>
      <div style={{ width: 460, flexShrink: 0, background: "linear-gradient(165deg, #1A1915 0%, #2A2720 40%, #1E1D18 100%)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: 22, background: `linear-gradient(135deg, ${T.ch}, ${T.chL})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 32px ${T.ch}30` }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: "#FFFDF5", fontFamily: FH }}>P</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 600, color: T.ch, letterSpacing: "0.18em", textTransform: "uppercase" }}>PocketPilot</span>
        </div>
        <div style={{ position: "absolute", bottom: 40, fontSize: 12, color: "#5C5A54" }}>Secured by Clerk · Hosted on Railway</div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: T.t1, fontFamily: FH, marginBottom: 8 }}>
            {step === "email" ? "Sign in" : step === "password" ? "Welcome back" : "Verify identity"}
          </h2>
          <p style={{ fontSize: 14, color: T.t2, marginBottom: 32 }}>
            {step === "email" ? "Enter your email to continue" : step === "password" ? (email || "Enter your password") : "Enter the 6-digit code from your authenticator"}
          </p>
          {step === "email" && <Field label="Email" value={email} onChange={setEmail} placeholder="jay@karani.co" />}
          {step === "password" && <Field label="Password" value={pw} onChange={setPw} type="password" placeholder="••••••••" />}
          {step === "mfa" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "block" }}>Verification Code</label>
              <div style={{ display: "flex", gap: 8 }}>
                {mfa.map((d, i) => (
                  <input key={i} id={`mfa-${i}`} maxLength={1} value={d} style={{ width: 48, height: 56, textAlign: "center", fontSize: 22, fontFamily: FM, fontWeight: 600, color: T.t1, borderRadius: 12, border: `1.5px solid ${d ? T.ch + "40" : T.border}`, backgroundColor: T.card, outline: "none" }}
                    onChange={e => { const v = e.target.value.replace(/\D/g, ""); const n = [...mfa]; n[i] = v; setMfa(n); if (v && i < 5) document.getElementById(`mfa-${i + 1}`)?.focus(); }} />
                ))}
              </div>
            </div>
          )}
          <button onClick={go} disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${T.ch}, ${T.chL})`, color: "#FFFDF5", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: FB, opacity: loading ? 0.6 : 1, marginTop: 8 }}>
            {loading ? "Signing in..." : step === "mfa" ? "Verify" : "Continue"}
          </button>
          {step === "email" && <>
            <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "24px 0" }}>
              <div style={{ flex: 1, height: 1, backgroundColor: T.border }} /><span style={{ fontSize: 12, color: T.t4 }}>or</span><div style={{ flex: 1, height: 1, backgroundColor: T.border }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {["Google", "Apple"].map(p => <button key={p} onClick={go} style={{ flex: 1, padding: "11px", borderRadius: 12, border: `1px solid ${T.border}`, backgroundColor: T.card, fontSize: 13, color: T.t2, fontWeight: 500, cursor: "pointer", fontFamily: FB }}>{p}</button>)}
            </div>
          </>}
          {step !== "email" && <button onClick={() => setStep(step === "mfa" ? "password" : "email")} style={{ background: "none", border: "none", color: T.ch, fontSize: 13, marginTop: 16, cursor: "pointer", fontWeight: 500, fontFamily: FB }}>← Back</button>}
        </div>
      </div>
    </div>
  );
}

/* ═══ SIDEBAR ═══ */
function Sidebar({ page, setPage, budget, spent, onLogout }) {
  const pct = spent / budget;
  const isOver = spent > budget;
  const rem = budget - spent;
  const nav = [
    { id: "dashboard", icon: IC.home, label: "Dashboard" },
    { id: "business", icon: IC.biz, label: "Business" },
    { id: "bills", icon: IC.bill, label: "Bills" },
    { id: "accounts", icon: IC.bank, label: "Accounts" },
    { id: "analytics", icon: IC.chart, label: "Analytics" },
    { id: "settings", icon: IC.gear, label: "Settings" },
  ];
  return (
    <div style={{ width: 256, flexShrink: 0, backgroundColor: T.card, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", padding: "20px 0" }}>
      <div style={{ padding: "0 20px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${T.ch}, ${T.chL})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#FFFDF5", fontFamily: FH }}>P</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.t1, letterSpacing: "0.06em" }}>PocketPilot</span>
      </div>

      {/* BIG today status — hero element */}
      <div style={{ margin: "0 14px 20px", padding: "20px 16px", borderRadius: 16, backgroundColor: T.bg, border: `1px solid ${T.border}`, cursor: "pointer" }} onClick={() => setPage("dashboard")}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ position: "relative", width: 100, height: 100 }}>
            <Arc pct={pct} size={100} sw={5} trackColor={T.bg3} fillColor={T.ch} overColor={T.red} gapDeg={70} />
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: isOver ? T.red : T.t1, fontFamily: FH }}>
                {isOver ? `-$${Math.abs(rem)}` : `$${rem}`}
              </span>
              <span style={{ fontSize: 9, color: T.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 1 }}>{isOver ? "over" : "left"}</span>
            </div>
          </div>
          <span style={{ fontSize: 12, color: T.t3 }}>of ${budget} daily budget</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, backgroundColor: T.bg3, marginTop: 12 }}>
          <div style={{ height: 4, borderRadius: 2, width: `${Math.min(pct, 1) * 100}%`, backgroundColor: isOver ? T.red : T.ch, transition: "width 0.6s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 11, color: T.t3 }}>Spent: <span style={{ color: T.t1, fontFamily: FM, fontWeight: 500 }}>${spent}</span></span>
          <span style={{ fontSize: 11, color: T.t3 }}>Pool: <span style={{ color: T.ch, fontFamily: FM, fontWeight: 500 }}>$906</span></span>
        </div>
      </div>

      <div style={{ flex: 1, padding: "0 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: FB, width: "100%", textAlign: "left",
            backgroundColor: page === n.id ? T.chM : "transparent", color: page === n.id ? T.ch : T.t2, fontSize: 13, fontWeight: page === n.id ? 600 : 400, transition: "all 0.12s",
          }}>
            <span style={{ display: "flex", opacity: page === n.id ? 1 : 0.5 }}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 14, border: `1.5px solid ${T.ch}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: T.ch, fontFamily: FH }}>J</div>
          <span style={{ fontSize: 12, color: T.t2 }}>Jay</span>
        </div>
        <button onClick={onLogout} title="Sign out" style={{ background: "none", border: "none", cursor: "pointer", color: T.t4, display: "flex", padding: 4 }}>{IC.logout}</button>
      </div>
    </div>
  );
}

/* ═══ DASHBOARD ═══ */
function DashboardPage({ nav, bills, togglePaid }) {
  const unpaid = bills.filter(b => !b.paid).reduce((s, b) => s + b.amount, 0);
  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
      <div><h1 style={{ fontSize: 26, fontWeight: 700, color: T.t1, fontFamily: FH }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: T.t3, marginTop: 4 }}>March 1, 2026 · Saturday</p></div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
      {[
        { l: "Month Pool", v: "$906", c: T.ch, s: "Income − bills − savings", click: "analytics" },
        { l: "Deposited", v: "$3,800", c: T.ok, s: "Karani + Ilai this month", click: "analytics" },
        { l: "Bills Due", v: `$${Math.round(unpaid)}`, c: T.warn, s: `${bills.filter(b => !b.paid).length} remaining`, click: "bills" },
        { l: "Savings", v: "$800", c: T.t1, s: "$800/mo target", click: "settings" },
      ].map((s, i) => (
        <div key={i} onClick={() => nav(s.click)} style={{ backgroundColor: T.card, borderRadius: 14, padding: "18px 20px", border: `1px solid ${T.border}`, boxShadow: T.sh, cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = T.shH; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = T.sh; }}>
          <div style={{ fontSize: 10, color: T.t3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.l}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: s.c, fontFamily: FH }}>{s.v}</div>
          <div style={{ fontSize: 11, color: T.t4, marginTop: 6 }}>{s.s}</div>
        </div>
      ))}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ backgroundColor: T.card, borderRadius: 14, padding: "20px 22px", border: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.t1 }}>Today's Transactions</span>
          <button onClick={() => nav("analytics")} style={{ background: "none", border: "none", fontSize: 12, color: T.ch, fontWeight: 500, cursor: "pointer", fontFamily: FB }}>View all →</button>
        </div>
        {TODAY_TXS.map((tx, i) => (
          <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: T.t1 }}>{tx.m}</span>
                {!tx.c && <Badge color={T.ch}>New</Badge>}
                {tx.e && tx.e !== "personal" && <Badge color="#777" bg="#77777712">Biz</Badge>}
              </div>
              <span style={{ fontSize: 12, color: T.t3, display: "block", marginTop: 2 }}>{tx.c || "Uncategorized"} · {tx.t}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: T.t1, fontFamily: FM }}>-${tx.a.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: T.card, borderRadius: 14, padding: "20px 22px", border: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.t1 }}>Upcoming Bills</span>
          <button onClick={() => nav("bills")} style={{ background: "none", border: "none", fontSize: 12, color: T.ch, fontWeight: 500, cursor: "pointer", fontFamily: FB }}>Manage →</button>
        </div>
        {bills.filter(b => !b.paid).slice(0, 4).map((b, i) => (
          <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div onClick={() => togglePaid(b.id)} style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${T.warn}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }} />
              <div><span style={{ fontSize: 13, fontWeight: 500, color: T.t1 }}>{b.name}</span>
                <span style={{ fontSize: 12, color: T.t3, display: "block", marginTop: 1 }}>Due {b.due}</span></div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: T.warn, fontFamily: FM }}>${b.amount}</span>
          </div>
        ))}
        {unpaid > 0 && (
          <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, backgroundColor: T.chG, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: T.t2 }}>Transfer <span style={{ color: T.ch, fontWeight: 600 }}>${Math.round(unpaid)}</span> to bills</span>
            <Btn small primary onClick={() => {}}>Done</Btn>
          </div>
        )}
      </div>
    </div>
  </div>;
}

/* ═══ BUSINESS ═══ */
function BusinessPage({ bizTxs, setBizTxs }) {
  const [entity, setEntity] = useState("all");
  const [search, setSearch] = useState("");
  const [editRat, setEditRat] = useState(null);
  const [ratText, setRatText] = useState("");

  const filtered = bizTxs.filter(t => (entity === "all" || t.entity === entity) && (!search || t.merchant.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase())));
  const total = filtered.reduce((s, t) => s + t.amount, 0);
  const rcpt = filtered.filter(t => t.receipt).length;
  const noRat = filtered.filter(t => !t.rationale).length;

  const saveRat = (id) => { setBizTxs(prev => prev.map(t => t.id === id ? { ...t, rationale: ratText } : t)); setEditRat(null); };
  const toggleReceipt = (id) => { setBizTxs(prev => prev.map(t => t.id === id ? { ...t, receipt: !t.receipt } : t)); };

  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
      <div><h1 style={{ fontSize: 26, fontWeight: 700, color: T.t1, fontFamily: FH }}>Business Center</h1>
        <p style={{ fontSize: 14, color: T.t3, marginTop: 4 }}>Tax compliance, deductions, and audit readiness</p></div>
      <Btn primary onClick={() => alert("Export will generate CSV with all business expenses, categories, entities, rationale, and receipt status for your accountant.")}>Export for Accountant</Btn>
    </div>
    <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
      {[["all", "All Entities"], ["trading", "Karani Markets"], ["creative", "Ilai Collective"]].map(([k, l]) => (
        <button key={k} onClick={() => setEntity(k)} style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, cursor: "pointer", fontFamily: FB, border: entity === k ? `1.5px solid ${T.ch}` : `1px solid ${T.border}`, backgroundColor: entity === k ? T.chM : "transparent", color: entity === k ? T.ch : T.t3, fontWeight: entity === k ? 600 : 400 }}>{l}</button>
      ))}
      <div style={{ marginLeft: "auto" }}><SearchBar value={search} onChange={setSearch} placeholder="Search expenses..." /></div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
      {[
        { l: "Total Deductible", v: `$${Math.round(total).toLocaleString()}`, c: T.ch },
        { l: "Audit Ready", v: `${filtered.length ? Math.round(rcpt / filtered.length * 100) : 0}%`, c: rcpt / (filtered.length || 1) > 0.85 ? T.ok : T.warn },
        { l: "Missing Receipts", v: String(filtered.length - rcpt), c: filtered.length - rcpt > 0 ? T.red : T.ok },
        { l: "No Rationale", v: String(noRat), c: noRat > 0 ? T.warn : T.ok },
      ].map((s, i) => (
        <div key={i} style={{ backgroundColor: T.card, borderRadius: 14, padding: "18px 20px", border: `1px solid ${T.border}` }}>
          <Stat label={s.l} value={s.v} color={s.c} />
        </div>
      ))}
    </div>
    <div style={{ backgroundColor: T.card, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.t1 }}>Business Expenses ({filtered.length})</span>
      </div>
      {filtered.length === 0 && <div style={{ padding: "40px 20px", textAlign: "center", color: T.t3 }}>No expenses match your search.</div>}
      {filtered.map((tx, i) => (
        <div key={tx.id} style={{ padding: "14px 20px", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 2, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: T.t1 }}>{tx.merchant}</div>
              <div style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>{tx.category} · {tx.date}</div>
            </div>
            <div style={{ width: 100 }}><Badge color={tx.entity === "trading" ? T.t2 : T.ch} bg={tx.entity === "trading" ? T.bg2 : T.chM}>{tx.entity === "trading" ? "Karani" : "Ilai"}</Badge></div>
            <span style={{ width: 90, fontSize: 13, fontWeight: 500, color: T.t1, fontFamily: FM }}>${tx.amount.toFixed(2)}</span>
            <div style={{ width: 90 }}>
              {tx.receipt
                ? <button onClick={() => toggleReceipt(tx.id)} style={{ fontSize: 12, color: T.ok, fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: FB }}>✓ Receipt</button>
                : <button onClick={() => toggleReceipt(tx.id)} style={{ fontSize: 12, color: T.red, fontWeight: 500, background: T.redM, border: `1px solid ${T.red}20`, borderRadius: 8, padding: "3px 10px", cursor: "pointer", fontFamily: FB }}>+ Receipt</button>}
            </div>
            <button onClick={() => { setEditRat(editRat === tx.id ? null : tx.id); setRatText(tx.rationale || ""); }} style={{ fontSize: 12, color: tx.rationale ? T.t2 : T.warn, background: "none", border: "none", cursor: "pointer", fontFamily: FB, fontWeight: 500, width: 80, textAlign: "right" }}>
              {tx.rationale ? "Edit" : "+ Rationale"}
            </button>
          </div>
          {tx.rationale && editRat !== tx.id && (
            <div style={{ marginTop: 8, padding: "8px 12px", backgroundColor: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: T.t4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Business Purpose: </span>
              <span style={{ fontSize: 12, color: T.t2 }}>{tx.rationale}</span>
            </div>
          )}
          {editRat === tx.id && (
            <div style={{ marginTop: 8, padding: "12px", backgroundColor: T.bg, borderRadius: 10, border: `1px solid ${T.ch}15` }}>
              <textarea value={ratText} onChange={e => setRatText(e.target.value)} rows={2} placeholder="Why was this expense necessary for business?"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.card, fontSize: 13, color: T.t1, fontFamily: FB, resize: "vertical", outline: "none", lineHeight: 1.5 }} />
              <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                <Btn small onClick={() => setEditRat(null)}>Cancel</Btn>
                <Btn small primary onClick={() => saveRat(tx.id)}>Save</Btn>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>;
}

/* ═══ BILLS ═══ */
function BillsPage({ bills, setBills, togglePaid }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | "add" | bill object
  const [form, setForm] = useState({ name: "", amount: "", due: "", freq: "Monthly", vendor: "", cat: "", account: "Chase Checking", entity: "" });

  const openEdit = (b) => { setForm({ name: b.name, amount: String(b.amount), due: b.due, freq: b.freq, vendor: b.vendor, cat: b.cat, account: b.account, entity: b.entity || "" }); setModal(b); };
  const openAdd = () => { setForm({ name: "", amount: "", due: "", freq: "Monthly", vendor: "", cat: "", account: "Chase Checking", entity: "" }); setModal("add"); };
  const save = () => {
    const rec = { ...form, amount: parseFloat(form.amount) || 0 };
    if (modal === "add") {
      setBills(p => [...p, { ...rec, id: Date.now(), paid: false }]);
    } else {
      setBills(p => p.map(b => b.id === modal.id ? { ...b, ...rec, amount: parseFloat(form.amount) || b.amount } : b));
    }
    setModal(null);
  };
  const del = () => { setBills(p => p.filter(b => b.id !== modal.id)); setModal(null); };

  const total = bills.reduce((s, b) => s + b.amount, 0);
  const paid = bills.filter(b => b.paid).reduce((s, b) => s + b.amount, 0);
  const vis = bills.filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.vendor.toLowerCase().includes(search.toLowerCase()));
  const personal = vis.filter(b => !b.entity);
  const business = vis.filter(b => b.entity);

  const BillRow = ({ b }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
      <div onClick={() => togglePaid(b.id)} style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${b.paid ? T.ok : T.warn}`, backgroundColor: b.paid ? T.ok : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
        {b.paid && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
      </div>
      <div style={{ flex: 2, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: T.t1, textDecoration: b.paid ? "line-through" : "none", opacity: b.paid ? 0.5 : 1 }}>{b.name}</span>
        <span style={{ fontSize: 12, color: T.t3, display: "block", marginTop: 1 }}>{b.vendor || b.cat} · Due {b.due}</span>
      </div>
      <span style={{ fontSize: 13, color: T.t1, fontFamily: FM, fontWeight: 500, width: 80 }}>${b.amount.toFixed(2)}</span>
      <span style={{ fontSize: 12, color: T.t3, width: 60 }}>{b.freq}</span>
      <span style={{ fontSize: 12, color: T.t3, width: 110 }}>{b.account}</span>
      <button onClick={() => openEdit(b)} style={{ background: "none", border: "none", fontSize: 12, color: T.ch, cursor: "pointer", fontFamily: FB, fontWeight: 500 }}>Edit</button>
    </div>
  );

  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
      <div><h1 style={{ fontSize: 26, fontWeight: 700, color: T.t1, fontFamily: FH }}>Recurring Bills</h1>
        <p style={{ fontSize: 14, color: T.t3, marginTop: 4 }}>Manage fixed obligations and subscriptions</p></div>
      <Btn primary onClick={openAdd}>+ Add Bill</Btn>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
      {[
        { l: "Monthly Total", v: `$${Math.round(total).toLocaleString()}`, s: `${bills.length} bills` },
        { l: "Paid", v: `$${Math.round(paid).toLocaleString()}`, c: T.ok, s: `${bills.filter(b => b.paid).length} of ${bills.length}` },
        { l: "Still Due", v: `$${Math.round(total - paid)}`, c: T.warn, s: `${bills.filter(b => !b.paid).length} remaining` },
      ].map((s, i) => <div key={i} style={{ backgroundColor: T.card, borderRadius: 14, padding: "18px 20px", border: `1px solid ${T.border}` }}><Stat label={s.l} value={s.v} color={s.c} sub={s.s} /></div>)}
    </div>
    <div style={{ marginBottom: 20 }}><SearchBar value={search} onChange={setSearch} placeholder="Search bills..." /></div>

    {personal.length > 0 && <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Personal & Household</div>
      <div style={{ backgroundColor: T.card, borderRadius: 14, padding: "4px 20px", border: `1px solid ${T.border}` }}>
        {personal.map((b, i) => <div key={b.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}><BillRow b={b} /></div>)}
      </div>
    </div>}
    {business.length > 0 && <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Business Subscriptions</div>
      <div style={{ backgroundColor: T.card, borderRadius: 14, padding: "4px 20px", border: `1px solid ${T.border}` }}>
        {business.map((b, i) => <div key={b.id} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}><BillRow b={b} /></div>)}
      </div>
    </div>}
    {vis.length === 0 && <div style={{ padding: "40px", textAlign: "center", color: T.t3 }}>No bills match your search.</div>}

    <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "add" ? "Add New Bill" : "Edit Bill"}>
      <Field label="Name" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="e.g. Car Insurance" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Amount" value={form.amount} onChange={v => setForm(p => ({ ...p, amount: v }))} type="money" placeholder="187.00" />
        <Field label="Due Date" value={form.due} onChange={v => setForm(p => ({ ...p, due: v }))} placeholder="20th" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Frequency" value={form.freq} onChange={v => setForm(p => ({ ...p, freq: v }))} options={["Monthly", "Quarterly", "Annual"]} />
        <Field label="Entity" value={form.entity} onChange={v => setForm(p => ({ ...p, entity: v }))} options={["", "trading", "creative"]} />
      </div>
      <Field label="Vendor" value={form.vendor} onChange={v => setForm(p => ({ ...p, vendor: v }))} placeholder="GEICO" />
      <Field label="Pay From" value={form.account} onChange={v => setForm(p => ({ ...p, account: v }))} options={["Chase Checking", "Revolut Business"]} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {modal !== "add" && <Btn danger onClick={del}>Delete Bill</Btn>}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <Btn onClick={() => setModal(null)}>Cancel</Btn>
          <Btn primary onClick={save}>{modal === "add" ? "Add Bill" : "Save Changes"}</Btn>
        </div>
      </div>
    </Modal>
  </div>;
}

/* ═══ ACCOUNTS ═══ */
function AccountsPage() {
  const [showConnect, setShowConnect] = useState(false);
  const totalA = ACCTS.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const totalD = ACCTS.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0);

  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
      <div><h1 style={{ fontSize: 26, fontWeight: 700, color: T.t1, fontFamily: FH }}>Connected Accounts</h1>
        <p style={{ fontSize: 14, color: T.t3, marginTop: 4 }}>Manage bank connections and sync settings</p></div>
      <Btn primary onClick={() => setShowConnect(true)}>+ Connect Account</Btn>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
      {[
        { l: "Total Assets", v: `$${Math.round(totalA).toLocaleString()}`, c: T.ok },
        { l: "Total Debt", v: `-$${Math.round(Math.abs(totalD)).toLocaleString()}`, c: T.red },
        { l: "Net Position", v: `$${Math.round(totalA + totalD).toLocaleString()}` },
      ].map((s, i) => <div key={i} style={{ backgroundColor: T.card, borderRadius: 14, padding: "18px 20px", border: `1px solid ${T.border}` }}><Stat label={s.l} value={s.v} color={s.c} /></div>)}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
      {ACCTS.map(a => (
        <div key={a.id} style={{ backgroundColor: T.card, borderRadius: 14, padding: "20px 22px", border: `1px solid ${T.border}`, boxShadow: T.sh }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div><div style={{ fontSize: 15, fontWeight: 600, color: T.t1 }}>{a.name}</div><div style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>{a.institution} · •••• {a.last4}</div></div>
            <Badge color={T.ok} bg={T.okM}>Connected</Badge>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: a.balance < 0 ? T.red : T.t1, fontFamily: FH, marginBottom: 14 }}>
            {a.balance < 0 ? "-" : ""}${Math.abs(a.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: T.ok }} /><span style={{ fontSize: 12, color: T.t3 }}>Synced {a.lastSync}</span></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ fontSize: 12, color: T.ch, background: "none", border: "none", cursor: "pointer", fontFamily: FB, fontWeight: 500 }}>Refresh</button>
              <button style={{ fontSize: 12, color: T.t4, background: "none", border: "none", cursor: "pointer", fontFamily: FB }}>Disconnect</button>
            </div>
          </div>
        </div>
      ))}
    </div>
    <Modal open={showConnect} onClose={() => setShowConnect(false)} title="Connect Account">
      <p style={{ fontSize: 14, color: T.t2, marginBottom: 24, lineHeight: 1.6 }}>Choose how to connect your financial account. Most US banks are supported through Plaid.</p>
      {[
        { n: "Plaid", d: "Chase, BofA, Amex, Marcus, and 10,000+ institutions" },
        { n: "Revolut Business API", d: "Direct connection for Revolut Business accounts" },
        { n: "Manual Entry", d: "Log transactions manually for cash or unsupported accounts" },
      ].map((o, i) => (
        <div key={i} onClick={() => { setShowConnect(false); alert(`${o.n} connection flow would open here.`); }} style={{ padding: "16px 18px", borderRadius: 12, border: `1px solid ${T.border}`, marginBottom: 10, cursor: "pointer", transition: "all 0.1s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.ch + "40"; e.currentTarget.style.backgroundColor = T.chG; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.backgroundColor = "transparent"; }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 3 }}>{o.n}</div>
          <div style={{ fontSize: 12, color: T.t3 }}>{o.d}</div>
        </div>
      ))}
    </Modal>
  </div>;
}

/* ═══ ANALYTICS ═══ */
function AnalyticsPage() {
  const [hov, setHov] = useState(null);
  const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
  const spending = [2800, 3100, 2600, 3400, 2900, 3200];
  const income = [8800, 9200, 8600, 9100, 8900, 9400];
  const mx = Math.max(...income);

  return <div>
    <div style={{ marginBottom: 28 }}><h1 style={{ fontSize: 26, fontWeight: 700, color: T.t1, fontFamily: FH }}>Analytics</h1><p style={{ fontSize: 14, color: T.t3, marginTop: 4 }}>Trends, patterns, and insights across time</p></div>
    <div style={{ backgroundColor: T.card, borderRadius: 14, padding: "22px 24px", border: `1px solid ${T.border}`, marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 20 }}>Income vs Spending · 6 Months</div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", height: 160, padding: "0 4px" }}>
        {months.map((m, i) => (
          <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative" }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
            {hov === i && <div style={{ position: "absolute", top: -44, backgroundColor: T.t1, color: "#fff", padding: "5px 10px", borderRadius: 8, fontSize: 11, fontFamily: FM, whiteSpace: "nowrap", zIndex: 5 }}>
              In: ${(income[i] / 1000).toFixed(1)}k · Out: ${(spending[i] / 1000).toFixed(1)}k
            </div>}
            <div style={{ width: "100%", display: "flex", gap: 3, alignItems: "flex-end", height: 130 }}>
              <div style={{ flex: 1, borderRadius: "5px 5px 0 0", height: (income[i] / mx) * 130, backgroundColor: T.ok + "50", transition: "height 0.4s ease" }} />
              <div style={{ flex: 1, borderRadius: "5px 5px 0 0", height: (spending[i] / mx) * 130, background: `linear-gradient(180deg, ${T.ch}, ${T.chL})`, transition: "height 0.4s ease" }} />
            </div>
            <span style={{ fontSize: 11, color: hov === i ? T.ch : T.t4, fontWeight: hov === i ? 600 : 400 }}>{m}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 20, marginTop: 14, justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: T.ok + "50" }} /><span style={{ fontSize: 12, color: T.t3 }}>Income</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: T.ch }} /><span style={{ fontSize: 12, color: T.t3 }}>Spending</span></div>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ backgroundColor: T.card, borderRadius: 14, padding: "22px", border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 4 }}>Savings Progress</div>
        <div style={{ fontSize: 12, color: T.t3, marginBottom: 16 }}>$800/month target</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}><span style={{ fontSize: 30, fontWeight: 700, color: T.ok, fontFamily: FH }}>$4,200</span><span style={{ fontSize: 13, color: T.t3 }}>saved YTD</span></div>
        <div style={{ height: 6, borderRadius: 3, backgroundColor: T.bg3, marginBottom: 8 }}><div style={{ height: 6, borderRadius: 3, width: "87.5%", backgroundColor: T.ok }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, color: T.t3 }}>$4,200 of $4,800</span><span style={{ fontSize: 12, color: T.ok, fontWeight: 600 }}>87.5%</span></div>
      </div>
      <div style={{ backgroundColor: T.card, borderRadius: 14, padding: "22px", border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 4 }}>Daily Average</div>
        <div style={{ fontSize: 12, color: T.t3, marginBottom: 16 }}>Last 30 days</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}><span style={{ fontSize: 30, fontWeight: 700, color: T.t1, fontFamily: FH }}>$103</span><span style={{ fontSize: 13, color: T.ok }}>↓ 8% vs prior</span></div>
        {[["Under budget days", "22 of 28", T.ok], ["Over budget days", "6 of 28", T.red], ["Longest under streak", "8 days", T.ch], ["Avg overage", "$18", T.t2]].map(([l, v, c], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 12, color: T.t3 }}>{l}</span><span style={{ fontSize: 12, color: c, fontWeight: 500, fontFamily: FM }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: T.card, borderRadius: 14, padding: "22px", border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 14 }}>Top Categories · Feb</div>
        {[["Food & Drink", 847, 100], ["Software", 420, 50], ["Transport", 312, 37], ["Groceries", 289, 34], ["Entertainment", 156, 18]].map(([cat, amt, pct], i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 13, color: T.t1 }}>{cat}</span><span style={{ fontSize: 12, color: T.t2, fontFamily: FM }}>${amt}</span></div>
            <div style={{ height: 4, borderRadius: 2, backgroundColor: T.bg3 }}><div style={{ height: 4, borderRadius: 2, width: `${pct}%`, background: `linear-gradient(90deg, ${T.ch}, ${T.chL})` }} /></div>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: T.card, borderRadius: 14, padding: "22px", border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 4 }}>Tax Summary</div>
        <div style={{ fontSize: 12, color: T.t3, marginBottom: 16 }}>2026 YTD</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}><span style={{ fontSize: 30, fontWeight: 700, color: T.ch, fontFamily: FH }}>$7,500</span><span style={{ fontSize: 13, color: T.t3 }}>deductible</span></div>
        {[["Karani Markets LLC", "$4,120", "Trading · Sched C"], ["Ilai Collective LLC", "$3,380", "Creative · Sched C"]].map(([n, a, d], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: `1px solid ${T.border}` }}>
            <div><span style={{ fontSize: 13, fontWeight: 500, color: T.t1 }}>{n}</span><span style={{ fontSize: 12, color: T.t3, display: "block", marginTop: 1 }}>{d}</span></div>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.ch, fontFamily: FM }}>{a}</span>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

/* ═══ SETTINGS ═══ */
function SettingsPage() {
  const [income, setIncome] = useState({ karaniDaily: "400", ilaiBi: "3000", savingsGoal: "800" });
  const est = (parseFloat(income.karaniDaily) || 0) * 22 + (parseFloat(income.ilaiBi) || 0) * 2;
  const totalBills = 2738;
  const daily = Math.round((est - totalBills - (parseFloat(income.savingsGoal) || 0)) / 31);

  return <div>
    <div style={{ marginBottom: 28 }}><h1 style={{ fontSize: 26, fontWeight: 700, color: T.t1, fontFamily: FH }}>Settings</h1><p style={{ fontSize: 14, color: T.t3, marginTop: 4 }}>Configure income, savings, and preferences</p></div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div style={{ backgroundColor: T.card, borderRadius: 14, padding: "24px", border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 20 }}>Income Configuration</div>
        <Field label="Karani Markets — Daily Avg" value={income.karaniDaily} onChange={v => setIncome(p => ({ ...p, karaniDaily: v }))} type="money" placeholder="400" />
        <Field label="Ilai Collective — Biweekly" value={income.ilaiBi} onChange={v => setIncome(p => ({ ...p, ilaiBi: v }))} type="money" placeholder="3000" />
        <div style={{ padding: "12px 14px", borderRadius: 10, backgroundColor: T.bg, marginTop: 8 }}>
          <span style={{ fontSize: 12, color: T.t3 }}>Estimated Monthly: </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.ch, fontFamily: FM }}>${est.toLocaleString()}</span>
          <span style={{ fontSize: 12, color: T.t4, display: "block", marginTop: 4 }}>({income.karaniDaily} × 22 trading days) + ({income.ilaiBi} × 2 pay periods)</span>
        </div>
      </div>
      <div style={{ backgroundColor: T.card, borderRadius: 14, padding: "24px", border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 20 }}>Budget Derivation</div>
        <Field label="Monthly Savings Goal" value={income.savingsGoal} onChange={v => setIncome(p => ({ ...p, savingsGoal: v }))} type="money" placeholder="800" />
        <div style={{ padding: "16px", borderRadius: 12, backgroundColor: T.bg, marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.ch, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Daily Budget Calculation</div>
          {[
            ["Est. Monthly Income", `$${est.toLocaleString()}`],
            ["− Total Bills", `-$${totalBills.toLocaleString()}`],
            ["− Savings Goal", `-$${parseFloat(income.savingsGoal) || 0}`],
            ["÷ 31 days", ""],
          ].map(([l, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span style={{ fontSize: 13, color: T.t2 }}>{l}</span>
              <span style={{ fontSize: 13, color: T.t1, fontFamily: FM }}>{v}</span>
            </div>
          ))}
          <div style={{ borderTop: `2px solid ${T.ch}30`, marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.t1 }}>Daily Budget</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: T.ch, fontFamily: FH }}>${daily}</span>
          </div>
        </div>
      </div>
      <div style={{ backgroundColor: T.card, borderRadius: 14, padding: "24px", border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 20 }}>Business Entities</div>
        {[
          { n: "Karani Markets LLC", t: "Trading · Schedule C", e: "ES Mini futures scalping, trading tools, market data" },
          { n: "Ilai Collective LLC", t: "Creative · Schedule C", e: "Podcast production, social media, content creation" },
        ].map((ent, i) => (
          <div key={i} style={{ padding: "14px 16px", borderRadius: 10, backgroundColor: T.bg, marginBottom: 10, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.t1 }}>{ent.n}</div>
            <div style={{ fontSize: 12, color: T.ch, marginTop: 2 }}>{ent.t}</div>
            <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>{ent.e}</div>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: T.card, borderRadius: 14, padding: "24px", border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 20 }}>Preferences</div>
        {[
          ["Tax Year", "2026"],
          ["Currency", "USD"],
          ["Timezone", "Auto (follows device)"],
          ["Notifications", "Enabled"],
          ["Quiet Hours", "10pm – 7am local"],
        ].map(([l, v], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <span style={{ fontSize: 13, color: T.t2 }}>{l}</span>
            <span style={{ fontSize: 13, color: T.t1, fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

/* ═══ MAIN APP ═══ */
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [bills, setBills] = useState(initBills);
  const [bizTxs, setBizTxs] = useState(initBizTxs);
  const budget = 115, spent = 127;
  const togglePaid = (id) => setBills(p => p.map(b => b.id === id ? { ...b, paid: !b.paid } : b));

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  return <>
    <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,700;0,6..96,900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
    <style>{`
      * { box-sizing: border-box; margin: 0; padding: 0; }
      ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${T.t4}40; border-radius: 3px; }
      input::placeholder, textarea::placeholder { color: ${T.t4}; }
      input:focus, textarea:focus { border-color: ${T.ch}50 !important; outline: none; }
      select:focus { border-color: ${T.ch}50 !important; outline: none; }
    `}</style>
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: T.bg, fontFamily: FB }}>
      <Sidebar page={page} setPage={setPage} budget={budget} spent={spent} onLogout={() => setLoggedIn(false)} />
      <div style={{ flex: 1, padding: "28px 36px", overflowY: "auto", maxHeight: "100vh" }}>
        {page === "dashboard" && <DashboardPage nav={setPage} bills={bills} togglePaid={togglePaid} />}
        {page === "business" && <BusinessPage bizTxs={bizTxs} setBizTxs={setBizTxs} />}
        {page === "bills" && <BillsPage bills={bills} setBills={setBills} togglePaid={togglePaid} />}
        {page === "accounts" && <AccountsPage />}
        {page === "analytics" && <AnalyticsPage />}
        {page === "settings" && <SettingsPage />}
      </div>
    </div>
  </>;
}
