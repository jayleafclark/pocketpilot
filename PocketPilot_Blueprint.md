# PocketPilot — Technical Blueprint

## The Build Plan for Claude Code

**Last Updated:** March 1, 2026
**Author:** Jay + Claude
**Purpose:** Hand this document to Claude Code and build phase by phase.

---

## 1. Cost Breakdown

### Monthly Recurring

| Service | What For | Plan | Cost |
|---------|----------|------|------|
| Railway | Next.js app + Postgres + Redis + cron | Hobby | ~$5–10/mo |
| Clerk | Auth (web + iOS) | Free (under 10k MAU) | $0 |
| Revolut Business API | Bank connection (all accounts) | Free | $0 |
| Cloudflare R2 | Receipt image storage | Free (under 10GB) | $0 |
| Claude API (Anthropic) | Ask tab, categorization, rationale | Usage-based | ~$5–20/mo |
| OpenAI Whisper API | Voice-to-text for memos | $0.006/min | ~$1/mo |
| Google Cloud Vision | OCR receipt scanning | $1.50/1k images | ~$1/mo |
| OneSignal | Push notifications (APNs) | Free (unlimited mobile push) | $0 |
| GitHub | Repo hosting | Free | $0 |

### Annual

| Service | What For | Cost |
|---------|----------|------|
| Apple Developer Program | TestFlight + Xcode Cloud | $99/year ($8.25/mo) |

### Total Estimated Cost: $20–40/month

---

## 2. Tool Inventory — Accounts to Create

Create these accounts in this order:

1. **GitHub** — already have. Create repo `pocketpilot` with `/web` and `/ios` folders.
2. **Railway** (railway.app) — sign up, connect GitHub, create project with Postgres + Redis.
3. **Clerk** (clerk.com) — sign up, create app, get API keys. Install Next.js SDK + Swift SDK.
4. **Revolut Business** — go to Business Settings → API, register app, get OAuth2 credentials. Scope: READ for accounts + transactions.
5. **Apple Developer Program** (developer.apple.com) — enroll as individual ($99). Enable Xcode Cloud.
6. **Cloudflare** (cloudflare.com) — sign up, create R2 bucket `pocketpilot-receipts`. Get S3-compatible credentials.
7. **Anthropic** (console.anthropic.com) — already have. Get API key for server-side use.
8. **OpenAI** (platform.openai.com) — sign up, get API key for Whisper endpoint.
9. **Google Cloud** (console.cloud.google.com) — create project, enable Cloud Vision API, get service account key.
10. **OneSignal** (onesignal.com) — sign up, create iOS app, upload APNs certificate from Apple Developer portal.

---

## 3. Repo Structure

```
pocketpilot/
├── web/                          # Next.js app (Railway deploys this)
│   ├── app/
│   │   ├── layout.tsx            # Root layout with Clerk provider
│   │   ├── page.tsx              # Dashboard (post-login landing)
│   │   ├── sign-in/
│   │   │   └── page.tsx          # Clerk sign-in page
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── business/
│   │   │   └── page.tsx
│   │   ├── bills/
│   │   │   └── page.tsx
│   │   ├── accounts/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── webhooks/
│   │       │   └── revolut/
│   │       │       └── route.ts  # Revolut webhook handler
│   │       ├── transactions/
│   │       │   ├── route.ts      # GET list, POST categorize
│   │       │   └── [id]/
│   │       │       └── route.ts  # PATCH update tx
│   │       ├── bills/
│   │       │   ├── route.ts      # GET list, POST create
│   │       │   └── [id]/
│   │       │       └── route.ts  # PATCH update, DELETE
│   │       ├── accounts/
│   │       │   └── route.ts      # GET list, POST connect
│   │       ├── budget/
│   │       │   └── route.ts      # GET today's budget computation
│   │       ├── receipts/
│   │       │   └── upload/
│   │       │       └── route.ts  # POST upload to R2
│   │       ├── ai/
│   │       │   ├── ask/
│   │       │   │   └── route.ts  # POST chat with Claude
│   │       │   ├── categorize/
│   │       │   │   └── route.ts  # POST auto-categorize tx
│   │       │   └── rationale/
│   │       │       └── route.ts  # POST generate rationale
│   │       ├── voice/
│   │       │   └── route.ts      # POST audio → Whisper → text
│   │       ├── ocr/
│   │       │   └── route.ts      # POST image → Vision → data
│   │       └── sync/
│   │           └── revolut/
│   │               └── route.ts  # Trigger manual sync
│   ├── lib/
│   │   ├── db.ts                 # Prisma client
│   │   ├── revolut.ts            # Revolut API client
│   │   ├── r2.ts                 # Cloudflare R2 client
│   │   ├── claude.ts             # Anthropic SDK wrapper
│   │   ├── whisper.ts            # OpenAI Whisper client
│   │   ├── vision.ts             # Google Vision client
│   │   ├── onesignal.ts          # OneSignal REST client
│   │   ├── budget.ts             # Budget derivation logic
│   │   └── cron/
│   │       ├── sync-revolut.ts   # Pull transactions every 2hr
│   │       ├── morning-brief.ts  # 8am notification
│   │       ├── bill-reminder.ts  # Bill due notifications
│   │       ├── weekly-summary.ts # Sunday 7pm summary
│   │       └── end-of-day.ts     # 9pm under-budget win
│   ├── components/               # React components (match desktop prototype)
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
│
├── ios/                          # SwiftUI app (Xcode Cloud builds this)
│   ├── PocketPilot/
│   │   ├── PocketPilotApp.swift  # Entry point
│   │   ├── Models/
│   │   │   ├── Transaction.swift
│   │   │   ├── Bill.swift
│   │   │   ├── Account.swift
│   │   │   └── Budget.swift
│   │   ├── Views/
│   │   │   ├── HomeView.swift        # Main tab — arc gauge, today's budget
│   │   │   ├── ActivityView.swift     # Transaction history
│   │   │   ├── ReportsView.swift      # Personal + business reports
│   │   │   ├── AskView.swift          # Claude chat
│   │   │   └── MoreView.swift         # Settings, bills, accounts
│   │   ├── Components/
│   │   │   ├── ArcGauge.swift         # Reusable arc
│   │   │   ├── TxCard.swift
│   │   │   ├── BillRow.swift
│   │   │   └── CategorySheet.swift
│   │   ├── Services/
│   │   │   ├── APIClient.swift        # Talks to Next.js API
│   │   │   ├── AuthService.swift      # Clerk Swift SDK
│   │   │   ├── NotificationService.swift
│   │   │   └── VoiceService.swift     # Record + send to /api/voice
│   │   ├── Widgets/
│   │   │   ├── SmallWidget.swift      # 2×2 arc + amount
│   │   │   ├── MediumWidget.swift     # 4×2 arc + stats
│   │   │   └── LockScreenWidget.swift
│   │   ├── DynamicIsland/
│   │   │   └── BudgetActivity.swift   # Live Activity for Dynamic Island
│   │   └── Assets.xcassets
│   ├── PocketPilot.xcodeproj
│   └── ci_scripts/
│       └── ci_post_clone.sh          # Xcode Cloud setup script
│
└── README.md
```

---

## 4. Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String        @id @default(cuid())
  clerkId       String        @unique
  email         String        @unique
  name          String?
  timezone      String        @default("America/New_York")
  currency      String        @default("USD")
  createdAt     DateTime      @default(now())

  accounts      Account[]
  transactions  Transaction[]
  bills         Bill[]
  incomeConfig  IncomeConfig?
  entities      Entity[]
  settings      Settings?
}

model Account {
  id            String        @id @default(cuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  name          String                          // "Chase Checking"
  institution   String                          // "Revolut"
  last4         String                          // "7733"
  type          String                          // checking, savings, credit, business
  revolutId     String?       @unique           // Revolut account UUID
  balance       Float         @default(0)
  lastSynced    DateTime?
  status        String        @default("connected") // connected, error, disconnected
  createdAt     DateTime      @default(now())

  transactions  Transaction[]
}

model Transaction {
  id            String        @id @default(cuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  accountId     String
  account       Account       @relation(fields: [accountId], references: [id])
  revolutTxId   String?       @unique           // Revolut transaction ID for dedup
  merchant      String                          // "Blue Bottle Coffee"
  amount        Float                           // Always positive
  type          String        @default("debit") // debit, credit
  currency      String        @default("USD")
  category      String?                         // Food & Drink, Software, etc.
  entity        String        @default("personal") // personal, trading, creative
  date          DateTime
  description   String?                         // Raw bank description
  receipt       Boolean       @default(false)
  receiptUrl    String?                         // R2 URL
  rationale     String?                         // Business purpose
  note          String?                         // User note or voice transcript
  originalAmount Float?                         // Amount in original currency (if not USD)
  originalCurrency String?                      // "EUR", "TWD", etc.
  isBill        Boolean       @default(false)   // Matched to a bill
  billId        String?
  bill          Bill?         @relation(fields: [billId], references: [id])
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([userId, date])
  @@index([userId, entity])
  @@index([userId, category])
}

model Bill {
  id            String        @id @default(cuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  name          String                          // "Car Insurance"
  amount        Float
  dueDay        Int                             // 1-31
  dueMonth      Int?                            // 1-12, for quarterly/annual bills
  frequency     String        @default("monthly") // monthly, quarterly, annual
  vendor        String?                         // "GEICO" — for auto-matching
  category      String?
  entity        String        @default("personal")
  accountId     String?                         // Pay-from account
  paidThisMonth Boolean       @default(false)
  active        Boolean       @default(true)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  transactions  Transaction[]
}

model Entity {
  id            String        @id @default(cuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  slug          String                          // "trading", "creative"
  name          String                          // "Karani Markets LLC"
  type          String                          // "Trading", "Creative"
  taxSchedule   String        @default("Schedule C")
  description   String?
  createdAt     DateTime      @default(now())

  @@unique([userId, slug])
}

model IncomeConfig {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id])
  karaniDailyAvg    Float     @default(400)
  ilaiBiweekly      Float     @default(3000)
  savingsGoal       Float     @default(800)
  updatedAt         DateTime  @updatedAt
}

model Settings {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id])
  taxYear           Int       @default(2026)
  notificationsOn   Boolean   @default(true)
  quietHoursStart   Int       @default(22)      // 10pm
  quietHoursEnd     Int       @default(7)        // 7am
  oneSignalPlayerId String?                      // Device push token
  currentStreak   Int           @default(0)      // Consecutive under-budget days
  bestStreak      Int           @default(0)      // All-time best streak
  lastUnderBudgetDate DateTime?                  // For streak continuity
  biometricEnabled Boolean      @default(false)  // Face ID / Touch ID
  updatedAt         DateTime  @updatedAt
}
```

---

## 5. API Routes

### Authentication
All routes except webhooks require Clerk JWT in Authorization header. Middleware validates via `@clerk/nextjs/server`.

### Core Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| **Budget** | | |
| GET | `/api/budget` | Compute today's budget: income config → bills → savings → daily amount. Returns: budget, spent, remaining, pool, pct |
| **Transactions** | | |
| GET | `/api/transactions?date=&entity=&category=&search=` | List with filters |
| PATCH | `/api/transactions/[id]` | Update category, entity, note, rationale, receipt flag |
| **Bills** | | |
| GET | `/api/bills` | List all bills |
| POST | `/api/bills` | Create bill |
| PATCH | `/api/bills/[id]` | Update bill (including toggle paid) |
| DELETE | `/api/bills/[id]` | Delete bill |
| **Accounts** | | |
| GET | `/api/accounts` | List connected accounts with balances |
| POST | `/api/accounts` | Initiate Revolut OAuth connect |
| DELETE | `/api/accounts/[id]` | Disconnect account |
| **Sync** | | |
| POST | `/api/sync/revolut` | Manual sync trigger |
| POST | `/api/webhooks/revolut` | Revolut webhook for real-time tx |
| **AI** | | |
| POST | `/api/ai/ask` | Send message to Claude with user context |
| POST | `/api/ai/categorize` | Auto-categorize a transaction |
| POST | `/api/ai/rationale` | Generate business rationale for a tx |
| **Voice** | | |
| POST | `/api/voice` | Upload audio → Whisper → structured text |
| **OCR** | | |
| POST | `/api/ocr` | Upload receipt image → Vision → extracted data |
| **Receipts** | | |
| POST | `/api/receipts/upload` | Upload to R2, return URL, link to tx |
| **Settings** | | |
| GET | `/api/settings` | Get income config + preferences |
| PATCH | `/api/settings` | Update income config + preferences |

---

## 6. Revolut Integration

### OAuth2 Flow
1. User clicks "Connect Account" on desktop/mobile
2. Redirect to Revolut authorize URL with `READ` scope
3. Revolut redirects back with auth code
4. Exchange code for access token + refresh token
5. Store tokens encrypted in database

### Token Refresh
Access tokens expire every 40 minutes. A Railway cron job runs every 30 minutes:
- Check if token expires within 10 minutes
- If so, use refresh token to get new access token
- Store new tokens

### Transaction Sync
Cron job every 2 hours:
1. GET `/accounts` → update balances
2. GET `/transactions?from=lastSyncTime&to=now` for each account
3. Upsert transactions (dedup via `revolutTxId`)
4. Trigger budget recalculation
5. Send push notification for any new transactions (if within notification hours)

### Full Reconciliation
Daily at 4:00 AM local:
- Pull all transactions for the current month
- Compare against database
- Fix any discrepancies
- Reset bill paid statuses on 1st of month

---

## 7. AI Integration

### Claude (Ask Tab + Auto Features)

System prompt includes user context:
```
You are PocketPilot's financial assistant for Jay.
Today's budget: $115. Spent: $72. Remaining: $43.
Entities: Karani Markets (trading), Ilai Collective (creative).
Recent transactions: [last 10 txs].
Bills due this week: [upcoming bills].
```

Uses:
- **Ask tab:** Conversational Q&A about spending, budget, bills
- **Auto-categorize:** Given merchant name + amount, suggest category + entity
- **Rationale generator:** Given merchant + category + entity, generate IRS-friendly business purpose statement
- Model: `claude-sonnet-4-5-20250929` for routine tasks, `claude-opus-4-6` for complex analysis

### Whisper (Voice Memos)
1. iOS records audio via AVAudioRecorder
2. Upload .m4a to `/api/voice`
3. Server sends to OpenAI Whisper API
4. Returns transcript
5. Optionally parse structured data (merchant, amount, note) via Claude

### Google Vision (Receipt OCR)
1. User takes photo of receipt
2. Upload to `/api/ocr`
3. Server sends to Vision API `TEXT_DETECTION`
4. Parse response for: merchant name, total amount, date, line items
5. Return structured data to pre-fill transaction fields

---

## 8. Notification Schedule (OneSignal + Railway Cron)

| Time | Notification | Cron Expression |
|------|-------------|----------------|
| 8:00 AM local | Morning briefing (budget, bills this week, pool) | `0 8 * * *` |
| On transaction | Transaction alert (merchant, amount, remaining) | Webhook-triggered |
| On transaction >$50 | Large transaction alert (entity assignment prompt) | Webhook-triggered |
| Once (on cross) | Over budget warning (amount over, recovery options) | Threshold-triggered |
| Morning of due | Bill due today (name, amount, mark paid action) | `0 8 * * *` (filtered) |
| 3 days before due | Bill shortfall warning (if deposit rate won't cover) | `0 8 * * *` (filtered) |
| Sunday 7:00 PM | Weekly summary (spent, avg/day, over/under count) | `0 19 * * 0` |
| 9:00 PM (under only) | End of day win (saved amount, streak) | `0 21 * * *` |
| Friday 3:00 PM | Receipt reminder (missing count, biz total) | `0 15 * * 5` |
| On deposit | Deposit received (amount, transfer recommendation) | Webhook-triggered |

Quiet hours: 10pm–7am local. Exceptions: bill due today (critical), spending >2× budget (fraud alert).

---

## 9. Xcode Cloud Setup

### One-time configuration:
1. Open Xcode → Settings → Accounts → add Apple ID
2. Open `ios/PocketPilot.xcodeproj`
3. Product → Xcode Cloud → Create Workflow
4. Source: GitHub `pocketpilot` repo, branch `main`, path filter `/ios/**`
5. Build action: Archive → distribute to TestFlight
6. Trigger: push to `main` that changes files in `/ios/`

### After setup:
- Push Swift changes to GitHub → Xcode Cloud auto-builds → TestFlight updates
- 25 compute hours/month included in Apple Developer Program (plenty for 1 person)
- You never open Xcode again for routine builds

---

## 10. Build Phases

### Sprint 1 — Live Web App (Day 1)
**Goal:** Real data, real auth, real dashboard. Open the URL, see your money.

**Morning — Foundation:**
1. Create GitHub repo `pocketpilot` with `/web` and `/ios`
2. `npx create-next-app@latest web --typescript --tailwind --app`
3. Install Prisma, set up schema, `prisma migrate dev` on Railway Postgres
4. Integrate Clerk: sign-in, middleware, protected routes
5. Deploy to Railway, confirm blank app is live with auth

**Afternoon — Revolut + Data:**
6. Build Revolut OAuth flow (connect account)
7. Build transaction sync — pull all transactions into Postgres
8. Build token refresh logic
9. Build `/api/budget` endpoint (the core math)
10. Build `/api/transactions`, `/api/accounts`, `/api/bills` CRUD
11. Build `/api/settings` for income config

**Evening — Wire the UI:**
12. Port the desktop prototype components into Next.js pages
13. Replace mock data with real API calls
14. Dashboard showing real budget, real transactions, real bills
15. Bills CRUD working with modal (add/edit/delete/toggle paid)
16. Business Center with entity filter, rationale editing, receipt toggle
17. Settings page wired to database
18. Deploy. It's live.

### Sprint 2 — AI + Smart Features (Day 2)
**Goal:** Claude, voice, OCR, receipts, export. The intelligence layer.

**Morning — AI:**
1. Build `/api/ai/ask` — Claude chat with full budget context
2. Build `/api/ai/categorize` — auto-suggest category + entity on new tx
3. Build `/api/ai/rationale` — generate IRS-ready business purpose
4. Build Ask interface on web (chat panel)
5. Build `/api/voice` — Whisper transcription endpoint
6. Build `/api/ocr` — Google Vision receipt scanning

**Afternoon — Receipts + Export:**
7. Set up R2 bucket, build receipt upload endpoint
8. Wire receipt upload to Business Center (click → upload → linked)
9. Build CSV export for accountant
10. Set up Railway cron: Revolut sync every 2hr, token refresh every 30min
11. Set up Railway cron: bill paid reset on 1st of month

**Evening — Notifications:**
12. Set up OneSignal + APNs certificate
13. Build notification sender utility
14. Build cron jobs: morning briefing, bill reminders, weekly summary
15. Build webhook-triggered: new transaction alert, over budget warning
16. Test end to end. Desktop companion is fully operational.

### Sprint 3 — iOS App (Day 3-4)
**Goal:** SwiftUI app on your phone via TestFlight.

**Day 3 — Core App:**
1. Create Xcode project in `/ios`
2. Integrate Clerk Swift SDK
3. Build APIClient.swift → same API as web
4. Build HomeView (arc gauge, today's budget, transactions, bills)
5. Build ActivityView, ReportsView, MoreView
6. Build AskView (Claude chat)
7. Build voice recording → /api/voice
8. Build camera capture → /api/ocr
9. Integrate OneSignal iOS SDK
10. Set up Xcode Cloud → push to TestFlight

**Day 4 — Native Surfaces:**
11. Widget Extension: small (arc + amount), medium (arc + stats), lock screen
12. Live Activity for Dynamic Island (compact + expanded)
13. Push notifications with action buttons (categorize, mark paid)
14. Polish: loading states, empty states, error handling
15. Final TestFlight build. App on your phone.

### If There's a Day 5
- Watch complication
- Recurring transaction auto-detection
- Bill auto-match (tx merchant matches bill vendor)
- Transaction splitting (Amazon order → part personal, part business)
- Dark mode toggle on desktop

---

## 11. Environment Variables

### Railway (web/.env)
```
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...
REVOLUT_CLIENT_ID=...
REVOLUT_CLIENT_SECRET=...
REVOLUT_API_URL=https://b2b.revolut.com/api/1.0
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=pocketpilot-receipts
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_VISION_KEY=... (or service account JSON path)
ONESIGNAL_APP_ID=...
ONESIGNAL_API_KEY=...
```

### iOS (PocketPilot/Config.swift)
```swift
enum Config {
    static let apiBaseURL = "https://pocketpilot.up.railway.app"
    static let clerkPublishableKey = "pk_live_..."
    static let oneSignalAppId = "..."
}
```

---

*This blueprint is the technical companion to PocketPilot_Master_Spec.md. The Master Spec defines WHAT to build. This document defines HOW to build it.*
