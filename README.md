# PRIMEFX

PRIMEFX is a member dashboard for a forex/trading investment platform, rebuilt with a real backend — MongoDB-backed accounts, sessions, deposits, withdrawals, staking, leadership commissions, and email notifications — behind a UI modeled on [winfx.world](https://winfx.world).

## What this project is

The visual design and menu structure (login, signup, sidebar navigation, dashboard layout) were recreated to match the reference site, then wired up to an actual backend so the core member flows genuinely work end-to-end instead of being static mockups. The business logic — investment/staking daily returns, leadership commissions, monthly rank rewards, withdrawal rules — follows the numbers in this project's PRIMEFX business plan PDF.

**This remains a demo/portfolio app.** The deposit wallet address is a placeholder, there is no real payment processor, and there is no in-app admin panel — deposits, withdrawals, and staking requests are approved by editing MongoDB directly, the same way the original deposits flow always worked.

## What's functional today

**Auth & account**
- Sign up (with Sponsor ID / referral validation), log in, log out
- Forgot password → emailed reset link → reset password (token-based, 1-hour expiry, single use)
- Change password / change transaction password (current password re-verified before update)
- Session-protected routes (`/` requires login; `/login` & `/signup` redirect away if already authenticated)

**Profile & referrals**
- Profile view/edit backed by MongoDB; editing re-issues the session and emails a confirmation to the (possibly updated) email on file
- Every member gets a unique referral link (`/signup?ref=<memberId>`); signing up through it validates and stores the sponsor relationship
- Referral genealogy (Direct Team / Level Team / All Team) computed live from real signups and real investment/staking totals

**Investment & staking**
- Investment ID (Startup Plan): $50 minimum, 0.5%/day, no fixed duration
- Staking ID: 5 tiered plans ($200 Starter through $15,000 Elite), each with its own daily rate and fixed duration
- Daily trading bonuses accrue automatically Monday–Friday (a single idempotent accrual function runs on every dashboard visit, so no external scheduler is required — though `GET /api/cron/accrue` exists for wiring to a real cron if deployed with one)
- Leadership Bonus: rank-based override commission paid to every qualifying ancestor in a member's sponsor chain whenever a downline member earns a trading/staking bonus
- Monthly Reward: a fixed payout credited on the 1st of each month to every member holding a qualifying leadership rank
- Income Report (Staking Bonus, Investment Trading Bonus, All Invs & Staking Bonus, Leadership Bonus, Monthly Rewards Bonus) — all backed by real ledgers

**Money movement**
- Deposit Fund → saved as a pending request, admin gets emailed
- Deposit History → real records from the database
- Withdraw (income) and Investment Withdrawal Request (capital) → saved as pending requests, validated server-side against the member's real wallet balance, with a flat 5% admin charge and $10 minimum on both
- Withdrawal History / Investment Payout Report → real records
- Wallet Address — real per-member setting used as the payout destination on record

**Support**
- Ticket Submit → saved to the database, admin gets emailed
- View Ticket → real records

**Navigation**
- Sidebar profile-picture dropdown (Dashboard / Profile / Change Password / Logout)
- Live TradingView ticker tape + forex cross-rates widgets on the dashboard

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [MongoDB](https://www.mongodb.com) (native driver, no ODM)
- `bcryptjs` for password hashing, `jsonwebtoken` for session cookies
- `nodemailer` (Gmail SMTP) for admin and user notification emails
- Embedded TradingView widgets for live market data

## Getting started

### 1. Prerequisites

- Node.js 20+
- A running MongoDB instance (local `mongod` or a hosted connection string)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) if you want emails to actually send (signup/login/deposit/ticket notifications, password resets, profile-update confirmations)

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=primefx
SESSION_SECRET=a-long-random-string

ADMIN_EMAIL=admin@example.com
SMTP_USER=your-gmail-address@gmail.com
SMTP_APP_PASSWORD=your-gmail-app-password

# Optional — see src/app/api/cron/accrue/route.ts
CRON_SECRET=
```

If `SMTP_USER` / `SMTP_APP_PASSWORD` are left blank, the app still works — it just logs a warning and skips sending emails instead of failing the request.

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up for an account, and you're in.

### 4. Build for production

```bash
npm run build
npm run start
```

## Project structure

```
src/
  app/
    (auth pages)         login, signup, forgot-password, reset-password
    api/                 auth, account, profile, deposits, withdrawals, tickets,
                          investments, stakes, income/*, wallet, wallet-address,
                          team, cron/accrue
    page.tsx             dashboard shell (server component, reads session,
                          triggers the daily accrual job)
  components/
    dashboard/           one component per sidebar page
    dashboard/shared/     DataTable, InfoCard, Skeleton, PageHeader, TradingViewWidget
    Sidebar.tsx           nested accordion menu + profile dropdown
    HomeShell.tsx         client-side menu routing
  lib/
    mongodb.ts            connection + index setup
    session.ts             JWT cookie helpers
    mailer.ts               nodemailer wrapper
    counters.ts             sequential Member ID generator
    plans.ts                Startup/staking plan and leadership rank constants
    team.ts                 referral genealogy + business-total computation
    fund.ts                 available-fund computation
    aggregate.ts             shared MongoDB sum-field helper
    accrual.ts               the daily accrual + wallet-math engine
```
