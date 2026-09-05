# PRIMEFX — Admin Panel Feature Report

**Prepared:** 2026-09-02
**Scope:** Analysis of the existing PRIMEFX codebase (member dashboard) and a feature specification for the admin panel it currently lacks.

## 1. Current state

PRIMEFX is a Next.js 16 + MongoDB member dashboard for a forex/staking investment platform (MLM-style referral structure). Confirmed by reading the code:

- **There is no admin panel, no admin route, and no admin role.** `SessionPayload` (`src/lib/session.ts`) only carries `userId`, `memberId`, `username` — no `role`/`isAdmin` field exists anywhere in the schema.
- **Every money-moving action is a manual MongoDB edit.** Deposits, withdrawals, and (implicitly) disputed staking/investment records are approved by an operator connecting to Mongo directly and flipping a `status` field.
- **Deposit approval is the single point that unlocks everything.** `getAvailableFund()` (`src/lib/fund.ts`) only counts deposits with `status: "Approved"`. Until someone manually sets that field, a member's deposited cash can't be invested, staked, or withdrawn.
- **Admin is only notified by email** (`sendAdminEmail`, Gmail SMTP via `nodemailer`) on signup, deposit request, and ticket submission — there's no inbox/queue view, just an email in one inbox.
- **Support tickets have a `reply` field that is never written to by any route** — the reply UI/API doesn't exist yet.
- No audit logging, no admin action history, no way to search/filter members, no reporting dashboard, no way to edit plan rates or ranks without a code deploy.

## 2. Data model gaps to close first

Before any admin screen is useful, the schema needs:

| Addition | Why |
|---|---|
| `users.role: "member" \| "admin"` (or a separate `admins` collection) | Nothing distinguishes an admin from a member today. |
| `adminActions` collection (actor, action, target, before/after, timestamp) | No audit trail exists for approvals/edits — required for a financial app. |
| `deposits.reviewedBy`, `reviewedAt`, `rejectionReason` | `deposits` currently only has `status`; no record of who approved/rejected or why. |
| `withdrawals.reviewedBy`, `reviewedAt`, `rejectionReason`, `txHash` (payout proof) | Same gap on the withdrawal side. |
| `tickets.reply`, `repliedBy`, `repliedAt` | Field exists in the doc shape but no write path. |
| `system` settings doc extended for site-wide config (deposit wallet address, min/max limits, maintenance mode) | Currently `STARTUP_PLAN`/`STAKING_TIERS`/`LEADERSHIP_RANKS` are hardcoded constants in `src/lib/plans.ts` — any rate change requires a code deploy. |

## 3. Required admin panel features

### 3.1 Auth & access control (foundation — build first)
- Separate admin login (`/admin/login`) or a `role: "admin"` gate on the existing session, with admin routes under `/admin/*` protected by middleware.
- 2FA recommended given this app moves real (simulated) money.
- Admin session should be distinct/shorter-lived than the 7-day member JWT.
- Support multiple admin accounts with at least two role tiers: **Super Admin** (settings, other-admin management) and **Support/Finance Admin** (approvals, tickets — no settings access).

### 3.2 Dashboard / overview (landing page)
- Pending-action counters: pending deposits, pending withdrawals (income + investment), open tickets.
- Platform totals: total members, total deposited, total invested/staked, total paid out (bonuses + withdrawals), net platform liability (sum of all members' `netIncome` + `netCapital`).
- Today's accrual status (last run date from `system.accrual.lastAccrualDate`, so admins can see if the daily bonus job silently stopped running).
- Quick links into each pending queue below.

### 3.3 Deposit management — *highest priority*
- Table of all deposits, filterable by status (Pending/Approved/Rejected), member, date range.
- Approve / Reject action per row, with optional rejection reason (emailed to the member).
- Approving sets `status: "Approved"`, `reviewedBy`, `reviewedAt` — this is what currently requires a raw Mongo edit and directly unlocks the member's available fund.
- Show the submitted `transactionHash` next to a copyable/verifiable link if the deposit wallet is on a public chain explorer.

### 3.4 Withdrawal management — *highest priority*
- Two queues: **Income withdrawals** and **Investment (capital) withdrawals** (`withdrawals.type`).
- Approve / Reject / Mark-Paid workflow (Pending → Approved → Paid, or → Rejected). Currently there's no distinct "paid" state — money can be marked Approved without the admin ever recording that a payout actually went out.
- Show `amount`, `adminCharge` (5%), `netAmount`, and the member's on-file `walletAddress` so the admin knows where to actually send funds.
- Validate against the member's current balance at approval time (balances can move between request and review).
- Reject reason emailed to the member.

### 3.5 Investment & staking oversight
- Read-only (or admin-adjustable) list of all `investments` and `stakes` positions across all members: amount, plan/tier, daily rate, status, credited days, start date.
- Ability to manually close/pause a position (e.g., fraud, dispute) — currently the only lifecycle transition is automatic (`Active` → `Completed` when `creditedDays >= durationDays`).
- Visibility into the daily accrual engine (`src/lib/accrual.ts`): last run date, positions credited today, any error state, and a manual "run accrual now" trigger as a fallback to `GET /api/cron/accrue`.

### 3.6 Member management
- Searchable/sortable member directory (by `memberId`, `username`, `email`, `mobile`, `sponsorId`).
- Member detail view: profile info, wallet address, full deposit/withdrawal/investment/stake/ledger history, referral tree position, current rank.
- Admin actions: suspend/reactivate account, force-reset password, edit contact info (support cases), manually adjust wallet balance with a reason (rare, but needed for dispute resolution — must be audit-logged).
- View a member's downline (reuse `getTeamSnapshot`/`src/lib/team.ts` logic already built for the member-facing Genealogy pages).

### 3.7 Support ticket management
- Inbox of all tickets across members (currently each member only sees their own).
- Filter by status (`Open`/`Replied`/`Closed`), reply inline (writes `tickets.reply`, flips status, emails the member — the reply path doesn't exist in the API today).
- Assign/close tickets.

### 3.8 Commission / bonus ledger visibility
- Read view over `bonusLedger` (daily trading bonus), `leadershipLedger` (override commissions), `rewardLedger` (monthly rank rewards) — platform-wide, not just per-member, so admins can audit payout totals and spot anomalies (e.g., a rank promoted incorrectly).
- Leadership rank distribution report (how many members at each of the 6 ranks in `LEADERSHIP_RANKS`).

### 3.9 Plan & rank configuration
- Move `STARTUP_PLAN`, `STAKING_TIERS`, and `LEADERSHIP_RANKS` (currently hardcoded in `src/lib/plans.ts`) into a database-backed settings collection editable from the admin panel: min amounts, daily rates, tier durations, rank thresholds, commission %, monthly reward amounts.
- Site-wide settings: deposit wallet address (currently a static placeholder per the README), withdrawal min/admin-charge %, maintenance-mode toggle.

### 3.10 Reporting / exports
- Deposit/withdrawal reports by date range, exportable to CSV.
- New-signup report (daily/weekly/monthly growth, with/without sponsor).
- Platform P&L view: total inflow (approved deposits) vs. total outflow (paid withdrawals + all bonus/reward ledgers) — the actual financial health check an operator needs.

### 3.11 Notifications / admin inbox
- Replace "check my Gmail" with an in-panel activity feed of pending items (new deposit, new withdrawal, new ticket, new signup) — the email side (`sendAdminEmail`) already fires on these events; the panel just needs to also persist/display them.

### 3.12 Audit log
- Every approval, rejection, balance adjustment, and settings change recorded with actor, timestamp, before/after values. Non-negotiable for a platform that pays out simulated (or real) money — currently there is zero record of who approved what.

## 4. Suggested build order (MVP → full)

1. **Foundation:** admin role + protected `/admin` routes + login.
2. **MVP approvals:** Deposit queue, Withdrawal queue (the two things literally blocking manual Mongo edits today) + audit log.
3. **Member management + ticket inbox** (support operations).
4. **Dashboard overview + reporting/exports.**
5. **Plan/rank/settings configuration** (removes hardcoded business rules from code).
6. **Ledger visibility & rank distribution reports** (nice-to-have oversight/analytics layer).

## 5. New API surface implied

```
/api/admin/auth/login, /logout, /me
/api/admin/deposits            GET (list+filter), PATCH /:id (approve/reject)
/api/admin/withdrawals         GET (list+filter), PATCH /:id (approve/reject/mark-paid)
/api/admin/members             GET (search/list), GET /:id, PATCH /:id (suspend/edit/adjust)
/api/admin/investments         GET (list), PATCH /:id (close/pause)
/api/admin/stakes              GET (list), PATCH /:id (close/pause)
/api/admin/tickets             GET (list+filter), PATCH /:id (reply/close)
/api/admin/settings            GET, PATCH (plans, ranks, wallet address, limits)
/api/admin/reports/*           GET (deposits, withdrawals, signups, P&L)
/api/admin/audit-log           GET (list+filter)
```

All of these are net-new; none exist in the current codebase.
