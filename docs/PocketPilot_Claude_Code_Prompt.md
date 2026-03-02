# PocketPilot — Claude Code Launch Prompt

## Files to Attach

Attach ALL of these files to the Claude Code session:

1. **PocketPilot_Master_Spec.md** — product specification (what to build)
2. **PocketPilot_Blueprint.md** — technical blueprint (schema, API routes, stack, folder structure)
3. **PocketPilot_Logic_Mobile.md** — behavioral contract for iOS app (every trigger → response chain)
4. **PocketPilot_Logic_Desktop.md** — behavioral contract for web app (every page, button, state)
5. **PocketPilot_Desktop.jsx** — working React prototype (visual reference only)
6. **PocketPilot_Claude_Code_Prompt.md** — this file (includes Clerk integration instructions)

---

## File Hierarchy

When files conflict, follow this priority:

1. **Logic Contracts** (Mobile + Desktop) — THE authority for behavior
2. **Blueprint** — THE authority for technical decisions (schema, API routes, stack)
3. **Master Spec** — THE authority for design language, fonts, colors
4. **Desktop Prototype** — Visual reference ONLY. If it conflicts with logic contracts, logic contracts win.

Known differences (logic contract is correct):
- Prototype has 10 categories → Logic contract defines 12 (added Health + Travel)
- Prototype has no date range filter on Business Center → Logic contract adds one
- Prototype has no floating chat button → Logic contract adds Ask panel
- Prototype Bills modal has no `dueMonth` field → Logic contract + schema add it
- Prototype has no loading skeletons → Logic contract specifies them
- Prototype has no keyboard shortcuts → Logic contract adds them

---

## Project Setup (Already Done)

- **GitHub repo:** https://github.com/jayleafclark/pocketpilot.git
- **Railway:** Connected to the GitHub repo, auto-deploys on push to main

---

## Clerk Integration Instructions

Follow these rules exactly when setting up Clerk. Do NOT use deprecated patterns.

### Install
```bash
npm install @clerk/nextjs
```

### Environment Variables
Set these in `.env.local` (use placeholders in code, real keys only in .env.local):
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
```

### Middleware — proxy.ts
Create `proxy.ts` at the project root (or `src/` if using src directory). Use `clerkMiddleware()` from `@clerk/nextjs/server`:

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### Layout — app/layout.tsx
Wrap the app with `<ClerkProvider>`:

```typescript
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
```

### CRITICAL Clerk Rules
- **ALWAYS** use `clerkMiddleware()` from `@clerk/nextjs/server` — NEVER `authMiddleware()` (deprecated)
- **ALWAYS** use App Router (`app/layout.tsx`, `app/page.tsx`) — NEVER pages router (`_app.tsx`, `pages/`)
- **ALWAYS** import `auth()` from `@clerk/nextjs/server` and use `async/await`
- **ALWAYS** use placeholder values in code files — real keys only in `.env.local`
- **NEVER** reference `withAuth`, old `currentUser` from deprecated versions, or `pages/signin.js`

---

## Sprint 1 Prompt

Paste everything below this line into Claude Code:

---

I'm building PocketPilot — a personal finance app for one user (me). It tracks daily spending against a derived budget, manages bills, and maintains tax-ready records for two business entities (Karani Markets LLC for trading, Ilai Collective LLC for creative work).

I've attached files. Read them in this order:
1. **PocketPilot_Logic_Desktop.md** — behavioral brain. Every page, button, state change.
2. **PocketPilot_Blueprint.md** — technical blueprint. Prisma schema, API routes, folder structure, env vars.
3. **PocketPilot_Master_Spec.md** — product spec. Design language, fonts, colors.
4. **PocketPilot_Desktop.jsx** — working React prototype. Visual reference ONLY. If it conflicts with the logic contract, the logic contract wins.
5. **PocketPilot_Logic_Mobile.md** — mobile behavioral contract. Not needed for Sprint 1 but read it for full context. The `/api/budget` response shape is in Appendix 2.

**GitHub repo:** https://github.com/jayleafclark/pocketpilot.git
**Railway:** Already connected to this repo, auto-deploys on push to main. Postgres is running on Railway.

**Build the web app. Follow the Sprint 1 plan from the Blueprint.**

### Step 1: Scaffold
- Next.js in `/web` — TypeScript, Tailwind, App Router
- Install: `prisma`, `@prisma/client`, `@clerk/nextjs`, `@aws-sdk/client-s3`
- Set up the Prisma schema EXACTLY as in the Blueprint Section 4 (includes `originalAmount`, `originalCurrency` on Transaction, `dueMonth` on Bill, `currentStreak`, `bestStreak`, `lastUnderBudgetDate`, `biometricEnabled` on Settings)
- Run `prisma migrate dev`

### Step 2: Clerk Auth
Walk me through connecting Clerk to this app step by step. I need you to:
- Set up the Clerk provider in root layout using `<ClerkProvider>` from `@clerk/nextjs`
- Create `proxy.ts` middleware using `clerkMiddleware()` from `@clerk/nextjs/server` — NOT the deprecated `authMiddleware()`
- Use App Router patterns only (`app/layout.tsx`, `app/page.tsx`) — NEVER pages router
- Import `auth()` from `@clerk/nextjs/server` with async/await
- Tell me exactly which env vars to set in Railway and what to name them
- Build a sign-in page at `/sign-in` matching the PocketPilot aesthetic (see Login Flow in Desktop Logic Contract)
- Protect all routes except `/sign-in` and `/api/webhooks`

### Step 3: Railway Database Connection
Walk me through connecting Prisma to the Railway Postgres instance:
- Tell me how to get the DATABASE_URL from Railway
- Tell me which env vars to add to Railway's Variables tab
- Run the migration against the Railway database
- Verify the connection works

### Step 4: API Routes
- Build EVERY endpoint in Blueprint Section 5
- `/api/budget` must return the EXACT JSON shape from Mobile Logic → Appendix 2 → "What the /api/budget endpoint actually returns"
- Budget formula: `(karaniDailyAvg × 22 + ilaiBiweekly × 2) − totalBills − savingsGoal) ÷ daysInMonth`. Bill proration: quarterly ÷ 3, annual ÷ 12. See Mobile Logic → Appendix 2 → "Budget Formula" for all edge cases.
- All routes require Clerk auth via `auth()` from `@clerk/nextjs/server` except webhooks
- Return proper JSON with error handling matching Desktop Logic → "API Error Handling"

### Step 5: Web Pages
- Port the Desktop Prototype into Next.js pages
- Follow the Desktop Logic Contract for behavior, not the prototype
- Design: champagne gold (#B09049), ivory (#F8F7F4), Bodoni Moda / DM Sans / JetBrains Mono, 14px card radius, subtle shadows
- Replace all mock data with real API calls
- Pages: Dashboard, Business Center, Bills, Accounts, Analytics, Settings
- Include: skeleton loading states, empty states for every section, browser tab titles, keyboard shortcuts (all defined in Desktop Logic Contract)
- Business Center: entity filter tabs + date range filter + search + 4 stat cards + receipt toggle + rationale editing with ✨ Generate button + CSV export
- Bills: 3 stat cards + search + split tables (personal vs business) + full CRUD modal with `dueMonth` for quarterly/annual + delete with cascade
- Sidebar: 100px arc gauge hero, navigation, profile + logout footer

### Step 6: Revolut Integration Stub
- Build `lib/revolut.ts` — OAuth flow, token refresh, transaction sync
- Build `lib/r2.ts` — Cloudflare R2 client
- Build `lib/claude.ts` — Anthropic SDK wrapper
- Build `lib/onesignal.ts` — notification sender
- Build `lib/budget.ts` — budget derivation engine with exact formula
- All stubs ready for env vars

### Step 7: Floating Chat Panel
- Bottom right, champagne circle 48px, chat bubble icon
- Opens 360px side panel with Claude chat
- Persists across page navigation
- See Desktop Logic → "Desktop Ask/Chat Panel"

### Design Rules:
- Card border radius: 14px
- Shadow: `0 1px 3px rgba(0,0,0,0.03), 0 6px 24px rgba(0,0,0,0.03)`
- Hover: `0 2px 8px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.06)`
- Fonts: Bodoni Moda (headings), DM Sans (body), JetBrains Mono (numbers)
- Primary: #B09049, Background: #F8F7F4, Cards: #FFFFFF with borders rgba(0,0,0,0.055)
- 12 categories with colors defined in Mobile Logic → "Category List: Complete and Final"

### Cross-Page Rules:
- Follow cross-page data consistency table in Desktop Logic
- Each page fetches fresh on mount (no global state store)
- Optimistic updates that fail must revert
- Settings auto-save on blur with champagne flash feedback

If anything is ambiguous, make the best decision and leave a code comment noting it so I can adjust later.

Start now.

---

## Sprint 2 Prompt

When Sprint 1 is live, paste this:

---

Sprint 1 is live. Build Sprint 2 — AI, voice, OCR, receipts, cron jobs, notifications.

Re-read the attached files, especially:
- Mobile Logic → EVENT: User Records Voice Note
- Mobile Logic → EVENT: User Scans Receipt
- Mobile Logic → EVENT: Ask Tab Context Refresh
- Mobile Logic → NOTIFICATION: Complete Catalog
- Desktop Logic → Rationale Auto-Generate Button
- Desktop Logic → Receipt File Upload (Desktop)

### AI
1. `/api/ai/ask` — Claude chat with EXACT context block from Mobile Logic. Use `claude-sonnet-4-5-20250929`. Stream response.
2. `/api/ai/categorize` — suggest category (12-category list) + entity. Check tx history first, Claude fallback.
3. `/api/ai/rationale` — IRS-ready business purpose. Wire ✨ Generate / ✨ Regenerate button.

### Voice
4. `/api/voice` — audio → Whisper → transcript → Claude extracts structured data.

### OCR
5. `/api/ocr` — image → Google Vision TEXT_DETECTION → parse merchant, total, date, line items.

### Receipts
6. R2 upload/delete in `lib/r2.ts`
7. `/api/receipts/upload` — multipart → R2 → URL → link to tx
8. Wire into Business Center per Desktop Logic → "Receipt File Upload"

### Export
9. CSV from Business Center per Desktop Logic → "Export CSV: Complete Column Spec"

### Cron Jobs
10. Token refresh: every 30 min
11. Transaction sync: every 2 hours
12. Bill reset: midnight on 1st
13. Full reconciliation: 4am daily

Walk me through setting up Railway cron jobs — tell me exactly where to configure them and what commands to run.

### Notifications
14. `lib/onesignal.ts` sender
15. ALL cron notifications from the catalog: morning briefing, bill due, shortfall, end of day, weekly summary, receipt reminder, new month
16. ALL webhook notifications: tx alert (single/batch/fraud), over budget, deposit, bill auto-match, amount mismatch, sync error, duplicate
17. Quiet hours (10pm-7am, exceptions for fraud + critical bills)
18. Frequency caps from catalog

Walk me through connecting OneSignal — creating the app, uploading APNs certificate, getting the API keys, and adding them to Railway.

If ambiguous, make best decision and comment. Build now.

---

## Sprint 3 Prompt (iOS)

When Sprint 2 is done:

---

Sprints 1 and 2 are live. Build the iOS app in `/ios`.

Read PocketPilot_Logic_Mobile.md top to bottom. Every event, screen, state — all in there.

Key sections:
- Mobile Tab Bar (5 tabs, icons, labels, badges)
- Transaction Detail View (full layout)
- Category sheet (12 categories, 3×4 grid)
- Arc Gauge state table (every color/label/animation)
- Widget behavior (4 types)
- Dynamic Island (compact + expanded)
- First-time onboarding (5 steps)
- Biometric auth (Face ID)
- Toast system
- All notification tap destinations
- Voice + camera flows
- Midnight reset (foreground/background/closed)
- Timezone handling
- Offline/error states

### Build Order
1. Xcode project in `/ios` with SwiftUI
2. Clerk Swift SDK for auth
3. `APIClient.swift` → Railway API
4. HomeView with arc gauge (follow state table exactly)
5. ActivityView with tx list, search, filters
6. ReportsView with Personal + Business sub-tabs
7. AskView with Claude chat (stream)
8. MoreView with Bills, Accounts, Settings
9. Transaction detail view
10. Category sheet + entity picker
11. Voice → /api/voice
12. Camera → /api/ocr
13. OneSignal iOS SDK
14. Widget extension (small, medium, lock screen × 2)
15. Live Activity for Dynamic Island
16. Face ID
17. Onboarding
18. Xcode Cloud → TestFlight

Walk me through Xcode Cloud setup — creating the workflow, connecting to GitHub, configuring the build trigger for `/ios/**` changes, and pushing the first TestFlight build.

Design: #B09049, #F8F7F4, Bodoni Moda / DM Sans / JetBrains Mono. Match web app aesthetic.

If ambiguous, comment. Build now.
