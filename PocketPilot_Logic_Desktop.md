# PocketPilot Desktop — Logic Contract

## What This File Is

This is the behavioral brain of the web dashboard. Every event and exactly what the desktop should do. Claude Code: read this before writing any frontend or API logic for the web app.

**This file lives in the repo root. It gets updated as the app evolves.**

---

## Core Differences from Mobile

The desktop is NOT a replica of the mobile app. Different posture, different behaviors:

| | Mobile | Desktop |
|---|---|---|
| **Primary use** | Quick glances, 30-second interactions | Sit-down sessions, 10-30 minutes |
| **Budget arc** | Hero element, center of Home screen | Sidebar element, visible but not dominant |
| **Transactions** | Tap to categorize one at a time | Review and edit in bulk via table |
| **Receipts** | Camera snap | File upload |
| **Voice** | Built-in mic recording | Not available (use mobile) |
| **Bills** | Toggle paid from Home, simple list | Full CRUD with modal, split tables |
| **Business** | Basic view in Reports tab | Full command center with inline editing |
| **Notifications** | Push via APNs | None (desktop has no push — user is looking at the screen) |

---

## PAGE: DASHBOARD

### On Page Load

1. Fetch `/api/budget` → get dailyBudget, spentToday, remaining, pct, monthPool
2. Fetch `/api/transactions?date=today` → today's transactions
3. Fetch `/api/bills?paid=false&dueSoon=true` → unpaid bills due within 7 days
4. Render:
   - 4 stat cards: Month Pool, Deposited, Bills Due, Savings
   - Left column: Today's Transactions
   - Right column: Upcoming Bills

### Stat Cards Are Clickable

| Card | Navigates To |
|------|-------------|
| Month Pool | Analytics page |
| Deposited | Analytics page |
| Bills Due | Bills page |
| Savings | Settings page (savings goal section) |

Click triggers instant page navigation (sidebar active state updates).

### "View all →" Button
- Navigates to Analytics page

### "Manage →" Button
- Navigates to Bills page

### Today's Transactions List
- Shows: merchant, category pill, entity badge (if business), time, amount
- "New" badge on uncategorized transactions
- "Biz" badge on business transactions
- Clicking a transaction: does nothing on desktop (categorize from Business Center or Activity)
- If 0 transactions: show "No spending yet today" with muted text

### Upcoming Bills (right column)
- Shows: toggle circle, bill name, due date, amount
- **Toggle circle is clickable** → toggles paid (see EVENT: Toggle Bill Paid)
- Shows max 4 unpaid bills
- If unpaid bills exist: show transfer recommendation card at bottom
  - "Transfer $[totalUnpaid] to cover bills"
  - "Done" button dismisses the recommendation (stored in session, reappears on next session)

### Auto-Refresh
- Dashboard does NOT auto-refresh on a timer
- Refreshes on: page navigation back to Dashboard, browser tab regains focus
- No websockets — simple fetch on mount

---

## PAGE: BUSINESS CENTER

### On Page Load

1. Fetch `/api/transactions?entity=trading,creative` → all business transactions
2. Calculate: total deductible, audit ready %, missing receipts, missing rationale

### Entity Filter Tabs

- "All Entities" / "Karani Markets" / "Ilai Collective"
- Clicking a tab: filters the transaction table immediately (client-side filter, no API call)
- Active tab: champagne border + background
- Filter AND search work together (intersection)

### Search Bar

- Filters by merchant name OR category (case-insensitive substring match)
- Client-side filtering (data already loaded)
- Clear button (×) resets search
- If no results: "No expenses match your search." centered, muted

### Stat Cards (4 across top)

- **Total Deductible**: sum of filtered transaction amounts
- **Audit Ready %**: (transactions with receipt / total transactions) × 100, rounded
  - Color: green if ≥85%, orange if <85%
- **Missing Receipts**: count of transactions without receipt
  - Color: red if >0, green if 0
- **No Rationale**: count of transactions without rationale
  - Color: orange if >0, green if 0

Stats update in real time as entity filter or search changes.

### Transaction Table

Each row shows:
- Merchant + category + date
- Entity badge (Karani or Ilai)
- Amount (mono font)
- Receipt status: "✓ Receipt" (green, clickable to un-toggle) or "+ Receipt" (red button, clickable to toggle)
- Rationale button: "Edit" (if has rationale) or "+ Rationale" (if empty, orange text)

### Receipt Toggle (clicking "+ Receipt" or "✓ Receipt")

1. Optimistic update: toggle receipt status in UI immediately
2. Send `PATCH /api/transactions/[id]` with `{ receipt: !current }`
3. Recalculate "Audit Ready %" and "Missing Receipts" stats
4. If toggling ON and no actual file attached: this marks intent — actual file upload is separate

### Rationale Editing

1. User clicks "Edit" or "+ Rationale" on a row
2. Row expands: textarea appears below the row with current rationale (or empty)
3. Textarea placeholder: "Why was this expense necessary for business?"
4. "Save" and "Cancel" buttons appear
5. Only one row can be in edit mode at a time — clicking edit on another row closes the current one
6. **Save:**
   - Send `PATCH /api/transactions/[id]` with `{ rationale: text }`
   - Collapse editor
   - Update "No Rationale" stat
   - Show saved rationale in a subtle box below the row
7. **Cancel:**
   - Collapse editor
   - Discard changes

### Rationale Display

- If a transaction has a rationale and is NOT in edit mode:
  - Show a subtle box below the row: "Business Purpose: [rationale text]"
  - Box has warm ivory background, 12px text, muted color

### "Export for Accountant" Button

1. User clicks button (top right, primary style)
2. Generate CSV with columns: Date, Merchant, Amount, Entity, Category, Receipt (Yes/No), Rationale
3. Include only transactions matching current entity filter (or all if "All Entities")
4. Filename: `PocketPilot_Business_[Entity]_[YYYY-MM].csv`
5. Trigger browser download
6. Brief toast: "Exported [count] transactions"

---

## PAGE: BILLS

### On Page Load

1. Fetch `/api/bills` → all bills
2. Calculate: monthly total, paid total, still due total

### Stat Cards (3 across top)

- **Monthly Total**: sum of all bill amounts
- **Paid This Month**: sum of paid bills (green)
- **Still Due**: sum of unpaid bills (orange)

### Search Bar

- Filters by bill name OR vendor (case-insensitive)
- Client-side filter
- Clear button resets

### Split Tables

- **Personal & Household**: bills where `entity` is empty/personal
- **Business Subscriptions**: bills where `entity` is trading or creative

Each section has its own header label (uppercase, 11px, muted).

### Bill Row

Shows:
- Toggle circle (clickable)
- Name (strikethrough + 50% opacity if paid)
- Vendor + due date (subtitle)
- Amount (mono font)
- Frequency
- Pay-from account
- "Edit" button

### Toggle Paid (clicking the circle)

1. Optimistic update: circle fills green with checkmark, name strikethroughs
2. Send `PATCH /api/bills/[id]` with `{ paidThisMonth: !current }`
3. Recalculate stat cards
4. Success haptic: none (desktop)
5. Reverse: same flow in reverse

### "+ Add Bill" Button

1. Opens modal with form fields:
   - Name (text, required)
   - Amount (number, required)
   - Due Date (text, e.g. "20th", required)
   - Frequency (select: Monthly / Quarterly / Annual)
   - Entity (select: Personal / Karani Markets / Ilai Collective)
   - Vendor (text, optional — used for auto-matching)
   - Pay From (select: list of connected accounts)
2. "Add Bill" button (primary): `POST /api/bills` → add to list, close modal
3. "Cancel" button: close modal, discard
4. After save: new bill appears in correct section (personal or business), stats recalculate

### "Edit" Button on Bill Row

1. Opens same modal, pre-filled with bill data
2. "Save Changes" button: `PATCH /api/bills/[id]` → update, close modal
3. "Delete Bill" button (danger style, bottom left of modal):
   - Confirm: "Delete [billName]? This can't be undone."
   - On confirm: `DELETE /api/bills/[id]` → remove from list, close modal, stats recalculate
4. "Cancel" button: close modal, discard changes

### Empty State

- If 0 bills match search: "No bills match your search." centered
- If 0 bills total: "No recurring bills yet. Add your first bill to get started." with prominent "+ Add Bill" button

---

## PAGE: ACCOUNTS

### On Page Load

1. Fetch `/api/accounts` → all connected accounts
2. Calculate: total assets, total debt, net position

### Stat Cards (3 across)

- **Total Assets**: sum of positive balances (green)
- **Total Debt**: sum of negative balances (red, shown as -$X)
- **Net Position**: total assets + total debt

### Account Cards (2-column grid)

Each card shows:
- Account name + institution + last4
- Badge: "Connected" (green)
- Balance (large, Bodoni Moda, red if negative)
- Type + sync status ("Synced 2 min ago")
- **"Refresh" button**: triggers `POST /api/sync/revolut` for this account, shows spinner, updates balance and sync time
- **"Disconnect" button**: confirms "Disconnect [accountName]?", on confirm: `DELETE /api/accounts/[id]`, removes card

### "+ Connect Account" Button (top right, primary)

1. Opens modal with 3 connection options:
   - **Plaid** — "Chase, BofA, Amex, Marcus, and 10,000+ institutions"
   - **Revolut Business API** — "Direct connection for Revolut Business accounts"
   - **Manual Entry** — "Log transactions manually for cash or unsupported accounts"
2. Each option is a clickable card with name + description
3. Clicking: closes modal, shows alert with "[method] connection flow would open here" (stub until integration is built)

### Dashed "Add" Card

- Below the account cards grid
- Shows: + icon, "Connect a new account", description text, method badges
- Clicking: same as "+ Connect Account" button (opens modal)

### Sync Configuration Table

- Shows polling schedules for each connection method
- Static display (not editable from this page)
- Revolut: every 2 hours
- Plaid: webhook-driven
- Full reconciliation: daily at 4am
- Manual refresh: anytime

---

## PAGE: ANALYTICS

### On Page Load

1. Fetch 6 months of income and spending data
2. Fetch savings progress, daily averages, category breakdown, tax summary

### Income vs Spending Chart

- 6 months of dual bars (income + spending per month)
- Income bars: green at 50% opacity
- Spending bars: champagne gold gradient
- **Hover tooltip**: shows exact values "In: $9.4k · Out: $3.2k"
- Tooltip: dark background, white text, mono font, positioned above the hovered month
- Current month: label highlighted in champagne, bolder weight
- Legend below chart: green square "Income" + gold square "Spending"

### Savings Progress Card

- Shows: large amount saved YTD + progress bar + percentage
- Progress bar: green fill, ivory track
- Subtitle: "$X of $Y (Z months)"

### Daily Average Card

- Shows: 30-day average daily spend + trend arrow (↓ 8% = green)
- Table: under budget days, over budget days, longest streak, avg overage
- Each stat: label left, value right, mono font for values

### Top Categories Card

- Shows: 5 categories with name, dollar amount, and horizontal bar
- Bar width: relative to highest category (highest = 100%)
- Bar: champagne gradient fill
- NOT the broken `pct * 3` scale from v1

### Tax Summary Card

- Shows: large total deductible amount (champagne)
- Per-entity breakdown:
  - Karani Markets LLC: amount + "Trading · Schedule C"
  - Ilai Collective LLC: amount + "Creative · Schedule C"

---

## PAGE: SETTINGS

### On Page Load

1. Fetch `/api/settings` → income config + preferences

### Income Configuration Card

- Fields:
  - Karani Markets — Daily Avg (editable number input)
  - Ilai Collective — Biweekly (editable number input)
- Auto-computed display: "Estimated Monthly: $[karaniDaily × 22 + ilaiBi × 2]"
- Breakdown shown: "(400 × 22 trading days) + (3000 × 2 pay periods)"
- **Changes save on blur** (when user clicks out of the field): `PATCH /api/settings`
- No explicit save button needed — auto-save with subtle "Saved" indicator

### Budget Derivation Card

- Fields:
  - Monthly Savings Goal (editable number input)
- Live calculation display:
  - Estimated Monthly Income: $X
  - − Total Bills: -$X
  - − Savings Goal: -$X
  - ÷ 31 days
  - **= Daily Budget: $X** (large, champagne, Bodoni Moda)
- This updates in real time as any input changes
- **Changes save on blur**: `PATCH /api/settings`

### Business Entities Card

- Shows 2 entity cards:
  - Karani Markets LLC — Trading · Schedule C — description
  - Ilai Collective LLC — Creative · Schedule C — description
- Display only (not editable from here — entity setup is a one-time configuration)

### Preferences Card

- Display table:
  - Tax Year: 2026
  - Currency: USD
  - Timezone: Auto (follows device)
  - Notifications: Enabled
  - Quiet Hours: 10pm–7am local
- Display only for now (future: make these editable)

---

## SIDEBAR BEHAVIOR

### Daily Budget Arc (Hero Element)

- Size: 100px with 26pt remaining amount centered
- Shows: remaining (positive) or over amount (negative, red)
- Label below: "of $[budget] daily budget"
- Progress bar below arc: spent/budget ratio
- Spent and Pool stats at bottom
- **Entire card is clickable** → navigates to Dashboard
- Updates: when any page loads (fetches fresh budget data)

### Navigation

- 6 items: Dashboard, Business, Bills, Accounts, Analytics, Settings
- Active page: champagne background + bold text + full opacity icon
- Inactive: transparent background + normal text + 50% opacity icon
- Hover: subtle background change
- Click: instant page switch, no loading state (data fetches after navigation)

### Profile + Logout

- Bottom of sidebar: avatar initial + "Jay" + logout button
- Logout: clears Clerk session → redirects to sign-in page
- No confirmation dialog — just log out

---

## MODAL BEHAVIOR

- Backdrop: 25% black with 4px blur
- Centered card: 480px wide (or 640px for wide modals)
- Title bar: title (Bodoni Moda) + × close button
- Scrollable content if taller than 80vh
- Click backdrop: closes modal
- Click inside modal: does NOT close
- Escape key: closes modal
- Only one modal open at a time

---

## SEARCH BEHAVIOR (all pages)

- Search is client-side (data already loaded)
- Debounce: 0ms (instant, no delay — dataset is small)
- Case-insensitive substring match
- Clear button (×) appears when text is present
- Empty search shows all items
- Search + filters work together (intersection, not union)

---

## CROSS-PAGE DATA CONSISTENCY

When data changes on one page, other pages should reflect it when navigated to:

| Action | Updates |
|--------|---------|
| Toggle bill paid | Dashboard Bills Due card, Bills page stats, sidebar budget (if bill amount affects pool) |
| Add/edit/delete bill | Dashboard Bills Due card, Bills page stats, Settings budget derivation |
| Edit transaction category/entity | Business Center stats, Analytics categories |
| Save rationale | Business Center stats (No Rationale count) |
| Toggle receipt | Business Center stats (Audit Ready %, Missing Receipts) |
| Change income config | Settings budget derivation, sidebar daily budget, Dashboard stat cards |
| Change savings goal | Settings budget derivation, sidebar daily budget |

**Implementation:** Each page fetches fresh data on mount. No global state store needed. The data is small enough that re-fetching on navigation is instant and simpler than maintaining sync.

---

## EMPTY STATES

Every page that can be empty should show a helpful message:

| Page/Section | Empty Message |
|---|---|
| Dashboard: Today's Transactions | "No spending yet today. Your budget is $[daily]." |
| Dashboard: Upcoming Bills | "All bills paid this month ✓" (green) |
| Business Center: filtered list | "No expenses match your search." |
| Business Center: no business txs | "No business expenses this month." |
| Bills: filtered list | "No bills match your search." |
| Bills: no bills at all | "No recurring bills yet." + prominent Add button |
| Accounts: no accounts | "Connect your first account to get started." + prominent Connect button |

Empty states use centered layout, muted text color, and include an action button where relevant.

---

## LOGIN FLOW

### Step 1: Email
- Input: email address
- "Continue" button (always enabled, no validation blocking)
- SSO buttons below divider: Google, Apple
- SSO buttons advance to Step 3 (MFA) or skip to app

### Step 2: Password
- Shows which email is signing in (from Step 1)
- Input: password (masked)
- "Continue" button
- "← Back" button returns to Step 1

### Step 3: MFA
- 6 individual digit inputs
- Auto-advance: typing a digit moves focus to next input
- Using `document.getElementById('mfa-N')` for focus management
- "Verify" button
- "← Back" button returns to Step 2

### Step 4: Loading
- "Signing in..." state for 800ms
- Then render the full app (sidebar + dashboard)

### Logout
- Clicking logout in sidebar → clear Clerk session → show login screen
- No "are you sure" dialog

---

*This file is the behavioral authority for the desktop web app. Mobile has its own logic contract. They share the same API but have different UI behaviors.*

---

## APPENDIX: AUDIT — Additional Scenarios

The following scenarios were identified during audit and must be handled:

---

### Receipt File Upload (Desktop)

On desktop, receipts are uploaded via file picker (not camera).

**From Business Center:**
1. User clicks "+ Receipt" on a transaction row
2. If this is just a toggle (marking intent): receipt status flips to "✓ Receipt"
3. To upload an actual file: user clicks the "✓ Receipt" text → shows popover: "Upload file" / "Remove"
4. "Upload file" → opens native file picker (accept: image/jpeg, image/png, application/pdf)
5. Upload to `/api/receipts/upload` as multipart form data
6. Show progress spinner on that row's receipt column
7. On success: store URL, show "✓ Receipt" with a small paperclip icon indicating file is attached
8. On failure: show brief error toast "Upload failed — try again"

**Viewing an attached receipt:**
- Hover over "✓ Receipt" with paperclip → tooltip shows "Click to view receipt"
- Click → opens receipt image in a modal (not a new tab)
- Modal shows: full-size image + "Download" button + "Remove" button
- "Remove": confirms "Remove receipt? The file will be deleted." → detaches receipt, sets `receipt: false`

---

### Rationale Auto-Generate Button

In Business Center, alongside the manual rationale editor:

1. When rationale editor is open and textarea is empty:
   - Show "✨ Generate" button next to Save/Cancel
2. Clicking "✨ Generate":
   - Send `POST /api/ai/rationale` with `{ merchant, amount, category, entity }`
   - Show spinner in the button: "Generating..."
   - Claude returns 1-2 sentence IRS-ready rationale
   - Pre-fill the textarea with the generated text
   - User can edit before saving, or save as-is
3. If rationale already has text:
   - Button shows "✨ Regenerate" instead
   - Clicking replaces current text with new generation
   - Show confirmation if existing text will be overwritten: "Replace existing rationale?"

---

### Business Center Date Range Filter

Currently missing — Business Center has entity filter and search, but no date filter.

**Add date range control:**
- Position: between entity tabs and search bar
- Options: "This Month" / "Last Month" / "This Quarter" / "This Year" / "Custom"
- Default: "This Month"
- "Custom": shows two date pickers (from/to)
- Filter is applied server-side for custom ranges: `GET /api/transactions?entity=...&from=...&to=...`
- Filter is client-side for preset ranges (data for current month already loaded)
- Stats update when date range changes
- Export CSV respects the active date range

---

### Analytics Date Range

Currently shows 6 months hardcoded. Should be configurable:

- Default: "Last 6 Months"
- Options: "Last 3 Months" / "Last 6 Months" / "Last 12 Months" / "Year to Date"
- Selector: small button group above the chart
- All cards below the chart also respect the selected range
- Tax Summary card always shows YTD regardless of chart range

---

### Analytics Empty States

| Card | Empty State |
|---|---|
| Income vs Spending chart | "Not enough data yet. Chart will appear after your first month." with placeholder bars in muted color |
| Savings Progress | "Set a savings goal in Settings to track progress." with link to Settings |
| Daily Average | "Spending data will appear after 7 days of activity." |
| Top Categories | "Categorize some transactions to see your top spending categories." |
| Tax Summary | "No business expenses recorded yet." |

---

### Loading States (Every Page)

When a page is fetching data, show a skeleton loader — NOT a spinner, NOT blank white.

**Skeleton pattern:**
- Stat cards: grey rounded rectangles pulsing where numbers will be
- Transaction rows: grey bars pulsing where merchant name and amount will be
- Charts: grey rectangles where bars will be
- Duration: skeleton shows for max 2 seconds, then data appears
- If data takes >2 seconds: show skeleton + subtle "Loading..." text below

**Error state (API fails):**
- Show: "Unable to load data. Check your connection and try again."
- "Retry" button that re-fetches
- Do NOT show a blank page — always show either skeleton, data, or error with retry

---

### API Error Handling (Desktop)

| Error Type | User-Facing Behavior |
|---|---|
| Network offline | Banner at top: "You're offline. Changes will sync when reconnected." (warm orange background) |
| 401 Unauthorized | Redirect to sign-in page (Clerk session expired) |
| 403 Forbidden | Toast: "You don't have permission to do that." |
| 404 Not Found | Toast: "That item no longer exists." + remove from UI |
| 422 Validation Error | Toast: "Please check your input — [specific field error]" |
| 500 Server Error | Toast: "Something went wrong. Try again." + "Retry" option |
| Timeout (>10s) | Toast: "Request timed out. Try again." |

**Optimistic updates that fail:**
- If an optimistic update (toggle paid, toggle receipt) fails:
  - Revert the UI change
  - Show toast with error message
  - Do NOT leave the UI in an inconsistent state

---

### Browser Tab Title

The browser tab should show useful info at a glance:

| Page | Tab Title |
|---|---|
| Login | PocketPilot |
| Dashboard | $[remaining] left · PocketPilot |
| Business | Business · PocketPilot |
| Bills | Bills ($[dueCount] due) · PocketPilot |
| Accounts | Accounts · PocketPilot |
| Analytics | Analytics · PocketPilot |
| Settings | Settings · PocketPilot |

The Dashboard tab title showing the remaining amount means you can glance at your browser tabs and see your budget status without switching to the tab.

**Update rule:** Tab title updates whenever the page data refreshes.

---

### Keyboard Shortcuts

For power-user efficiency:

| Shortcut | Action |
|---|---|
| `1` through `6` | Navigate to page 1-6 (Dashboard, Business, Bills, Accounts, Analytics, Settings) |
| `/` | Focus search bar (on pages that have one) |
| `Escape` | Close modal, clear search, or deselect |
| `N` | Open "Add" modal (Add Bill on Bills page, Connect Account on Accounts page) |

Shortcuts only active when no input/textarea is focused. Show hint in sidebar footer: "Press 1-6 to navigate" (muted, small text).

---

### Settings Auto-Save Feedback

When user changes income config or savings goal and clicks out:

1. Field border briefly flashes champagne (0.3s)
2. Subtle "Saved" text appears next to the field (fades in, persists for 2 seconds, fades out)
3. Budget derivation card updates in real time as you type (before blur/save)
4. Sidebar arc updates after the save completes (reflects new daily budget)

**If save fails:**
- Field border flashes red
- "Failed to save" appears next to field
- "Retry" link next to error text
- Field value reverts to last saved value

---

### Desktop Ask/Chat Panel

Not in the original desktop prototype but should exist:

**Implementation:** Floating chat button (bottom right corner of main content area)
- Champagne circle, 48px, with chat bubble icon
- Click: slides open a chat panel (360px wide, right side, full height)
- Panel has: message history, input bar, close button
- Same behavior as mobile Ask tab (see Mobile Logic Contract → EVENT: User Opens Ask Tab)
- Context sent with every message: same as mobile
- Panel persists across page navigation (stays open if user switches pages)
- Close: click × or click the floating button again

---

### Cross-Page: What Happens When Income Config Changes

This affects nearly everything. Full cascade:

1. User changes Karani daily avg or Ilai biweekly in Settings
2. Auto-save fires
3. **Immediately recalculate:**
   - Estimated monthly income
   - Monthly pool (income − bills − savings)
   - Daily budget (pool ÷ days in month)
4. **Settings page updates:**
   - Budget derivation card shows new daily budget
5. **Sidebar updates:**
   - Arc gauge recalculates `pct` with new budget
   - Remaining amount changes
   - If new budget is higher: you may go from "over" to "under" (red → champagne)
   - If new budget is lower: you may go from "under" to "over" (champagne → red)
6. **On next Dashboard load:**
   - All stat cards use new income figure
   - "Month Pool" card updates
7. **On next Analytics load:**
   - Savings progress recalculates against new goal
   - Daily average comparison recalculates

---

### Cross-Page: What Happens When a Bill is Added/Deleted

Adding or deleting a bill changes the budget because bills are subtracted from income.

1. User adds or deletes a bill
2. Total bills amount changes
3. **Recalculate:**
   - Monthly pool (income − NEW total bills − savings)
   - Daily budget (new pool ÷ days)
4. Sidebar arc updates with new daily budget on next page load
5. Dashboard "Bills Due" card updates count and amount
6. Analytics "Tax Summary" may change (if business bill)
7. Settings "Budget Derivation" card shows new total bills figure

---

### Accounts Page: Refresh Button Detail

1. User clicks "Refresh" on an account card
2. Button shows spinner: "Syncing..."
3. Send `POST /api/sync/revolut` with `{ accountId: id }`
4. Server: pull latest balance and recent transactions for that account
5. On success:
   - Update balance displayed on card
   - Update "Synced [time]" to "Synced just now"
   - If new transactions found: they appear on Dashboard and Business Center on next visit
   - Spinner stops, button returns to "Refresh"
6. On failure:
   - Show error toast: "Unable to sync. Check your Revolut connection."
   - Badge changes from "Connected" (green) to "Error" (red)
   - "Refresh" becomes "Retry"

---

### Accounts Page: Disconnect Flow

1. User clicks "Disconnect" on an account card
2. Confirmation modal: "Disconnect [accountName]? Transaction history will be preserved but no new transactions will sync."
3. On confirm:
   - `DELETE /api/accounts/[id]` (soft delete — marks as disconnected, doesn't delete data)
   - Card updates: badge changes to "Disconnected" (grey), balance greyed out
   - "Disconnect" button becomes "Reconnect"
   - "Refresh" button disappears
4. "Reconnect": initiates new Revolut OAuth flow for that account

---

### Bill Delete: Cascade Effects

When a bill is deleted:

1. Bill removed from Bills page
2. Any transactions linked to that bill (`billId: id`) are unlinked but NOT deleted
3. Unlinked transactions: `isBill` set to false, now count toward daily spend retroactively
4. **Budget recalculates** (one less bill = higher pool = higher daily budget)
5. If those transactions were today: `spentToday` increases (they now count)
6. This could push user over budget — handle via standard over-budget flow

---

### Export CSV: Complete Column Spec

| Column | Format | Example |
|---|---|---|
| Date | YYYY-MM-DD | 2026-02-27 |
| Merchant | String | NinjaTrader |
| Amount | Number (2 decimal) | 199.00 |
| Entity | String | Karani Markets |
| Category | String | Software |
| Receipt | Yes/No | Yes |
| Rationale | String (may be empty) | Trading platform license — primary execution software for ES Mini futures trading |
| Account | String | Revolut Business ••7733 |
| Transaction ID | String | tx_abc123 |

- CSV uses UTF-8 encoding with BOM (for Excel compatibility)
- Filename: `PocketPilot_Business_[Entity]_[YYYY-MM].csv` or `PocketPilot_Business_All_[YYYY-MM].csv`
- If date range filter is active: filename includes range: `PocketPilot_Business_All_2026-01-01_to_2026-02-28.csv`
