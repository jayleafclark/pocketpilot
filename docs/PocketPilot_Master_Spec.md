# PocketPilot — Master Specification v10

## Single Source of Truth
**Supersedes:** PocketPilot_Product_Spec.md, PocketPilot_Design_Spec.md
**Last Updated:** March 1, 2026
**Platform:** iOS (SwiftUI native) + Web companion
**Visual Prototypes:** PocketPilot_v10.jsx (mobile), PocketPilot_Desktop.jsx (web), PocketPilot_Notifications.jsx (native surfaces)

---

## 1. Product Vision

PocketPilot answers one question every time you open it: **"What am I working with?"**

It tracks daily spending against a derived budget, manages bill obligations, categorizes transactions for multi-entity tax compliance, and proactively guides money routing when deposits arrive. The design philosophy is "quiet luxury fintech" — calm when things are fine, urgent only when they need to be.

### Core Rules

- Every discretionary dollar spent today counts against today's budget
- Bills and savings are pre-allocated — excluded from daily spend
- Daily budget is derived, never hardcoded: `(estimated monthly income - total bills - savings goal) / days in month`
- Every transaction builds toward a tax-ready audit trail
- The app never assumes income — you configure expectations, it reacts to reality
- Home screen is today only — Reports owns historical data

---

## 2. Design System

### Visual Identity: Quiet Luxury

Inspired by: Copilot Money's Apple-native feel, Wealthsimple's editorial calm, luxury watch design where you glance and instantly know the state.

### Typography

| Role | Font | Usage |
|------|------|-------|
| Display/Hero | Bodoni Moda | Large numbers, headings, amounts in gauge |
| Body | DM Sans | All body text, labels, descriptions |
| Mono | JetBrains Mono | Dollar amounts, percentages, data values |

### Color System

**Light Mode (default)**

| Token | Value | Usage |
|-------|-------|-------|
| bg | #FAF9F6 | App background |
| bg2 | #F3F1EC | Section backgrounds, inset areas |
| card | #FFFFFF | Card surfaces |
| input | #F5F3EE | Input field backgrounds |
| t1 | #1A1915 | Primary text |
| t2 | #7C7A72 | Secondary text |
| t3 | #B0AEA6 | Tertiary/muted text |
| ch (champagne) | #B09049 | Primary accent — arc fill, active states, CTAs |
| chL | #CCAA5C | Champagne light — gradient end |
| chM | rgba(176,144,73,0.08) | Champagne muted — tag backgrounds |
| chG | rgba(176,144,73,0.04) | Champagne ghost — banner backgrounds |
| ok | #5D8C5A | Success — paid bills, deposits, under budget |
| warn | #C4873B | Warning — approaching budget, bills due soon |
| red | #B85C5C | Danger — over budget, shortfalls |
| track | #ECEAE4 | Arc gauge track |
| border | rgba(0,0,0,0.06) | Dividers, card borders |
| borderCard | rgba(0,0,0,0.05) | Subtle card borders |

**Dark Mode**

| Token | Value |
|-------|-------|
| bg | #0C0C0E |
| bg2 | #131315 |
| card | #1A1A1D |
| input | #1E1E21 |
| t1 | #F5F4F0 |
| t2 | #908E87 |
| t3 | #5C5A54 |
| ch | #CBA755 |
| chL | #DDBF6A |
| ok | #7AAC77 |
| warn | #D9A050 |
| red | #D47272 |
| track | #222225 |

### Neutral Color Philosophy

The arc gauge ALWAYS stays in the champagne/warm gradient, regardless of budget status. Only the hero number inside the arc changes color:
- Under budget: t1 (neutral dark)
- Over budget: red

This prevents the jarring "angry red ring" pattern and maintains the calm aesthetic.

### Arc Gradient Steps

| Spend % | Gradient Start | Gradient End |
|---------|---------------|-------------|
| 0–40% | Light champagne | Medium gold |
| 40–65% | Medium gold | Warm gold |
| 65–85% | Warm gold | Amber |
| 85–100% | Amber | Deep amber |
| 100%+ | Muted red | Red (over arc) |

### Shadows

- Light: `0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)`
- Dark: `0 2px 8px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)`

### Border Radius

- Cards: 18px
- Buttons/pills: 20-28px
- Input fields: 12-14px
- Bottom sheets: 28px top corners
- Widgets: 26px

---

## 3. App Architecture

### 5-Tab Navigation

| Tab | Icon | Purpose |
|-----|------|---------|
| Home | House | Today's budget, transactions, bills, deposits |
| Activity | Clock | Full transaction history with search, filters, date grouping |
| Reports | Bar chart | Personal spending + Business tax compliance views |
| Ask | Chat bubble | AI assistant for spending, deductions, budget questions |
| More | Gear | Accounts, bills management, entities, settings, income config |

### State Architecture

**App-level state (persisted):**
- `txs` — Today's transactions (editable: categorize, add receipt, add note, edit entity/category)
- `bills` — Recurring bills (full CRUD: add, edit, delete, toggle paid)
- `deposits` — Income log (add new, list recent)
- `theme` — light/dark
- `notifHistory` — Past notifications (capped at 20)

**Derived values (computed, never stored):**
- `budget` = `Math.round((estimatedMonthlyIncome - totalBills - savingsGoal) / daysInMonth)`
- `spent` = sum of today's transaction amounts
- `remaining` = budget - spent
- `spendablePool` = totalDeposited - paidBills - savingsGoal
- `unpaidBills` = totalBills - paidBills
- `bizSpend` = sum of transactions where entity is "trading" or "creative"

### Business Entities

| Entity Key | Label | Tax Treatment |
|-----------|-------|---------------|
| personal | Personal | Not Deductible |
| trading | Karani Markets LLC | Schedule C — Trading |
| creative | Ilai Collective LLC | Schedule C — Creative |

---

## 4. Home Screen

### Layout (top to bottom)

1. **Header** — greeting, notification bell (with unread dot), theme toggle, avatar
2. **Arc Gauge** — 230px, 70° gap at bottom, champagne gradient fill, hero number centered
3. **Stats Row** — Spent | Pool | Business | Bills Due (4 columns, centered)
4. **Quick Add Row** — Receipt (+), Voice Note (🎤), Scan (📷)
5. **Contextual Banner** — ONE at a time:
   - Over budget? → "Tap to adjust your plan →"
   - Under budget + not celebrated? → "🎉 End day under budget"
   - Has uncategorized? → "X uncategorized to review → Sort now"
6. **Category Breakdown** — Horizontal pills, tappable to filter transactions
7. **Today's Transactions** — TxCard list with expand/collapse
8. **Bills This Month** — Card with total/paid/due summary, each bill tappable to toggle paid
9. **Deposit Recommendation** — "Transfer $X to your bills account" (if unpaid > 0)
10. **Recent Deposits** — List with "+ Add" button
11. **Budget Derivation Card** — Shows: income - bills - savings ÷ 31 = daily budget

### Arc Gauge Technical Spec

- SVG path arcs, NOT circle+strokeDasharray (edge case issues)
- Gap: 70° at bottom
- Start angle: 125° (bottom-left), sweep: 290° clockwise
- At 100%: arc closes completely (sweep clamped to 359.9° for SVG compatibility)
- Over 100%: second red arc extends past track end into gap area
- Over-extension: `min((pct - 1) * 3, 0.35) * sweepTotal`
- Dot at tip: champagne when under, red when over
- Glow filter on fill arc

### Transaction Card (TxCard)

**Collapsed state:**
- Merchant name + "New" badge (if uncategorized) + Business tag + 📎 (if receipt) + ↻ (if recurring)
- Category + time (or "Tap to categorize" if uncategorized)
- Note preview (italic, truncated)
- Amount (right-aligned, mono font)
- Chevron (expand/collapse)

**Expanded state:**
- Category, Entity, Tax Status, Receipt status rows
- Note input with mic icon
- "Add/Replace Receipt" button (functional)
- "Edit" button → opens EditTxSheet

**Uncategorized tap → CatSheet:**
- Merchant name + amount + time
- Description/voice memo input field ("What was this purchase for?")
- ALL_CATEGORIES: Food & Drink, Software, Groceries, Transport, Entertainment, Contractors, Shopping, Equipment, Subscriptions, Other
- Entity picker: Personal, Karani Markets LLC, Ilai Collective LLC
- Confirm button (disabled until category selected)
- Returns actual selected category + entity + description to parent

### Bills Section

- Each bill shows: colored circle (green=paid, amber=upcoming), name, due date, vendor, amount
- Tapping toggles paid/unpaid status
- Paid amounts show strikethrough

### Deposit Section

- "+ Add" button opens inline DepositForm
- Source selector: Karani Markets / Ilai Collective
- Amount input (numeric, with $ prefix)
- Add Deposit / Cancel buttons
- New deposits prepend to list with notification

---

## 5. Activity Tab

- Search bar (searches merchant, category, AND amount)
- Filter pills: All | Personal | Business
- Business filter: `entity === "trading" || entity === "creative"` (NOT `entity !== "personal"` — that catches null entities)
- Date-grouped sections: "Today", "Feb 28", "Feb 27", etc.
- Same TxCard component as Home
- Empty state: "No transactions found"

---

## 6. Reports Tab

### Personal View
- Total personal spending (computed from real transaction data)
- Weekly bar chart
- Top categories breakdown (computed, not hardcoded)

### Business View
- Audit readiness ring: `(receipted transactions / total business transactions) * 100%`
- Missing receipts count (computed)
- Total deductible amount (computed from entity-tagged transactions)
- Per-entity breakdown: Karani Markets / Ilai Collective with deductible totals

---

## 7. Ask Tab

- Chat interface with AI responses
- Responds to keywords: spend/spent, deduct/tax, budget, receipt, bill, business/biz, save/saving
- All responses use real computed data (spent, budget, bills totals, missing receipts count)
- Fallback: "I can help with spending, budget status, deductions, receipts, bills, and savings."
- Production: Replace keyword matching with Anthropic API integration

---

## 8. More Tab

### Sections

1. **Connected Accounts** — List of accounts with balances + "Connect Account" button
2. **Recurring Bills** — Full CRUD:
   - Tap any bill → inline edit form (name, amount, due, vendor, frequency)
   - Frequency buttons: Monthly | Quarterly | Annual
   - Save / Cancel / "Remove this bill" (delete)
   - "+ Add Recurring Bill" button → same form for new bills
3. **Income** — Karani daily avg, Ilai biweekly, Savings goal
4. **Entities** — Karani Markets LLC (Trading · Schedule C), Ilai Collective LLC (Creative · Schedule C)
5. **Settings** — Daily Budget (derived), Savings Goal, Tax Year, Alert threshold
6. **Demo** — Simulate transaction button

---

## 9. Overlays & Sheets

### CatSheet (Categorize)
- Shows all 10 categories
- Description input with mic icon
- Entity picker
- Passes actual selection back (not hardcoded)

### EditTxSheet
- Category picker (all 10)
- Entity picker (3 entities)
- Merchant + amount shown read-only
- Save Changes button

### OverSheet (Over Budget Recovery)
- Three options with descriptions:
  - "Reduce tomorrow's budget" → shows calculated tomorrow amount
  - "Spread across the month" → shows per-day reduction
  - "Keep current plan" → accept overage
- Each choice triggers a specific notification with concrete numbers

### Toast Notifications
- Auto-dismiss after 5 seconds for info/success types
- Persist for action-required types (warnings with buttons)
- Stack into notifHistory for the notification panel

### Notification Panel
- Opens from bell icon in header
- Shows all past notifications
- "Clear all" button
- Dismisses when switching tabs

---

## 10. Notification System (Native iOS)

### Schedule

| Time | Notification | Priority |
|------|-------------|----------|
| 7:00 AM | Quiet hours end | — |
| 8:00 AM | Morning briefing | Normal |
| Real-time | Transaction alerts | Normal |
| Real-time | Deposit received | High |
| Real-time (once) | Over budget alert | High |
| Due date morning | Bill due reminder | High |
| 3 days before | Bill shortfall warning | High |
| Sunday 7:00 PM | Weekly summary | Normal |
| 9:00 PM | End of day (under budget only) | Normal |
| Friday 3:00 PM | Receipt reminder (weekly) | Normal |
| 10:00 PM | Quiet hours begin | — |

### Quiet Hours: 10pm–7am local time
- Transactions still log silently
- Notifications queue and roll into morning briefing
- Exceptions: Bill due today (critical), spending >2x daily budget (potential fraud)

### Notification Content

**Morning Briefing (8am)**
```
☀️ Daily Budget: $115
Bills this week: Car Insurance $187 (Thu)
Pool: $906 · Savings on track
```

**Transaction Alert**
```
Blue Bottle Coffee           -$6.40
Food & Drink · $108.60 remaining
[Personal ✓]  [Categorize]
```
Shows running remaining after every transaction. Quick actions for entity assignment.

**Large Transaction (>$50)**
```
⚠️ Adobe Creative Cloud      -$54.99
Software · $53.61 remaining
[Business]  [Personal]  [Open]
```
Higher visual priority. Entity assignment as primary actions since large purchases are more likely business.

**Over Budget (fires once when threshold crossed)**
```
📊 Over budget by $12
$127 spent of $115 · 4 transactions today
[Adjust Plan]  [Got It]
```
"Adjust Plan" deep links to OverSheet.

**Deposit Received**
```
💰 +$420 from Karani Markets
Transfer $312 to bills account
Pool: $1,326 after set-aside
[Mark Transferred]  [Later]
```
Includes bill set-aside recommendation and actionable button.

**Bill Due (morning of due date)**
```
📋 Car Insurance $187 due today
GEICO · Monthly
$312 remaining in bills budget
[Mark Paid]  [Snooze]
```

**Bill Shortfall Warning (3 days before)**
```
⚠️ Bills gap: $187 short
Car Insurance due in 3 days
Karani avg ~$400/day — should cover by Wed
[See Details]
```
Smart: calculates whether deposit rate will cover gap before due date.

**Weekly Summary (Sunday 7pm)**
```
📊 Week in Review
Spent: $847 · Avg $121/day
3 days over · 4 under
Business: $342 deductible
[See Report]
```

**End of Day (9pm, under budget only)**
```
🎉 $23 saved today
$115 budget · $92 spent
Streak: 3 days under budget
```
Positive reinforcement only. No notification when over — user already knows.

**Receipt Reminder (Friday 3pm)**
```
📎 4 receipts missing this week
$523 in business expenses unattached
[Attach Now]
```

### Notification Grouping

All transaction notifications group under "Transactions" in notification center:
```
POCKETPILOT · Transactions (6)
Starbucks -$7.45 · $31 remaining
Adobe Creative Cloud -$54.99 · $38 remaining
Blue Bottle Coffee -$6.40 · $93 remaining
3 more →
```

Bills group under "Bills." Deposits under "Income." Briefings and summaries are standalone.

### Do Not Disturb Intelligence

Respects Focus/DND for everything except:
- Bill due today (critical financial obligation)
- Spending >2x daily budget (potential fraud detection)

---

## 11. Dynamic Island

### Persistent: 7am–10pm local time

**Compact (pill) — Under Budget:**
- Left: Mini arc gauge (30px, 65° gap, champagne fill)
- Center: "$73 left" in mono font
- Right: App logo circle (champagne gradient with "P")

**Compact (pill) — Over Budget:**
- Arc turns red with overspill
- "$12 over" in red
- Pill gets subtle red border glow
- Logo circle turns red gradient

**Expanded — New Transaction:**
- Top row: Arc + "PocketPilot" + "$73 remaining" (right aligned)
- Content: Transaction card (merchant, category, time, amount)
- Actions: "Categorize" (champagne) | "Dismiss" (neutral)

**Expanded — Deposit:**
- Top row: 💰 icon + "Deposit Received" + "+$420" (green)
- Content: Bill transfer recommendation with breakdown
- Actions: "Mark Transferred" (champagne) | "Later" (neutral)

**Minimal (competing activities):**
- Single dot: tiny arc gauge only
- Color indicates state: champagne = healthy, amber = close, red = over

---

## 12. Widgets

### Home Screen — Small (2×2)

- Full arc gauge (74px, 70° gap)
- Dollar amount centered inside arc
- "remaining" or "over budget" label below
- "of $115 daily" caption
- Under budget: champagne arc, dark number
- Over budget: red arc, red number

### Home Screen — Medium (4×2)

- Arc (84px) on left with amount + "left" inside
- Right side: 3 data rows:
  - Spent today: $127
  - Month pool: $906
  - Next bill: Insurance · Thu
- Uses champagne for pool value, warn for next bill

### Lock Screen — Rectangular

- Dark glass background with blur
- Mini arc (26px) on left
- Two lines:
  - "$73 left · $127 spent" (mono, white)
  - "$312 bills due · Pool $906" (muted)

### Lock Screen — Circular Complication

- 48px circle with dark glass background
- Mini arc filling the circle
- Dollar amount centered (10px mono)
- Under: champagne, Over: red

### Widget Refresh

iOS limits widget refreshes (~40-70/day). Priority:
1. After each new transaction (most important)
2. After budget threshold changes (under→over, over→under)
3. After deposit received
4. Periodic (every 15 minutes during waking hours)

---

## 13. Apple Watch

### Complication

- Circular: Mini arc (42px) with dollar amount centered
- Sits alongside other complications on watch face
- Tapping opens notification list (no standalone app)

### Notifications

Mirror phone notifications exactly with adapted layout:
- App logo (18px, rounded rect)
- "POCKETPILOT" label
- Title + amount
- Remaining balance
- Quick actions: "Personal" | "Business" (for transactions)
- "Adjust Plan" (for over budget)
- "Mark Paid" (for bill due)

---

## 14. Account Architecture

### Connected Accounts

| Account | Connection | Volume | Purpose |
|---------|-----------|--------|---------|
| Chase Checking (••4821) | Plaid | High | Daily spending |
| Revolut Business (••7733) | Revolut API | High | Business expenses |
| Amex Gold (••1009) | Plaid | Medium | Credit card |
| Marcus Savings (••5502) | Plaid | Low | Savings |

### API Strategy

- **Revolut Business API:** Direct connection for business accounts. READ scope, 40-min token expiry with refresh rotation.
- **Plaid:** For Chase, Amex, Marcus. Webhook-driven via `SYNC_UPDATES_AVAILABLE`. `/transactions/sync` for efficient updates.
- **Polling:** Revolut every 2 hours. Plaid webhook-based + manual refresh. Full reconciliation at 4:00 AM local.

---

## 15. Income Configuration

| Source | Type | Expected |
|--------|------|----------|
| Karani Markets | Daily (trading days) | ~$400/day |
| Ilai Collective | Biweekly | $3,000 |

**Estimated monthly income:** `karaniDaily × 22 + ilaiBiweekly × 2 = $14,800`

Editable in More tab. The app tracks actual deposits against expectations but never assumes future income for budget calculation — it uses the configured expectations only.

---

## 16. Bill Management

### Data Model

```
Bill {
  name: string           // "Car Insurance"
  amount: number         // 187
  due: string            // "20th"
  paid: boolean          // toggled from Home or More tab
  freq: "Monthly" | "Quarterly" | "Annual"
  vendor: string         // "GEICO" — for auto-matching transactions
}
```

### Operations

- **Add:** More tab → "+ Add Recurring Bill" → form with name, amount, due, vendor, frequency
- **Edit:** More tab → tap bill → inline edit form → Save/Cancel
- **Delete:** More tab → tap bill → edit form → "Remove this bill"
- **Toggle paid:** Home tab → tap the circle indicator on any bill
- **Auto-match (future):** When transaction merchant matches a bill's vendor field, prompt to link and auto-mark paid

---

## 17. Tax Compliance

### Per-Transaction Fields

- `entity`: personal | trading | creative
- `category`: one of ALL_CATEGORIES
- `receipt`: boolean (attached or missing)
- `note`: freeform text or voice transcription
- `recurring`: boolean

### Tax Status Logic

- entity === "trading" || entity === "creative" → Deductible (Schedule C)
- entity === "personal" → Not Deductible

### Audit Readiness

Computed as: `business transactions with receipts / total business transactions × 100%`

Displayed in Reports → Business view as a ring gauge.

---

## 18. Desktop Web Companion

### Design Philosophy

The mobile app is a daily cockpit — glance, tap, go. The desktop is where you sit down and do the serious work. Two different postures, same visual soul.

**Desktop handles three jobs mobile doesn't do well:**
1. Setup & configuration — connecting accounts, building bill schedules, configuring income
2. Business command center — reviewing deductibility, attaching receipts, writing rationale, exporting for accountant
3. Deep analytics — multi-month trends, category deep dives, savings trajectory

**Desktop does NOT replicate the daily budget tracker.** The sidebar shows today's status (arc gauge, spent, pool) but it's not the hero. The hero is whatever page you're working in.

### Authentication

- Clerk for auth (email + password + MFA, Google/Apple SSO)
- Railway for hosting
- Login flow: email → password → 6-digit TOTP MFA
- Split-panel login: dark brand panel (left, centered logo 80px), form (right)
- Back button on every step after email
- SSO buttons (Google, Apple) on email step

### Layout

- Fixed sidebar (256px) + scrollable main content
- Sidebar: logo, daily budget arc (100px hero), nav links, profile + logout
- Main content: 36px horizontal padding, 28px top padding
- Max height 100vh with overflow scroll on main content

### Sidebar

The daily budget display is the **visual anchor** of the sidebar — a 100px arc gauge with the remaining/over amount in 26pt Bodoni Moda, centered. Below it: spent and pool stats. The entire card is clickable and navigates to Dashboard.

Navigation items (proper SVG icons, not Unicode):
- Dashboard (house)
- Business (briefcase)
- Bills (document)
- Accounts (credit card)
- Analytics (bar chart)
- Settings (gear)

Profile section at bottom with avatar initial, name, and logout button.

### Pages

#### Dashboard
- Date display
- 4 stat cards (Pool, Deposited, Bills Due, Savings) — **each clickable, deep-links to relevant page**
- Two-column layout: Today's Transactions (left) + Upcoming Bills (right)
- "View all →" navigates to Analytics
- "Manage →" navigates to Bills
- Bills have tappable circle toggles to mark paid/unpaid
- Transfer recommendation card with "Done" action button

#### Business Center
- Entity filter tabs (All / Karani Markets / Ilai Collective)
- Search bar (filters by merchant and category)
- 4 audit stat cards: Total Deductible, Audit Ready %, Missing Receipts, Missing Rationale
- Transaction table with inline rationale:
  - Each row: merchant, category+date, entity badge, amount, receipt toggle, rationale edit button
  - Receipt toggle: clicking "+ Receipt" marks receipt as attached (persists to state)
  - Rationale: clicking "Edit" or "+ Rationale" expands inline editor with textarea
  - Rationale saves persist (state updated, not just local)
  - **No redundant "Deductible" badge** — everything on this page is deductible by definition
- "Export for Accountant" button (top right) — generates CSV with all fields

#### Bills
- Summary stats: Monthly Total, Paid, Still Due
- Search bar (filters by name or vendor)
- Split sections: Personal & Household, Business Subscriptions
- Each bill row: paid toggle circle (checkmark when paid, strikethrough on name), name, vendor+due, amount, frequency, account, Edit button
- **Full CRUD via modal:**
  - "+ Add Bill" opens modal with: name, amount, due date, frequency, entity, vendor, pay-from account
  - "Edit" on any row opens same modal pre-filled
  - "Delete Bill" button (danger style) in edit modal
  - Save/Cancel buttons
- Paid toggle works from both Dashboard and Bills page (shared state)

#### Accounts
- Summary stats: Total Assets, Total Debt, Net Position
- Account cards (2-column grid): name, institution, last4, balance, type, sync status
- Each card has: Refresh button, Disconnect button
- "+ Connect Account" opens modal with three options:
  - Plaid (10,000+ institutions)
  - Revolut Business API (direct connection)
  - Manual Entry (cash/unsupported)
- Dashed "add" card below existing accounts
- Sync Configuration table: Revolut schedule, Plaid schedule, reconciliation timing

#### Analytics
- Income vs Spending bar chart (6 months) — **hover tooltips showing exact $values**
- Income bars at 50% opacity green (visible, not washed out)
- Legend below chart
- 2×2 grid:
  - Savings Progress: amount, progress bar, percentage
  - Daily Average: 30-day avg, under/over budget day counts, longest streak, avg overage
  - Top Categories: relative bar charts (highest = 100% width)
  - Tax Summary: YTD total deductible, per-entity breakdown

#### Settings
- 2×2 grid layout:
  - Income Configuration: Karani daily avg, Ilai biweekly, estimated monthly auto-computed
  - Budget Derivation: savings goal input, live calculation showing income − bills − savings ÷ 31 = daily budget
  - Business Entities: Karani Markets LLC (Trading, Schedule C), Ilai Collective LLC (Creative, Schedule C) with descriptions
  - Preferences: tax year, currency, timezone, notification status, quiet hours

### Shared Components

- **Modal:** backdrop blur, centered card (480px or 640px wide), title + close button, scrollable content
- **SearchBar:** icon + input + clear button, 320px max width
- **Field:** label (uppercase 11px) + input/select/textarea, consistent styling
- **Btn:** primary (champagne gradient), default (outlined), danger (red background), small variant
- **Badge:** colored pill, 11px font, 8px border radius
- **Stat:** label + large value + subtitle, used in all stat cards

### Desktop-Specific Design Rules

- Card border radius: 14px (slightly tighter than mobile's 18px for desktop density)
- Shadow: `0 1px 3px rgba(0,0,0,0.03), 0 6px 24px rgba(0,0,0,0.03)` — subtle, not floaty
- Hover shadow: `0 2px 8px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.06)` — for interactive cards
- All interactive elements have hover states
- Scrollbar: thin (6px), transparent track, subtle thumb
- Empty states: "No expenses match your search." / "No bills match your search." (centered, muted text)

---

## 19. File Manifest

### Current (keep these)

| File | Purpose |
|------|---------|
| PocketPilot_v10.jsx | Complete mobile app prototype — all features, all audit fixes |
| PocketPilot_Desktop.jsx | Desktop web companion — login, sidebar, all pages, full CRUD |
| PocketPilot_Notifications.jsx | Visual lookbook — Dynamic Island, widgets, push notifications, Apple Watch |
| PocketPilot_Master_Spec.md | THIS FILE — single source of truth |

### Archived (reference only)

| File | Notes |
|------|-------|
| PocketPilot_v2–v9.jsx | Previous iterations, superseded by v10 |
| PocketPilot_Product_Spec.md | Original product spec, superseded by this file |
| PocketPilot_Design_Spec.md | Original design spec, superseded by this file |
| PocketPilot_HomeScreen.jsx | Early home screen prototype |

---

## 20. Outstanding / Future

### Not Yet Designed
- Onboarding flow (first launch, connect accounts, set income, add bills)
- Household sharing (spouse access, shared vs individual views)
- Transaction splitting (e.g., Amazon order split between personal + business)
- Voice-to-text integration (Whisper API for voice memos)
- OCR receipt scanning (Veryfi, Mindee, or Google Vision)
- Auto-categorization ML (learn from user's categorization patterns)
- Recurring transaction detection and "expected" badges
- Desktop dark mode toggle

### Design Decisions Log

| Decision | Rationale |
|----------|-----------|
| Home = today only, Reports = historical | Prevents scope creep on home screen |
| Arc stays champagne, only number turns red | Calm aesthetic, avoids angry red ring |
| Budget derived from income - bills - savings | Never a magic number, always transparent |
| Bills toggled from Home screen | Most common action shouldn't require tab switch |
| Notifications follow local time, no trading mode | Simplicity > complexity for v1 |
| No standalone Watch app | Notifications + complication cover the use case |
| Category sheet shows all 10 categories | User was confused by the 4-category subset |
| Activity filters use entity checks not personal check | Null entities were incorrectly shown as business |
| Over-budget sheet gives concrete adjusted numbers | "Plan updated" without specifics felt fake |
| Desktop sidebar arc is 100px hero element | Daily budget is the driving factor — needs to be big even on desktop |
| Desktop doesn't replicate mobile daily tracker | Different posture: mobile = glance, desktop = sit and work |
| Business rationale field on desktop | Tax prep needs documented business purpose — mobile too cramped |
| Desktop bills use modal for CRUD, not inline | More fields to fill, needs proper form layout |
| No "Deductible" badge on every business row | Redundant — everything on the business page is deductible |
| Settings page shows live budget derivation | Transparency: see exactly how the daily number is calculated |

---

*End of specification. This document is the single authority for PocketPilot development. When in doubt, this file wins.*
