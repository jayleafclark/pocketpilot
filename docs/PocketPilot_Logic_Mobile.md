# PocketPilot Mobile — Logic Contract

## What This File Is

This is the behavioral brain of the iOS app. Every event that can happen and exactly what the app should do in response. Claude Code: read this before writing any logic. If a behavior isn't in here, ask before implementing.

**This file lives in the repo root. It gets updated as the app evolves.**

---

## Core State

The app always knows these values and keeps them current:

- `dailyBudget` — derived: (estimated monthly income − total bills − savings goal) ÷ days in month
- `spentToday` — sum of all debit transactions dated today that are NOT bill payments
- `remaining` — dailyBudget − spentToday (can be negative)
- `pct` — spentToday ÷ dailyBudget (>1.0 means over budget)
- `isOverBudget` — pct > 1.0
- `monthPool` — estimated monthly income − total bills − savings goal
- `monthSpentSoFar` — sum of all non-bill debits this month
- `monthRemaining` — monthPool − monthSpentSoFar

These values recalculate every time a new transaction syncs or a bill is toggled.

---

## EVENT: New Transaction Syncs

**Trigger:** Revolut webhook fires OR polling job finds a new transaction.

**Step by step:**

1. Upsert transaction into database (dedup by `revolutTxId`)
2. Run auto-categorization:
   - Check if merchant matches any bill's `vendor` field → if yes, mark as bill payment, link to bill, set `isBill: true`
   - Check if merchant matches a previous transaction's merchant → if yes, copy that category and entity
   - If no match, call Claude API to suggest category + entity based on merchant name
   - Store suggestion but do NOT auto-apply if confidence is low — flag for user review
3. Recalculate `spentToday` and `remaining`
4. Update Home screen arc gauge (if app is open)
5. Update widget timeline (WidgetKit reload)
6. Update Dynamic Island Live Activity (if active)
7. Send push notification:
   - **If within notification hours (7am–10pm local):**
     - Title: merchant name
     - Body: "-$[amount] · $[remaining] left today"
     - If `remaining` just went negative (was positive before this tx): add "You're $[over] over budget today"
     - If transaction is uncategorized: add action button "Categorize"
     - If transaction amount > $50 and entity is unknown: add action button "Personal or Business?"
   - **If outside notification hours:** queue for morning briefing, do NOT send now (unless amount > 2× daily budget, which suggests fraud — send immediately with "Unusual charge" title)

**What shows on screen (if app is open on Home tab):**
- Arc gauge animates to new `pct` value
- Remaining number updates with a brief count-down animation
- New transaction slides into "Today" list at the top with a subtle highlight that fades after 2 seconds
- If just crossed over budget: arc color transitions from champagne to red, number turns red, "over" label appears

**What shows on screen (if app is open on Activity tab):**
- New transaction appears at top of list with "New" badge
- Badge fades after 5 seconds or when user scrolls

---

## EVENT: User Opens the App

**Trigger:** App moves to foreground.

**Step by step:**

1. Check if cached data is stale (older than 5 minutes)
2. If stale: pull fresh budget calculation from `/api/budget`
3. Pull today's transactions from `/api/transactions?date=today`
4. Pull upcoming bills (unpaid, due within 7 days)
5. Update Home screen with fresh data
6. If there are unreviewed transactions (uncategorized or unassigned entity), show a subtle badge count on the Activity tab icon

**What shows on screen:**
- Home tab loads with current arc gauge, remaining amount, today's transaction list, upcoming bills
- If it's a new day since last open: arc resets to 0%, remaining shows full daily budget, "yesterday" section appears with yesterday's summary
- If there are pending review items: Activity tab icon shows champagne badge with count

---

## EVENT: User Categorizes a Transaction

**Trigger:** User taps a transaction → category sheet appears → user selects category.

**Step by step:**

1. Show category sheet with all 10 categories:
   - Food & Drink, Groceries, Transport, Shopping, Entertainment, Software, Equipment, Office, Contractors, Other
2. User taps a category
3. If entity is not yet assigned, immediately show entity picker:
   - Personal, Karani Markets, Ilai Collective
4. Save category + entity to database via `PATCH /api/transactions/[id]`
5. If entity is business (trading or creative):
   - Show brief toast: "Business expense — add rationale?"
   - If user taps toast: open rationale editor
   - If user ignores: dismiss after 3 seconds, rationale can be added later
6. Remove "New" badge from transaction
7. Update any badge counts

**What shows on screen:**
- Category sheet slides up from bottom (half-sheet, not full screen)
- Selected category gets champagne highlight
- Entity picker appears inline below category selection (not a new sheet)
- After save: sheet dismisses, transaction row updates with category pill and entity badge
- Brief success haptic (light tap)

---

## EVENT: User Toggles a Bill as Paid

**Trigger:** User taps the circle indicator next to a bill on Home screen or More tab.

**Step by step:**

1. Optimistic update: immediately show checkmark and strikethrough
2. Send `PATCH /api/bills/[id]` with `{ paidThisMonth: true }`
3. Recalculate budget:
   - Toggling a bill paid does NOT change daily budget (bills are already subtracted from income before budget calculation)
   - But it updates the "Bills Due" count and amount on Home screen
4. Update Dashboard stat cards
5. Brief success haptic

**What shows on screen:**
- Circle fills with green, checkmark appears
- Bill name gets strikethrough and 50% opacity
- "Bills Due" card on Home updates count and amount
- If all bills are now paid: "Bills Due" card shows "All paid ✓" in green

**Reverse (untoggle):**
- Same flow in reverse
- Circle empties, strikethrough removed
- Stats update

---

## EVENT: Deposit Received

**Trigger:** A credit transaction syncs from Revolut (type: "credit", not a refund).

**Step by step:**

1. Identify the deposit:
   - Check if amount matches expected Karani daily average (±20%) → tag as trading income
   - Check if amount matches expected Ilai biweekly (±10%) → tag as Ilai income
   - If neither: tag as "Other Income" and flag for review
2. Record in database as credit transaction
3. Recalculate month's actual income vs expected
4. Send push notification:
   - Title: "Deposit received"
   - Body: "$[amount] from [source/entity]"
   - If there are unpaid bills: add line "You have $[unpaidTotal] in bills due — transfer recommended"
   - Action button: "View" → opens app to Activity tab filtered to this transaction
5. Update Dashboard "Deposited" stat card

**What shows on screen (if app is open):**
- Green "+" amount appears in Activity list
- "Deposited" card on Home updates
- If deposit is from a known entity: entity badge shows on the transaction row

**Transfer recommendation logic:**
- After a deposit, check total unpaid bills
- If unpaid bills > 0 AND deposit amount > unpaid bills total:
  - Show a card on Home screen: "Transfer $[unpaidTotal] to cover bills"
  - Card has a "Done" button (marks recommendation as dismissed, doesn't actually transfer)
  - Card persists until dismissed or all bills are toggled paid
- If deposit amount < unpaid bills total:
  - Show softer message: "$[deposit] received — $[shortfall] still needed for bills"

---

## EVENT: User Goes Over Budget

**Trigger:** `spentToday` exceeds `dailyBudget` (remaining goes negative).

**Step by step:**

1. Arc gauge transitions from champagne gold to red
2. Remaining number shows negative: "-$12"
3. "left" label changes to "over"
4. Calculate recovery plan:
   - `daysRemaining` = days left in month
   - `adjustedDaily` = (monthRemaining + remaining) ÷ daysRemaining
   - `recoveryDays` = ceiling of (overAmount ÷ (dailyBudget - averageDailySpend))
5. Show over-budget sheet (slides up from bottom, not a notification):
   - "You're $[over] over today's budget"
   - "Spend $[adjustedDaily] or less for the next [recoveryDays] days to get back on track"
   - "Monthly pool: [pct]% remaining"
   - "Got it" button dismisses
6. Send push notification (once per day, not per transaction):
   - Title: "Over budget today"
   - Body: "Spend $[adjustedDaily]/day for the next [recoveryDays] days to recover"
   - Only send this once per day — if they keep spending, don't spam
7. Update Dynamic Island: compact view shows red amount
8. Update widget: arc turns red

**What shows on screen:**
- Arc color change is animated (0.3s transition)
- Number change is animated (count up/down)
- Over-budget sheet is informational, not scolding — calm tone, concrete numbers
- Sheet auto-dismisses after 10 seconds if user doesn't interact

**Recovery tracking:**
- Once over budget, the "over" state persists for the rest of the day
- Next morning at midnight: budget resets, arc goes back to 0%, champagne gold
- If user was over yesterday: morning briefing mentions it ("Yesterday: $12 over — adjusted today's target to $103")

---

## EVENT: Morning Briefing Fires

**Trigger:** Cron job at 8:00 AM local time (adjusted for user's timezone).

**Step by step:**

1. Calculate today's budget (standard derivation)
2. Check if yesterday was over/under:
   - If under: include "Yesterday: $[saved] saved 🎉"
   - If over: include adjusted daily for recovery
3. Check upcoming bills (due within 7 days)
4. Check month tracking (% of pool remaining vs % of month elapsed)
5. Compose notification:
   - Title: "Good morning ☀️"
   - Body line 1: "Today's budget: $[daily]"
   - Body line 2: if bills due this week, "[billName] ($[amount]) due [dayName]"
   - Body line 3: "Month pool: $[remaining] ([pct]% remaining)"
6. Send via OneSignal
7. Refresh widget timeline

**Quiet hours exception:** This notification always sends at 8am even if quiet hours are configured to end later. It IS the start of the day.

---

## EVENT: Bill Due Today

**Trigger:** Cron job at 8:00 AM checks bills where `dueDay` = today's date AND `paidThisMonth` = false.

**Step by step:**

1. For each unpaid bill due today:
   - Send push notification:
     - Title: "[billName] due today"
     - Body: "$[amount] · Pay from [accountName]"
     - Action button: "Mark Paid"
   - If "Mark Paid" tapped: toggle bill paid (same flow as EVENT: User Toggles Bill)
2. If multiple bills due today: batch into single notification
   - Title: "[count] bills due today"
   - Body: list each bill name + amount
   - Action button: "View Bills"

---

## EVENT: Bill Shortfall Warning

**Trigger:** Cron job 3 days before a bill's due date. Checks if account balance + expected deposits before due date can cover the bill.

**Step by step:**

1. Calculate expected available: current account balance + (remaining trading days before due × daily average)
2. If expected available < bill amount:
   - Send push notification:
     - Title: "Shortfall warning"
     - Body: "[billName] ($[amount]) due in 3 days — you may be $[shortfall] short"
   - Only send this once per bill per month
3. If expected available >= bill amount: do nothing

---

## EVENT: End of Day

**Trigger:** Cron job at 9:00 PM local time.

**Step by step:**

1. Calculate today's final status
2. **If under budget:**
   - Send notification:
     - Title: "Under budget today 🎉"
     - Body: "$[saved] saved · [streakCount]-day streak"
   - Track streak: consecutive days under budget
3. **If over budget:**
   - Do NOT send end-of-day notification (already sent the over-budget alert earlier)
4. **If exactly on budget (within $1):**
   - Send: "Right on target today · $0 under budget"

---

## EVENT: Weekly Summary

**Trigger:** Cron job Sunday at 7:00 PM local.

**Step by step:**

1. Calculate the week's stats:
   - Total spent (non-bill)
   - Daily average
   - Days under budget vs over
   - Longest streak
   - Top category
   - Business expenses total + receipt attachment rate
2. Send notification:
   - Title: "Your week in review"
   - Body: "Spent $[total] · Avg $[avg]/day · [underDays] of 7 days under budget"
   - Action: "View Details" → opens Analytics tab

---

## EVENT: Friday Receipt Reminder

**Trigger:** Cron job Friday at 3:00 PM local.

**Step by step:**

1. Count business transactions this week with `receipt: false`
2. If count > 0:
   - Send notification:
     - Title: "Missing receipts"
     - Body: "[count] business expenses this week without receipts · $[total] in deductions at risk"
     - Action: "Review" → opens Business section in app
3. If count = 0: do nothing (no need to send "all good" for receipts)

---

## EVENT: User Records Voice Note

**Trigger:** User holds mic button on any screen.

**Step by step:**

1. Start audio recording (AVAudioRecorder, .m4a format)
2. Show recording indicator: pulsing red dot + duration timer
3. User releases button → stop recording
4. Show "Processing..." state
5. Upload audio to `/api/voice`
6. Server: send to Whisper API → get transcript
7. Server: send transcript to Claude → extract structured data:
   - Amount (if mentioned)
   - Merchant (if mentioned)
   - Category (if mentioned or inferable)
   - Entity (if mentioned)
   - Note (everything else)
8. Return structured data to app
9. Show review card:
   - Transcript text (editable)
   - Extracted fields pre-filled (each editable)
   - "Save" button
10. On save: create transaction via `POST /api/transactions` with extracted data
11. Follow standard new transaction flow (categorization, budget update, etc.)

**What shows on screen:**
- Recording: red pulsing dot in nav bar area, waveform animation
- Processing: spinner with "Listening..."
- Result: card with transcript + extracted fields, all editable
- If extraction failed: show just the transcript with empty fields for manual entry

---

## EVENT: User Scans Receipt

**Trigger:** User taps camera icon on a transaction detail view OR from Business Center.

**Step by step:**

1. Open camera (or photo picker)
2. User takes photo / selects image
3. Show "Reading receipt..." state
4. Upload image to `/api/ocr`
5. Server: send to Google Vision TEXT_DETECTION → get raw text
6. Server: parse for merchant, amount, date, line items
7. Return structured data to app
8. Show confirmation card:
   - Receipt image thumbnail
   - Extracted: merchant, amount, date
   - "Attach to [transactionName]" button (if came from a transaction)
   - OR "Create new transaction" button (if standalone)
9. On attach: upload image to R2 via `/api/receipts/upload`, link to transaction, set `receipt: true`
10. On create new: pre-fill transaction creation with extracted data

**What shows on screen:**
- Camera opens with "Point at receipt" hint
- Processing: receipt image with scanning animation overlay
- Result: extracted data with image thumbnail, confirm or edit
- Success: green checkmark, "Receipt attached" toast

---

## EVENT: User Opens Ask Tab

**Trigger:** User navigates to Ask tab.

**Step by step:**

1. Load conversation history (stored locally, cleared on logout)
2. If first time: show welcome message:
   - "Ask me anything about your finances. I have access to your budget, transactions, bills, and accounts."
3. User types or voice-records a message
4. Send to `/api/ai/ask` with context:
   - Today's budget status (daily, spent, remaining, pct)
   - This month's overview (pool, spent, remaining)
   - Last 20 transactions
   - All bills with paid/unpaid status
   - All account balances
   - Entity info (Karani + Ilai)
5. Stream Claude's response back to the chat interface
6. Display response with proper formatting (bold, numbers in mono font)

**What shows on screen:**
- Chat interface: user messages right-aligned, Claude messages left-aligned
- Claude messages stream in word by word
- If Claude references a number: displayed in JetBrains Mono
- If Claude references a transaction: tappable link that opens transaction detail
- Input bar at bottom: text field + mic button + send button

---

## EVENT: 1st of the Month

**Trigger:** Cron job at midnight on the 1st.

**Step by step:**

1. Reset ALL bills to `paidThisMonth: false`
2. Archive last month's summary:
   - Total income received
   - Total spent (non-bill)
   - Total bills paid
   - Total saved
   - Days under/over budget
   - Top 5 categories
   - Business expenses total by entity
   - Receipt attachment rate
3. Recalculate daily budget for new month (new number of days)
4. Clear any stale transfer recommendations
5. Morning briefing (at 8am) will include: "New month! Budget reset to $[daily]/day"

---

## WIDGET BEHAVIOR

### Small Widget (2×2)
- Shows: arc gauge (42px) + remaining amount centered
- Arc color: champagne if under, red if over
- Updates: on every transaction, on app foreground, on timeline reload (every 15 min)
- Tap: opens app to Home tab

### Medium Widget (4×2)
- Shows: arc gauge (42px) + remaining + "of $[budget]" + last 2 transactions (merchant + amount)
- Updates: same as small
- Tap: opens app to Home tab

### Lock Screen Widget (circular)
- Shows: mini arc + dollar amount
- Monochrome (system tint)
- Updates: same as small
- Tap: opens app

### Lock Screen Widget (rectangular)
- Shows: "PocketPilot" label + "$[remaining] left" OR "-$[over] over"
- Monochrome
- Tap: opens app

---

## DYNAMIC ISLAND

### Compact (when budget tracking is active as Live Activity)
- Leading: mini arc icon (12px)
- Trailing: remaining amount "$88" or "-$12" in red
- Tap: expands to expanded view

### Expanded
- Top: "Today's Budget" label
- Center: arc gauge (60px) with remaining amount
- Bottom left: "Spent: $[spent]"
- Bottom right: "Pool: $[monthRemaining]"
- Tap: opens app to Home tab

### When to show Live Activity:
- Start: when app goes to background (if user has enabled it in Settings)
- Update: on every new transaction
- End: at midnight (budget resets) or when user disables

---

## NOTIFICATION RULES

### Quiet Hours
- Default: 10pm–7am local
- Configurable in Settings
- During quiet hours: queue notifications, deliver at quiet hours end
- **Exceptions that always send:**
  - Transaction > 2× daily budget (potential fraud)
  - Bill due TODAY and unpaid (critical)

### Frequency Caps
- Over-budget alert: max 1 per day
- Bill shortfall: max 1 per bill per month
- Receipt reminder: max 1 per week (Friday)
- Weekly summary: 1 per week (Sunday)
- Morning briefing: 1 per day

### Action Buttons (interactive notifications)
- "Categorize" → opens app to transaction detail with category sheet
- "Mark Paid" → toggles bill paid without opening app
- "Personal or Business?" → shows two buttons (Personal | Business) → quick assign
- "View" → opens app to relevant screen
- "View Details" → opens Analytics tab

---

## ERROR STATES

### No Internet
- Show cached data with "Last updated [time]" indicator
- Disable actions that require API (save, sync)
- Queue actions locally, sync when reconnected
- Show subtle offline banner at top of Home screen

### Revolut Sync Failed
- Show "Sync error" on Accounts page
- Retry automatically in 5 minutes
- If 3 consecutive failures: send notification "Unable to sync accounts — check Revolut connection"
- Budget calculations use last known data

### Empty States
- 0 transactions today: "No spending yet today. Budget: $[daily]" with large arc at 0%
- 0 bills: "No recurring bills set up" with "Add Bill" button
- 0 accounts: "Connect your first account to get started" with "Connect" button
- 0 business expenses: "No business expenses this month" (in Business tab of Reports)

---

*This file is the behavioral authority for the iOS app. The Master Spec defines what to build. The Blueprint defines how. This file defines when and why.*

---

## APPENDIX: AUDIT — Additional Scenarios

The following scenarios were identified during audit and must be handled:

---

### EVENT: Refund Received

**Trigger:** A credit transaction syncs where type is "credit" AND amount matches a recent debit (within 7 days, ±$0.50).

**Step by step:**

1. Flag as potential refund (not income)
2. Link to the original debit transaction if match found
3. **Refund DOES reduce today's spend** — if the original debit was today, subtract refund from `spentToday`
4. **Refund does NOT count as income** — do not add to "Deposited" stat
5. Recalculate `remaining` and `pct`
6. If the refund brings you back under budget (were over, now under): arc transitions red → champagne
7. Send notification:
   - Title: "Refund received"
   - Body: "+$[amount] from [merchant] · $[remaining] left today"
   - No action button needed
8. Update widget and Dynamic Island

**How to distinguish refund from deposit:**
- If credit amount matches a debit in last 7 days from same merchant → refund
- If credit amount matches income expectations (Karani ±20%, Ilai ±10%) → deposit
- If neither → tag as "Other Credit" and flag for review with notification: "Credit of $[amount] — is this a refund or income?"

---

### EVENT: User Manually Creates a Transaction

**Trigger:** User taps "+ Add" button (available on Activity tab and via voice note flow).

**Step by step:**

1. Show transaction creation sheet:
   - Merchant name (text, required)
   - Amount (number, required)
   - Date (defaults to today, picker available)
   - Category (picker, optional)
   - Entity (picker, defaults to Personal)
   - Note (text, optional)
2. "Save" button: `POST /api/transactions` with `{ type: "debit", accountId: null }`
3. Transaction has no `revolutTxId` (manual entry)
4. **Immediately update budget** — manual transactions count toward today's spend
5. Follow standard new transaction flow (arc update, widget update, etc.)
6. If date is NOT today: do NOT affect today's budget, only affects that date's historical data

**Where the + button lives:**
- Activity tab: floating action button, bottom right
- Home tab: no + button (Home is for viewing, not creating)
- Ask tab: Claude can suggest "Want me to log that?" → tapping creates the transaction

---

### EVENT: User Edits a Transaction

**Trigger:** User taps a transaction → detail view → edits a field.

**Editable fields:**
- Category (picker)
- Entity (picker)
- Note (text)
- Rationale (text, only if entity is business)
- Receipt (attach/detach)

**NOT editable:**
- Merchant name (from bank)
- Amount (from bank)
- Date (from bank)

**After any edit:**
1. Save via `PATCH /api/transactions/[id]`
2. If category changed: update Activity list pill color
3. If entity changed from personal to business: show rationale prompt
4. If entity changed from business to personal: clear rationale, show confirmation "Remove business rationale?"
5. Recalculate relevant stats (Business Center stats if entity involves business)
6. Do NOT recalculate budget (changing category doesn't change the amount spent)

---

### EVENT: User Deletes a Manual Transaction

**Trigger:** User swipes left on a manual transaction (no `revolutTxId`) → "Delete" button.

**Step by step:**

1. Confirm: "Delete this transaction? This can't be undone."
2. On confirm: `DELETE /api/transactions/[id]`
3. Remove from list
4. **Recalculate budget** — if transaction was today, `spentToday` decreases
5. Update arc, widget, Dynamic Island
6. Bank-synced transactions (those with `revolutTxId`) cannot be deleted — swipe shows no delete option

---

### EVENT: User Changes Timezone (Traveling)

**Trigger:** Device timezone changes (detected on app foreground).

**Step by step:**

1. Detect timezone change via `TimeZone.current`
2. Update user's timezone in Settings via `PATCH /api/settings`
3. **Recalculate "today"** — what counts as "today" shifts with the timezone
4. Cron jobs (morning briefing, end of day, bill reminders) adjust to new local time
5. Do NOT show any notification about timezone change — just handle it silently
6. If timezone change means it's now "tomorrow": reset daily budget, treat previous time's spending as yesterday
7. If timezone change means it's still "today" but earlier: no change, just update the clock

**Edge case:** Flying east (lose hours) could mean you "skip" part of a day. Flying west (gain hours) could mean your day is longer. The budget is always per-calendar-day in local time. If you spend $50 in New York and then fly to LA, that $50 still counts for today.

---

### EVENT: Bill Auto-Match Fires

**Trigger:** A new transaction syncs and the merchant matches a bill's `vendor` field (case-insensitive exact match or contains match).

**Step by step:**

1. Detect match: transaction merchant contains bill vendor (e.g., "GEICO" in "GEICO AUTO INSURANCE")
2. AND transaction amount is within ±10% of bill amount
3. If match found:
   - Auto-set `isBill: true` on the transaction
   - Link transaction to bill via `billId`
   - Auto-toggle bill as `paidThisMonth: true`
   - **This transaction does NOT count toward daily spend** (bills are excluded from budget)
   - Send notification:
     - Title: "[billName] paid"
     - Body: "$[amount] matched and marked as paid"
     - No action needed (auto-handled)
4. If merchant matches but amount doesn't:
   - Do NOT auto-match
   - Send notification: "[merchant] charged $[amount] — matches [billName] ($[billAmount]). Mark as bill payment?"
   - Action button: "Yes" → link and mark paid / "No" → treat as regular expense
5. Update Home screen "Bills Due" count

---

### EVENT: Multiple Transactions Sync at Once

**Trigger:** Polling job finds 3+ new transactions in one batch (common after being offline).

**Step by step:**

1. Process each transaction individually (categorization, bill matching, etc.)
2. **But batch notifications** — do NOT send 5 separate push notifications
3. If 3+ transactions in one sync:
   - Send single notification:
     - Title: "[count] new transactions"
     - Body: "$[totalAmount] total · $[remaining] left today"
     - Action: "Review" → opens Activity tab
4. Update arc once after all transactions processed (not per-transaction)
5. Update widget once after all processed

---

### EVENT: Arc Gauge Update Rules (Complete)

The arc is the most important visual in the app. Here's every scenario:

| State | Arc Color | Number | Label | Number Color |
|-------|-----------|--------|-------|-------------|
| Day starts, $0 spent | Champagne track only (empty) | $[budget] | "today" | Black |
| Spent < 50% of budget | Champagne, fills clockwise | $[remaining] | "left" | Black |
| Spent 50-85% of budget | Champagne, fills more | $[remaining] | "left" | Black |
| Spent 85-100% of budget | Champagne, nearly full | $[remaining] | "left" | Dark champagne (warning tone) |
| Exactly at budget ($0 left) | Champagne, full circle | $0 | "left" | Champagne |
| Spent > budget (over) | Red | -$[over] | "over" | Red |
| Refund brings back under | Champagne (transition from red) | $[remaining] | "left" | Black |

**Animation rules:**
- Fill change: 0.4s ease-in-out
- Color change (champagne ↔ red): 0.3s transition
- Number change: count animation over 0.3s (counts from old to new)
- On day reset (midnight): arc empties with 0.5s animation, color resets to champagne

**85% warning threshold:**
- When pct reaches 0.85, the remaining number subtly changes to a darker champagne (#8E7338) as a gentle warning
- No notification at 85% — this is visual only
- The arc itself stays champagne (doesn't change color until over)

---

### EVENT: Streak Tracking (Complete Rules)

A "streak" is consecutive calendar days where `spentToday ≤ dailyBudget`.

**Tracking:**
- Stored as `currentStreak` (integer) and `lastUnderBudgetDate` (date)
- If today ends under budget: `currentStreak += 1`, update `lastUnderBudgetDate`
- If today ends over budget: `currentStreak = 0`
- If a day has zero transactions: counts as under budget (you spent $0)
- Streaks reset at midnight, calculated during end-of-day cron

**Where streaks appear:**
- End of day notification: "Under budget today 🎉 · [streak]-day streak"
- Weekly summary: "Longest streak this week: [n] days"
- Analytics → Daily Average card: "Longest streak: [n] days"
- Home screen: nowhere (Home is clean, streaks are in notifications and reports)

**All-time best streak:**
- Tracked in database: `bestStreak` (integer)
- If `currentStreak > bestStreak`: update and mention in end-of-day notification: "New record! [n]-day streak 🏆"

---

### EVENT: Notification Tap Behavior (Complete)

Every notification type needs a defined destination when tapped:

| Notification | Tap Destination |
|---|---|
| Morning briefing | Home tab |
| Transaction alert | Activity tab, scrolled to that transaction |
| Large transaction alert | Activity tab, that transaction with category sheet pre-opened |
| Over budget alert | Home tab (over-budget sheet auto-shows) |
| Bill due today | Home tab, scrolled to bills section |
| Bill shortfall warning | More tab → Bills section |
| Deposit received | Activity tab, filtered to that transaction |
| End of day (under budget) | Home tab |
| Weekly summary | Reports tab → analytics |
| Receipt reminder | Reports tab → Business section |
| Unusual charge (fraud) | Activity tab, that transaction highlighted in red |
| Bill auto-matched | Home tab (bill is already marked paid) |
| Sync error | More tab → Accounts section |
| "[count] new transactions" (batch) | Activity tab |

**If app is already open when notification tapped:**
- Navigate to the correct tab
- If already on that tab: scroll to the relevant item and highlight it briefly

---

### EVENT: Midnight Budget Reset (Detailed)

**Trigger:** Device time crosses midnight (local time).

**If app is in foreground:**
1. At exactly 00:00:00 local:
   - Arc animates from current fill → 0% (0.5s ease-out)
   - Number counts from current remaining → full daily budget (0.3s)
   - If was over budget: red transitions to champagne during the animation
   - "over" label changes to "today"
2. "Yesterday" summary appears above today's (now empty) transaction list:
   - "Yesterday: Spent $[amount] · $[saved] under" OR "Yesterday: $[over] over budget"
   - Collapsible — tap to expand and see yesterday's transactions
3. Today's transaction list is empty: "No spending yet today. Budget: $[daily]."
4. Widget timeline reloads
5. Dynamic Island updates to show fresh budget
6. Live Activity resets

**If app is in background:**
- Widget updates on next timeline reload (within 15 min)
- Dynamic Island updates immediately (Live Activity push)
- Home screen state updates when app next comes to foreground

**If app is closed:**
- Nothing happens until next open, which triggers EVENT: User Opens the App

---

### EVENT: Revolut Token Expiry

**Trigger:** Token refresh fails (Revolut returns 401).

**Step by step:**

1. Log the failure
2. Retry once after 30 seconds
3. If retry fails:
   - Mark account status as "error" in database
   - Send notification (within notification hours):
     - Title: "Connection issue"
     - Body: "Unable to sync with Revolut. Tap to reconnect."
     - Tap destination: More tab → Accounts → reconnect flow
4. Budget calculations continue with last known data
5. Show "Last synced [time]" on any affected accounts
6. Do NOT repeatedly attempt refresh — wait for user to reconnect
7. If user reconnects: new OAuth flow, fresh tokens, full sync

---

### EVENT: Receipt File Upload (Mobile Detail)

**Trigger:** User taps receipt attachment icon on a transaction detail view.

**Step by step:**

1. Show action sheet: "Take Photo" / "Choose from Library" / "Cancel"
2. If camera:
   - Open camera in photo mode (not video)
   - Auto-crop hint: show overlay rectangle suggesting receipt framing
   - User takes photo → show preview with "Use Photo" / "Retake"
3. If library:
   - Open photo picker (limited to images only)
   - User selects image
4. Show upload progress indicator (on the receipt icon area of the transaction)
5. Upload to `/api/receipts/upload` as multipart form data
6. Server: store in R2, return URL
7. Link URL to transaction via `PATCH /api/transactions/[id]` with `{ receipt: true, receiptUrl: url }`
8. Show green checkmark on receipt status
9. Receipt image is viewable by tapping the checkmark later → shows full-screen image with "Remove" option

**File size handling:**
- Compress image to max 2MB before upload (JPEG quality 0.7)
- If original is already under 2MB: upload as-is
- Max dimension: 2048px on longest side
- Show error if upload fails: "Upload failed. Try again?" with retry button

---

### EVENT: Ask Tab Context Refresh

**Trigger:** User has been chatting in Ask tab and navigates away, then comes back.

**Step by step:**

1. Conversation history persists locally (not cleared on tab switch)
2. On return to Ask tab: refresh the context sent with the next message
   - Fresh budget data
   - Fresh last 20 transactions
   - Fresh bill status
3. Do NOT re-send old messages — just update the context for the NEXT message
4. If user hasn't chatted in 30+ minutes: show a subtle "Context refreshed" indicator
5. If user logs out: clear all conversation history

**Context that goes with every message to Claude:**
```
Today's budget: $[daily] | Spent: $[spent] | Remaining: $[remaining]
Month: $[monthSpent] of $[monthPool] spent | [daysLeft] days left
Bills: [paidCount]/[totalCount] paid | $[unpaid] still due
Accounts: [list with balances]
Entities: Karani Markets (trading), Ilai Collective (creative)
Last 20 transactions: [date, merchant, amount, category, entity for each]
```

---

### EVENT: Duplicate Transaction Detection

**Trigger:** During sync, a transaction matches an existing manual entry (same merchant ±1 day, same amount).

**Step by step:**

1. Detect potential duplicate:
   - Same merchant name (fuzzy match, case-insensitive)
   - Same amount (exact)
   - Within 1 day of each other
   - One has `revolutTxId`, the other doesn't (manual vs synced)
2. Do NOT auto-delete either one
3. Send notification:
   - Title: "Possible duplicate"
   - Body: "[merchant] $[amount] — appears in both your bank feed and manual entries"
   - Action: "Review" → opens Activity tab with both highlighted
4. User decides: keep both, delete the manual one, or merge (keep bank record, copy notes/category from manual)

---

### EVENT: No Trading Days (Weekend/Holiday)

**Trigger:** On weekends or market holidays, no Karani trading income is expected.

**Step by step:**

1. Budget derivation uses 22 trading days per month (already accounted for)
2. On non-trading days: no change to daily budget — budget is already averaged across all 31 days
3. If user marks a day as a "no-trade day" (future feature): no impact on budget
4. Morning briefing on weekends: omit "trading day" language, just show budget
5. Deposit identification: if a credit comes on a weekend that matches Karani range, still tag as trading income (settlements can arrive on any day)

---

### EVENT: App Force Quit / Crash Recovery

**Trigger:** User force-quits or app crashes mid-action.

**Step by step:**

1. Any pending API calls that didn't complete: lost (not queued)
2. On next app open: standard EVENT: User Opens the App flow
3. Locally queued offline actions: still in queue, will sync on reconnection
4. Conversation history in Ask tab: still persisted (stored in UserDefaults)
5. Draft rationale text: lost (not persisted mid-edit)
6. Unsaved voice memo: lost (audio file is temporary)
7. Unsaved receipt photo: lost (not yet uploaded)
8. No crash recovery notification — just clean start on next open

---

### NOTIFICATION: Complete Catalog

Every notification the app can send, with exact copy:

| ID | Title | Body Template | Time | Frequency Cap | Action Buttons | Tap Destination |
|---|---|---|---|---|---|---|
| morning | Good morning ☀️ | Today's budget: $[daily]. [billInfo]. Month pool: $[remaining] ([pct]%). | 8:00 AM | 1/day | — | Home |
| tx_single | [merchant] | -$[amount] · $[remaining] left today | On sync | None | Categorize (if uncategorized) | Activity → tx |
| tx_large | [merchant] | -$[amount] · $[remaining] left today | On sync | None | Personal or Business? | Activity → tx |
| tx_batch | [count] new transactions | $[total] total · $[remaining] left today | On sync | None | Review | Activity |
| tx_fraud | Unusual charge | $[amount] at [merchant] — verify this is yours | On sync | None | View | Activity → tx (red) |
| over_budget | Over budget today | Spend $[adjusted]/day for [days] days to recover | On cross | 1/day | — | Home |
| bill_due | [billName] due today | $[amount] · Pay from [account] | 8:00 AM | 1/bill/day | Mark Paid | Home → bills |
| bill_multi | [count] bills due today | [list of bills + amounts] | 8:00 AM | 1/day | View Bills | Home → bills |
| bill_short | Shortfall warning | [billName] ($[amount]) due in 3 days — may be $[short] short | 8:00 AM | 1/bill/month | — | More → bills |
| deposit | Deposit received | $[amount] from [entity]. [transfer recommendation if applicable] | On sync | None | View | Activity → tx |
| eod_under | Under budget today 🎉 | $[saved] saved · [streak]-day streak | 9:00 PM | 1/day | — | Home |
| eod_record | New record! 🏆 | [streak]-day streak — your longest yet | 9:00 PM | 1/day | — | Home |
| weekly | Your week in review | Spent $[total] · Avg $[avg]/day · [under] of 7 under budget | Sun 7 PM | 1/week | View Details | Reports |
| receipts | Missing receipts | [count] biz expenses without receipts · $[total] at risk | Fri 3 PM | 1/week | Review | Reports → biz |
| bill_auto | [billName] paid | $[amount] matched and marked as paid | On sync | None | — | Home |
| bill_verify | [merchant] charged $[amt] | Matches [billName] ($[billAmt]). Mark as bill payment? | On sync | None | Yes / No | Activity → tx |
| sync_error | Connection issue | Unable to sync with Revolut. Tap to reconnect. | On failure | 1/per error | — | More → accounts |
| duplicate | Possible duplicate | [merchant] $[amount] — in bank feed and manual entries | On sync | None | Review | Activity |
| new_month | New month! | Budget reset to $[daily]/day. [lastMonthSummary] | 8:00 AM (1st) | 1/month | — | Home |

---

## APPENDIX 2: FINAL AUDIT — Engineer Blockers

These are scenarios where an engineer would stop and say "I don't know what to do here." All resolved below.

---

### BUDGET FORMULA: Complete Specification

The daily budget is THE core number. Here's the exact math with every edge case:

```
estimatedMonthlyIncome = (karaniDailyAvg × 22) + (ilaiBiweekly × 2)
totalMonthlyBills = SUM of all active bills (adjusted for frequency — see below)
monthPool = estimatedMonthlyIncome − totalMonthlyBills − savingsGoal
daysInMonth = actual days in current month (28/29/30/31)
dailyBudget = monthPool ÷ daysInMonth
```

**Bill frequency adjustment for monthly total:**
- Monthly bills: amount × 1
- Quarterly bills: amount ÷ 3 (prorate to monthly)
- Annual bills: amount ÷ 12 (prorate to monthly)

**What if `monthPool` is negative?**
- This means bills + savings exceed income estimate
- `dailyBudget` will be negative
- Arc shows $0 with red color immediately
- Morning briefing: "⚠️ Your bills and savings exceed your estimated income by $[shortfall]. Adjust in Settings."
- App still functions — transactions still tracked, just no positive budget to work with
- Settings page shows the derivation card with the negative number highlighted red

**What if `dailyBudget` is $0?**
- Arc shows "$0" with "today" label
- Any transaction immediately puts you over budget
- This is a valid state (income exactly equals fixed costs)

**What about days already passed?**
- The budget does NOT redistribute remaining pool across remaining days
- Each day gets the same flat amount: pool ÷ total days in month
- If you underspend Monday, Tuesday's budget is still the same — the surplus goes to `monthRemaining` which is visible but doesn't change daily targets
- Rationale: keeps the daily number consistent and predictable. The "recovery plan" handles adjustments when you go over.

**Rounding:**
- `dailyBudget`: round to nearest dollar (no cents in the hero number)
- `remaining`: round to nearest dollar
- `spentToday`: show cents (e.g., $72.40) in the detail area, but the arc hero number is rounded
- `monthPool` and `monthRemaining`: round to nearest dollar
- Transaction amounts: always show 2 decimal places ($6.40)

---

### MOBILE TAB BAR: Complete Structure

The app has 5 tabs. An engineer needs to know exactly what each is:

| Tab | Icon | Label | Badge | What It Shows |
|---|---|---|---|---|
| 1. Home | House | Home | Never | Arc gauge, today's spend, bills due, transfer recommendations |
| 2. Activity | Clock/List | Activity | Count of uncategorized txs | All transactions (scrollable, grouped by date), search, filter |
| 3. Reports | Chart bars | Reports | Never | Two sub-tabs: "Personal" (spending chart, categories, savings) and "Business" (entity filter, receipts, rationale, export) |
| 4. Ask | Chat bubble | Ask | Never | Claude conversation |
| 5. More | Three dots / Gear | More | Never | Bills management, Accounts, Settings, About |

**Tab bar design:**
- Fixed at bottom, 50pt height, white background with subtle top border
- Active tab: champagne gold icon + label
- Inactive tab: grey icon + label (50% opacity)
- Tab bar visible on all tabs (never hidden)

---

### MOBILE TRANSACTION DETAIL VIEW

When user taps a transaction in Activity or Home, what exactly shows?

**Layout (full screen, push navigation):**
1. **Header area:**
   - Back arrow (top left)
   - Merchant name (large, 20pt, Bodoni Moda)
   - Amount below merchant (28pt, JetBrains Mono, red if debit, green if credit)
   - Date + time (muted text)
2. **Category + Entity row:**
   - Category pill (tappable → opens category sheet)
   - Entity badge (tappable → opens entity picker)
   - If uncategorized: "Add category" placeholder text (champagne, tappable)
3. **Receipt section:**
   - If no receipt: "+ Attach Receipt" button (opens camera/library action sheet)
   - If receipt attached: thumbnail image (tappable → full screen view) + "Remove" option
4. **Rationale section (only if entity is business):**
   - If no rationale: "Add business rationale" text area (tappable → opens editor)
   - If has rationale: displayed text + "Edit" button + "✨ Regenerate" button
5. **Note section:**
   - If no note: "Add note" placeholder (tappable → text editor)
   - If has note: displayed text + "Edit" button
6. **Meta info (bottom, muted):**
   - Source: "Revolut ••7733" or "Manual entry"
   - Transaction ID (mono, 10pt, for debugging)
   - If bill-linked: "Linked to: [billName]"

**Swipe back:** standard iOS back swipe gesture works

---

### FIRST-TIME USER: Onboarding Flow

What happens the very first time someone opens the app after signing in?

1. **No accounts connected:**
   - Home screen shows the arc at $0 with no data
   - Prominent card: "Connect your bank to get started"
   - Tapping opens account connection flow (Revolut OAuth)
   - Skip option: "Set up manually" → goes to Settings

2. **No income configured:**
   - After connecting accounts OR choosing manual:
   - Show income setup sheet:
     - "How much do you earn from trading? (daily average)"
     - "How much from Ilai Collective? (biweekly)"
     - "Monthly savings goal?"
   - Save → daily budget calculates for first time
   - Arc fills with today's budget

3. **No bills:**
   - After income is set:
   - "Add your recurring bills so we can calculate your true daily budget"
   - List of common bill suggestions: Rent, Car Insurance, Phone, Internet, Subscriptions
   - "Skip for now" → bills can be added later
   - Each bill added recalculates budget in real time

4. **No entities:**
   - Entities (Karani + Ilai) are seeded automatically during first setup
   - No user action needed — they're created from the blueprint config

5. **Onboarding complete:**
   - "You're all set! Your daily budget is $[daily]."
   - Show the arc with first budget
   - Dismiss → standard Home screen

**If user skips everything:**
- App works with $0 income, $0 bills, $0 savings = $0 daily budget
- Everything functions, just shows zeros
- Settings page has clear prompts to fill in missing data

---

### MULTI-CURRENCY HANDLING

Jay travels and uses Revolut which supports multiple currencies.

**When a foreign currency transaction syncs:**
1. Revolut provides the amount in original currency AND the converted USD amount
2. Store both: original amount + original currency + converted USD amount
3. Use the converted USD amount for ALL budget calculations
4. Display: "$6.40 (€5.80)" — USD first, original in parentheses
5. If Revolut doesn't provide conversion (rare): use the original amount and flag for review
6. Category, entity, rationale — all work the same regardless of currency

**In transaction lists:**
- Show USD amount as the primary number
- Show original currency only if it's not USD (small text, muted)

**In budget calculations:**
- Everything is in USD
- No currency conversion logic in the app — rely on Revolut's conversion

**Schema addition needed:**
```prisma
model Transaction {
  // ... existing fields ...
  originalAmount    Float?           // Amount in original currency
  originalCurrency  String?          // "EUR", "TWD", etc.
}
```

---

### CATEGORY LIST: Complete and Final

These 12 categories are the only valid options. An engineer should not invent new ones:

| Category | Icon | Color | Typical Merchants |
|---|---|---|---|
| Food & Drink | 🍽️ | #E8A87C | Restaurants, cafes, bars, delivery |
| Groceries | 🛒 | #85B76E | Supermarkets, convenience stores |
| Transport | 🚗 | #6BA3D6 | Uber, gas, parking, metro, flights |
| Shopping | 🛍️ | #C78FD1 | Amazon, clothing, electronics |
| Entertainment | 🎬 | #E06B6B | Movies, games, streaming, events |
| Software | 💻 | #5B9BD5 | SaaS subscriptions, app purchases |
| Equipment | ⚙️ | #8E8E93 | Hardware, monitors, keyboards |
| Office | 🏢 | #B0906F | Coworking, supplies, furniture |
| Contractors | 👤 | #6BAED6 | Freelancers, agencies, services |
| Health | ❤️ | #E07070 | Pharmacy, gym, medical |
| Travel | ✈️ | #70B8D6 | Hotels, Airbnb, travel insurance |
| Other | ··· | #AEAEB2 | Anything that doesn't fit above |

**On mobile:** category sheet shows all 12 in a 3×4 grid, icon + name, tappable
**On desktop:** category is a dropdown select or pill selector in Business Center

**Note:** "Housing" is intentionally excluded — rent/mortgage should be a bill, not a daily expense category.

---

### BILL FREQUENCY: How Non-Monthly Bills Work

**Quarterly bills (e.g., estimated tax payments):**
- `dueDay` is the day of the quarter (e.g., 15th)
- Due months: Jan, Apr, Jul, Oct (or user-defined)
- `paidThisMonth` resets only on the month the bill is due
- In non-due months: bill doesn't appear in "Bills Due" section
- Budget derivation: amount ÷ 3 prorated monthly

**Annual bills (e.g., Apple Developer $99/year):**
- `dueDay` is the day, plus a `dueMonth` field needed
- Appears in "Bills Due" only in the due month
- Budget derivation: amount ÷ 12 prorated monthly

**Schema addition needed:**
```prisma
model Bill {
  // ... existing fields ...
  dueMonth      Int?                // 1-12, only for quarterly/annual
}
```

**For quarterly:** `dueMonth` stores the first due month (e.g., 1 for Jan), and the bill is due every 3 months from there (Jan, Apr, Jul, Oct).

---

### NOTIFICATION PERMISSION DENIED

What if user denies push notification permission on iOS?

1. App still works fully — notifications are a bonus, not a requirement
2. On first launch: iOS permission prompt appears (standard system dialog)
3. If denied:
   - No push notifications sent (OneSignal silently fails)
   - Widgets still update (WidgetKit doesn't need notification permission)
   - Dynamic Island still works (Live Activities don't need notification permission)
   - No in-app nag to enable — respect the user's choice
   - Settings page shows: "Notifications: Disabled (enable in iOS Settings)"
4. If user later enables in iOS Settings:
   - App detects on next foreground
   - Registers device token with OneSignal
   - Notifications begin from that point forward

---

### BIOMETRIC / FACE ID AUTH

Since this is a finance app with real money data:

1. On first login: offer Face ID/Touch ID setup: "Use Face ID to unlock PocketPilot?"
2. If enabled:
   - App requires biometric on every foreground launch
   - After 5+ minutes in background → require biometric on return
   - Failed biometric (3 attempts) → fall back to Clerk password
3. If declined:
   - App opens normally with no lock
   - Can be enabled later in Settings
4. Stored in iOS Keychain, not in database

---

### WHAT THE `/api/budget` ENDPOINT ACTUALLY RETURNS

An engineer building this endpoint needs the exact response shape:

```json
{
  "dailyBudget": 115,
  "spentToday": 72.40,
  "remaining": 43,
  "pct": 0.629,
  "isOverBudget": false,
  "monthPool": 3565,
  "monthSpentSoFar": 1823.50,
  "monthRemaining": 1741.50,
  "monthPct": 0.511,
  "daysInMonth": 31,
  "daysElapsed": 15,
  "daysRemaining": 16,
  "streak": 4,
  "bestStreak": 12,
  "billsDueThisWeek": [
    { "id": "bill_abc", "name": "Car Insurance", "amount": 187, "dueDay": 5, "dueDate": "2026-03-05" }
  ],
  "unpaidBillsTotal": 540,
  "income": {
    "estimated": 14800,
    "received": 7200,
    "pctReceived": 0.486
  },
  "savings": {
    "goal": 800,
    "actual": 412,
    "pctAchieved": 0.515
  }
}
```

Every number the arc, widget, Dynamic Island, notifications, or any UI element could need — returned in one call. No client-side calculation except `remaining = dailyBudget - spentToday` for real-time updates between API calls.

---

### TOAST SYSTEM (Mobile)

Toasts appear for brief confirmations. Complete spec:

- Position: top of screen, below status bar, centered
- Style: rounded pill, dark background (#1A1915, 90% opacity), white text, 14px
- Duration: 2.5 seconds, then fade out (0.3s)
- Max 1 toast at a time — new toast replaces current
- Haptic: light impact on appear
- Tappable: tapping dismisses immediately
- Not interruptive: does NOT block UI interaction

Toasts used for:
- "Saved" (after categorizing, editing rationale, etc.)
- "Receipt attached"
- "Bill marked as paid"
- "Transaction deleted"
- "Exported [count] transactions"
- Error: same style but with red-tinted background (#3A1515, 90% opacity)
