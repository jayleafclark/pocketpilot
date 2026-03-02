import { useState } from "react";

const FH = '"Bodoni Moda","Playfair Display",Georgia,serif';
const FB = '"DM Sans",-apple-system,system-ui,sans-serif';
const FM = '"JetBrains Mono","SF Mono",monospace';

const T = {
  bg: "#F8F7F4", bg2: "#F1EFE9",
  card: "#FFFFFF",
  t1: "#1A1915", t2: "#6B6960", t3: "#9E9B92", t4: "#C4C1B9",
  ch: "#B09049", chL: "#CCAA5C",
  chM: "rgba(176,144,73,0.07)", chG: "rgba(176,144,73,0.035)",
  ok: "#5D8C5A", okM: "rgba(93,140,90,0.07)",
  warn: "#C4873B",
  red: "#B85C5C",
  border: "rgba(0,0,0,0.055)",
};

function Arc({ pct, size, sw = 4 }) {
  const r = (size - sw * 2) / 2, cx = size / 2, cy = size / 2, gap = 70;
  const sa = 90 + gap / 2, sweep = 360 - gap;
  const fill = Math.min(pct, 1), isOver = pct > 1;
  const pol = (d) => { const rad = (d - 90) * Math.PI / 180; return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]; };
  const arc = (a, b) => { const s = Math.min(b - a, 359.5); if (s <= 0) return ""; const [x1, y1] = pol(a); const [x2, y2] = pol(a + s); return `M ${x1} ${y1} A ${r} ${r} 0 ${s > 180 ? 1 : 0} 1 ${x2} ${y2}`; };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={arc(sa, sa + sweep)} fill="none" stroke={T.bg2} strokeWidth={sw} strokeLinecap="round" />
      {fill > 0 && <path d={arc(sa, sa + sweep * fill)} fill="none" stroke={isOver ? T.red : T.ch} strokeWidth={sw} strokeLinecap="round" />}
    </svg>
  );
}

const sections = [
  {
    id: "wake",
    time: "8:00 AM",
    title: "You Wake Up",
    icon: "☀️",
    body: "A quiet notification slides in. It tells you three things: how much you can spend today, which bills are due this week, and how your month is tracking. That's it. No charts, no lectures. Just the number you need.",
    detail: "Your daily budget isn't a number you set — it's calculated. The app takes your expected income from trading and Ilai, subtracts all your bills, subtracts your savings goal, and divides what's left by the days in the month. Today you have $115.",
    visual: "notification",
  },
  {
    id: "coffee",
    time: "9:14 AM",
    title: "You Buy Coffee",
    icon: "☕",
    body: "You tap your card. Within seconds, the app knows. A small notification confirms the charge and shows what's left. No action needed from you.",
    detail: "Behind the scenes, the app is syncing with your Revolut accounts every two hours — and listening for webhooks in between. When a new transaction appears, it automatically categorizes it based on the merchant and your past behavior. If it's not sure, it'll ask you later.",
    visual: "transaction",
  },
  {
    id: "receipt",
    time: "12:30 PM",
    title: "You Snap a Receipt",
    icon: "📸",
    body: "Lunch with a client. You take a photo of the receipt. The app reads it — merchant, amount, date — and attaches it to the transaction. You tap 'Ilai Collective' and it's filed as a business expense.",
    detail: "Google Vision reads the receipt text. Claude suggests the category and writes the business rationale for you: 'Client lunch — content strategy discussion for Ilai Collective podcast production.' That's one less thing to explain to your accountant.",
    visual: "receipt",
  },
  {
    id: "voice",
    time: "3:00 PM",
    title: "You Record a Voice Note",
    icon: "🎙️",
    body: "You're walking and remember you need to log a cash expense. You hold the mic button and say 'Twenty dollars, parking at WeWork, Ilai business.' The app transcribes it, creates the transaction, and files it under the right entity.",
    detail: "OpenAI Whisper converts your voice to text. Claude parses the text to extract the amount, merchant, and entity. You can review and edit if needed, but it usually gets it right.",
    visual: "voice",
  },
  {
    id: "over",
    time: "6:45 PM",
    title: "You Go Over Budget",
    icon: "📊",
    body: "Dinner pushes you $12 over your daily budget. The arc on your home screen turns red. The app doesn't panic — it shows you the adjusted plan. If you spend $103 for the next two days instead of $115, you're back on track.",
    detail: "The arc gauge is the heart of the app. It fills clockwise as you spend. Champagne gold when you're under, red when you're over. The number in the center is always the answer to 'what am I working with right now?'",
    visual: "over",
  },
  {
    id: "desktop",
    time: "Evening",
    title: "You Sit Down at the Desktop",
    icon: "💻",
    body: "This is where the deeper work happens. Review business expenses, make sure every one has a receipt and a rationale. Check which bills are paid. Run the numbers before the end of the month. Export everything to a CSV for your accountant.",
    detail: "The desktop isn't a copy of the phone app — it's built for a different posture. The phone is for quick glances and taps throughout the day. The desktop is for sitting down and doing the business side: tax prep, bill management, account configuration, and analytics.",
    visual: "desktop",
  },
  {
    id: "ask",
    time: "Anytime",
    title: "You Ask a Question",
    icon: "💬",
    body: "Type or tap 'Ask' and talk to the app like you'd talk to a financial advisor. 'Am I on track to save $800 this month?' 'How much have I spent on software across both businesses?' 'What's my biggest category this week?' It knows your data and answers in plain English.",
    detail: "Claude powers this. Every question you ask includes your real budget status, recent transactions, bills, and entity info as context. It's not a generic chatbot — it's looking at your actual numbers.",
    visual: "ask",
  },
  {
    id: "sunday",
    time: "Sunday 7 PM",
    title: "Your Week in Review",
    icon: "📋",
    body: "A notification summarizes your week. Total spent, daily average, how many days you stayed under budget, longest streak. If you had a good week, it says so. Simple.",
    detail: "These notifications are designed to build awareness without creating anxiety. They come at calm times — not during trading hours, not late at night. The goal is a steady rhythm of knowing where you stand.",
    visual: "weekly",
  },
];

function PhoneFrame({ children }) {
  return (
    <div style={{ width: 220, height: 440, borderRadius: 32, border: `2px solid ${T.border}`, backgroundColor: T.bg, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.08)", flexShrink: 0, position: "relative" }}>
      <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 80, height: 22, borderRadius: 14, backgroundColor: T.t1 }} />
      <div style={{ padding: "40px 14px 14px", height: "100%", overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
}

function NotificationVisual() {
  return (
    <PhoneFrame>
      <div style={{ backgroundColor: T.card, borderRadius: 14, padding: "12px 14px", border: `1px solid ${T.border}`, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, background: `linear-gradient(135deg, ${T.ch}, ${T.chL})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 8, fontWeight: 800, color: "#FFFDF5", fontFamily: FH }}>P</span>
          </div>
          <span style={{ fontSize: 9, fontWeight: 600, color: T.t3, letterSpacing: "0.06em" }}>POCKETPILOT · 8:00 AM</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.t1, fontFamily: FB, marginBottom: 4 }}>Good morning ☀️</div>
        <div style={{ fontSize: 11, color: T.t2, lineHeight: 1.5 }}>
          Today's budget: <span style={{ color: T.ch, fontFamily: FM, fontWeight: 600 }}>$115</span>
        </div>
        <div style={{ fontSize: 11, color: T.t2, lineHeight: 1.5 }}>
          Bills this week: <span style={{ fontWeight: 500 }}>Car Insurance ($187, Wed)</span>
        </div>
        <div style={{ fontSize: 11, color: T.ok, marginTop: 4, fontWeight: 500 }}>Month pool: $906 remaining</div>
      </div>
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto" }}>
          <Arc pct={0} size={120} sw={5} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: T.t1, fontFamily: FH }}>$115</span>
            <span style={{ fontSize: 9, color: T.t3, textTransform: "uppercase", letterSpacing: "0.06em" }}>today</span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function TransactionVisual() {
  return (
    <PhoneFrame>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto" }}>
          <Arc pct={0.056} size={100} sw={4} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: T.t1, fontFamily: FH }}>$109</span>
            <span style={{ fontSize: 8, color: T.t3, textTransform: "uppercase" }}>left</span>
          </div>
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Today</div>
      {[{ m: "Blue Bottle Coffee", a: 6.40, t: "9:14 AM", c: "Food & Drink" }].map((tx, i) => (
        <div key={i} style={{ backgroundColor: T.card, borderRadius: 10, padding: "10px 12px", border: `1px solid ${T.border}`, marginBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: T.t1 }}>{tx.m}</div>
              <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>{tx.c} · {tx.t}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.t1, fontFamily: FM }}>-${tx.a.toFixed(2)}</span>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 12, backgroundColor: T.card, borderRadius: 10, padding: "10px 12px", border: `1px solid ${T.ch}20` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: `linear-gradient(135deg, ${T.ch}, ${T.chL})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 7, fontWeight: 800, color: "#FFFDF5" }}>P</span>
          </div>
          <span style={{ fontSize: 9, color: T.t3 }}>Now</span>
        </div>
        <div style={{ fontSize: 11, color: T.t2, lineHeight: 1.4 }}>
          <span style={{ fontWeight: 500, color: T.t1 }}>Blue Bottle Coffee</span> — $6.40
        </div>
        <div style={{ fontSize: 11, color: T.ch, fontWeight: 500, marginTop: 2 }}>$108.60 left today</div>
      </div>
    </PhoneFrame>
  );
}

function ReceiptVisual() {
  return (
    <PhoneFrame>
      <div style={{ backgroundColor: T.card, borderRadius: 12, padding: "14px", border: `1px solid ${T.border}`, marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.t1, marginBottom: 10 }}>Receipt Scanned ✓</div>
        <div style={{ padding: "10px 12px", backgroundColor: T.bg, borderRadius: 8, marginBottom: 10, border: `1px solid ${T.border}` }}>
          {[["Merchant", "Café Luna"], ["Amount", "$34.50"], ["Date", "Mar 1, 2026"]].map(([l, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
              <span style={{ fontSize: 10, color: T.t3 }}>{l}</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: T.t1, fontFamily: FM }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, textTransform: "uppercase", marginBottom: 6 }}>Entity</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {[["Personal", false], ["Karani", false], ["Ilai", true]].map(([l, sel]) => (
            <div key={l} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: sel ? 600 : 400, backgroundColor: sel ? T.chM : "transparent", color: sel ? T.ch : T.t3, border: `1px solid ${sel ? T.ch : T.border}` }}>{l}</div>
          ))}
        </div>
        <div style={{ padding: "8px 10px", backgroundColor: T.chG, borderRadius: 8, border: `1px solid ${T.ch}10` }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: T.ch, textTransform: "uppercase", marginBottom: 4 }}>AI Rationale</div>
          <div style={{ fontSize: 10, color: T.t2, lineHeight: 1.5 }}>Client lunch — content strategy discussion for Ilai Collective podcast production.</div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function OverBudgetVisual() {
  return (
    <PhoneFrame>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto" }}>
          <Arc pct={1.1} size={110} sw={5} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: T.red, fontFamily: FH }}>-$12</span>
            <span style={{ fontSize: 8, color: T.red, textTransform: "uppercase", fontWeight: 600 }}>over</span>
          </div>
        </div>
      </div>
      <div style={{ backgroundColor: T.card, borderRadius: 12, padding: "14px", border: `1px solid ${T.red}15` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.t1, marginBottom: 8 }}>Recovery Plan</div>
        <div style={{ fontSize: 11, color: T.t2, lineHeight: 1.6, marginBottom: 10 }}>
          Spend <span style={{ color: T.ch, fontWeight: 600, fontFamily: FM }}>$103</span> or less for the next 2 days and you're back on track.
        </div>
        <div style={{ height: 4, borderRadius: 2, backgroundColor: T.bg2 }}>
          <div style={{ height: 4, borderRadius: 2, width: "85%", backgroundColor: T.ok }} />
        </div>
        <div style={{ fontSize: 10, color: T.t3, marginTop: 6 }}>Month still 85% on track</div>
      </div>
    </PhoneFrame>
  );
}

function Visuals({ id }) {
  if (id === "notification") return <NotificationVisual />;
  if (id === "transaction") return <TransactionVisual />;
  if (id === "receipt") return <ReceiptVisual />;
  if (id === "over") return <OverBudgetVisual />;
  return null;
}

export default function App() {
  const [expanded, setExpanded] = useState(null);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,700;0,6..96,900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.bg}; }
        ::selection { background: ${T.ch}30; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px 100px", fontFamily: FB }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg, ${T.ch}, ${T.chL})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${T.ch}25` }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#FFFDF5", fontFamily: FH }}>P</span>
            </div>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 700, color: T.t1, fontFamily: FH, lineHeight: 1.2, marginBottom: 16 }}>
            How PocketPilot Works
          </h1>
          <p style={{ fontSize: 16, color: T.t2, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            One question, answered every time you look at it: <em style={{ color: T.ch, fontStyle: "normal", fontWeight: 600 }}>what am I working with?</em>
          </p>
        </div>

        {/* The concept */}
        <div style={{ backgroundColor: T.card, borderRadius: 18, padding: "32px 36px", border: `1px solid ${T.border}`, marginBottom: 48, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.t1, fontFamily: FH, marginBottom: 16 }}>The Idea</h2>
          <p style={{ fontSize: 15, color: T.t2, lineHeight: 1.8, marginBottom: 14 }}>
            Every month, money comes in and money goes out. Bills are fixed. Savings are fixed. What's left over is yours to spend — and PocketPilot divides that evenly across every day of the month.
          </p>
          <p style={{ fontSize: 15, color: T.t2, lineHeight: 1.8, marginBottom: 20 }}>
            That daily number is your budget. The app watches your spending in real time and tells you where you stand. Under budget? The arc stays gold. Over? It turns red and gives you a plan to get back on track. No spreadsheets, no guilt, no complexity.
          </p>
          <div style={{ display: "flex", gap: 14 }}>
            {[
              { label: "Income", value: "$14,800/mo", sub: "Trading + Ilai", color: T.ok },
              { label: "Bills + Savings", value: "$3,538/mo", sub: "Auto-deducted", color: T.warn },
              { label: "Your Pool", value: "$906/mo", sub: "What's left", color: T.ch },
              { label: "Daily Budget", value: "$115/day", sub: "Pool ÷ days", color: T.t1 },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, padding: "14px 16px", borderRadius: 12, backgroundColor: T.bg, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: FH }}>{s.value}</div>
                <div style={{ fontSize: 11, color: T.t4, marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* A Day With PocketPilot */}
        <h2 style={{ fontSize: 22, fontWeight: 700, color: T.t1, fontFamily: FH, marginBottom: 8 }}>A Day With PocketPilot</h2>
        <p style={{ fontSize: 14, color: T.t3, marginBottom: 32 }}>Walk through a typical day — from waking up to the weekly recap.</p>

        {sections.map((s, i) => (
          <div key={s.id} style={{
            marginBottom: 20,
            animation: "fadeUp 0.4s ease both",
            animationDelay: `${i * 0.04}s`,
          }}>
            <div
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              style={{
                backgroundColor: T.card, borderRadius: 16, padding: "24px 28px",
                border: `1px solid ${expanded === s.id ? T.ch + "30" : T.border}`,
                cursor: "pointer", transition: "all 0.2s",
                boxShadow: expanded === s.id ? `0 4px 20px ${T.ch}08` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 50, paddingTop: 2 }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <span style={{ fontSize: 10, color: T.ch, fontFamily: FM, fontWeight: 500, whiteSpace: "nowrap" }}>{s.time}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: T.t1, fontFamily: FH, marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: T.t2, lineHeight: 1.7 }}>{s.body}</p>
                </div>
                <div style={{ fontSize: 18, color: T.t4, transition: "transform 0.2s", transform: expanded === s.id ? "rotate(180deg)" : "none", paddingTop: 4, flexShrink: 0 }}>▾</div>
              </div>

              {expanded === s.id && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${T.border}`, display: "flex", gap: 28, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.ch, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>How It Works</div>
                    <p style={{ fontSize: 13, color: T.t3, lineHeight: 1.7 }}>{s.detail}</p>
                  </div>
                  {s.visual && <Visuals id={s.visual} />}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* What's where */}
        <div style={{ marginTop: 48, backgroundColor: T.card, borderRadius: 18, padding: "32px 36px", border: `1px solid ${T.border}` }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.t1, fontFamily: FH, marginBottom: 20 }}>What Lives Where</h2>
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ flex: 1, padding: "20px", borderRadius: 14, backgroundColor: T.bg, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>📱</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.t1, fontFamily: FH, marginBottom: 8 }}>Your Phone</div>
              <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.7 }}>
                The daily cockpit. Glance at the arc to see where you stand. Tap to categorize transactions. Snap receipts. Record voice notes. Mark bills as paid. Ask Claude a question. This is the 30-second interaction you do ten times a day.
              </div>
              <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["Home Screen Widget", "Dynamic Island", "Lock Screen", "Push Notifications"].map(f => (
                  <span key={f} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 8, backgroundColor: T.chM, color: T.ch, fontWeight: 500 }}>{f}</span>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, padding: "20px", borderRadius: 14, backgroundColor: T.bg, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>💻</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.t1, fontFamily: FH, marginBottom: 8 }}>Your Desktop</div>
              <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.7 }}>
                The command center. Review business expenses in bulk. Add rationale for tax compliance. Manage bill schedules. Configure income and savings. Run analytics. Export everything for your accountant. This is the 20-minute session you do a few times a week.
              </div>
              <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["Business Center", "Bill CRUD", "Analytics", "CSV Export", "Settings"].map(f => (
                  <span key={f} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 8, backgroundColor: T.chM, color: T.ch, fontWeight: 500 }}>{f}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* The brain */}
        <div style={{ marginTop: 20, backgroundColor: T.card, borderRadius: 18, padding: "32px 36px", border: `1px solid ${T.border}` }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.t1, fontFamily: FH, marginBottom: 20 }}>The Brain Behind It</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {[
              { icon: "🤖", name: "Claude", role: "Answers questions, categorizes transactions, writes business rationale, powers the Ask tab" },
              { icon: "🎙️", name: "Whisper", role: "Converts voice notes to text so you can log expenses on the go without typing" },
              { icon: "👁️", name: "Vision", role: "Reads receipts — pulls out the merchant, amount, and date from a photo" },
            ].map((t, i) => (
              <div key={i} style={{ padding: "18px", borderRadius: 14, backgroundColor: T.bg, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 6 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: T.t3, lineHeight: 1.6 }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 56, paddingTop: 28, borderTop: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 12, color: T.t4, fontFamily: FM }}>PocketPilot · Quiet luxury fintech · Built for one</span>
        </div>
      </div>
    </>
  );
}
