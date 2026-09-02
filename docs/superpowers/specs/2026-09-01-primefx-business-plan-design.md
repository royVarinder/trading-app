# PRIMEFX Business Plan — Backend & Rebrand Design

Date: 2026-09-01

## Problem

The app (currently "Win FX") has a fully wired auth/deposit/withdrawal/ticket/
referral-genealogy backend, but the investment/staking/earnings side is
UI-only — hardcoded numbers with no real math behind them (see README's
"What's still demo data"). A business-plan PDF ("Welcome to PRIMEFX") defines
exactly what that math should be: a Startup investment plan, five tiered
staking plans, a six-rank leadership commission structure with monthly
rewards, and specific withdrawal/admin-charge rules. This spec wires the real
backend to that plan and rebrands the app from Win FX to PRIMEFX throughout.

**Scope note:** this remains a demo/portfolio app, consistent with how the
repo already treats it (README explicitly lists demo sections; the deposit
wallet address is a placeholder, `0xDEM0...`). This work does not add any
real payment rail, real crypto wallet, or admin approval UI — deposits/
withdrawals/stakes stay `"Pending"` until an administrator edits the record
directly in MongoDB, exactly as the existing deposits flow already works.

## Source of truth (PDF → numbers)

| Plan | Min | Daily rate | Duration | Notes |
|---|---|---|---|---|
| Startup (Investment ID) | $50 | 0.5%/day | Unlimited | Already the shape of `investments` collection |
| $200 Starter (Staking) | $200 | 0.6%/day | 100 days | |
| $2,000 Growth (Staking) | $2,000 | 0.7%/day | 200 days | |
| $4,000 Advanced (Staking) | $4,000 | 0.8%/day | 300 days | |
| $8,000 Premium (Staking) | $8,000 | 0.9%/day | 400 days | |
| $15,000 Elite (Staking) | $15,000 | 1.0%/day | 500 days | |

Staking amounts are **tier minimums** — a member stakes any amount at or
above a tier's minimum and earns that tier's daily rate for that tier's fixed
duration (confirmed with user).

Leadership ranks (already present as a dummy table in
`IncomeMonthlyReward.tsx` and confirmed as reasonable to keep):

| Level | Rank | Commission | Self Inv. | Direct Business | Team Business | Monthly Reward |
|---|---|---|---|---|---|---|
| 1 | Promoter | 20% | $200 | $1,000 | $2,000 | $10 |
| 2 | Performer | 40% | $500 | $2,500 | $10,000 | $50 |
| 3 | Manager | 60% | $1,500 | $5,000 | $100,000 | $500 |
| 4 | Director | 80% | $5,000 | $15,000 | $600,000 | $2,000 |
| 5 | Ambassador | 100% | $10,000 | $30,000 | $2,400,000 | $10,000 |
| 6 | Crown Ambassador | 120% | $25,000 | $50,000 | $10,000,000 | $30,000 |

Trading days: Mon–Fri only (no accrual Sat/Sun), per PDF Terms & Conditions.
Withdrawals: $10 minimum, 5% admin charge — applies uniformly to **both**
income and capital withdrawals (the PDF states one flat rule; the current
code only charges income withdrawals, which this spec corrects).

Capital Protection Policy → "Earned Dividends Adjustment" (PDF p.4): capital
you can withdraw is your principal **minus** dividends already earned on it.

## Data model

### Extended collections

- `investments` (exists) — add `dailyRate: 0.5`, `status: "Active"|"Withdrawn"`.
  No duration cap (Startup Plan is open-ended).
- `users` (exists) — add optional `walletAddress: string | null`.

### New collections

```ts
// One doc per staking purchase.
type Stake = {
  memberId: string;
  username: string;
  amount: number;
  tierId: "starter" | "growth" | "advanced" | "premium" | "elite";
  dailyRate: number;        // copied from the tier at purchase time, so a
  durationDays: number;     // later tier-table edit never rewrites history
  startDate: Date;
  creditedDays: number;     // how many trading days have been paid so far
  status: "Active" | "Completed" | "Withdrawn";
  createdAt: Date;
};

// One row per position per credited trading day. Backs every income table.
type BonusLedgerEntry = {
  memberId: string;
  positionId: ObjectId;      // _id of the investments or stakes doc
  positionType: "investment" | "staking";
  principal: number;         // the position's amount, snapshotted
  rate: number;               // daily rate applied
  income: number;              // principal * rate
  date: string;               // "YYYY-MM-DD", trading-day key (idempotency)
  createdAt: Date;
};

// One row per leadership override payout.
type LeadershipLedgerEntry = {
  beneficiaryMemberId: string;
  beneficiaryRank: string;         // rank held at payout time
  commissionPct: number;
  sourceMemberId: string;
  sourceUsername: string;
  level: number;                   // depth from beneficiary to source (1 = direct)
  positionType: "investment" | "staking";
  refPrincipal: number;
  refIncome: number;               // the day's bonus that generated this override
  income: number;                  // commissionPct% * refIncome
  date: string;                    // matches the BonusLedgerEntry.date it derives from
  createdAt: Date;
};

// One row per member per calendar month a rank reward is earned.
type RewardLedgerEntry = {
  memberId: string;
  rank: string;
  amount: number;
  month: string;    // "YYYY-MM", unique with memberId
  createdAt: Date;
};

// Singleton doc — accrual idempotency watermarks.
type SystemDoc = {
  _id: "accrual";
  lastAccrualDate: string;   // "YYYY-MM-DD", gates the daily trading-bonus phase
  lastRewardMonth: string;   // "YYYY-MM", gates the monthly-reward phase
};
```

Indexes (added to `src/lib/mongodb.ts`, following the existing pattern):
`stakes{memberId,createdAt}`, `bonusLedger{memberId,date}`,
`bonusLedger{positionId,date}` unique, `leadershipLedger{beneficiaryMemberId,date}`,
`rewardLedger{memberId,month}` unique.

## Plan/rank definitions (`src/lib/plans.ts`)

Static exported constants: `STARTUP_PLAN`, `STAKING_TIERS` (array of the 5
tiers above, each with `id/label/min/dailyRate/durationDays`), and
`LEADERSHIP_RANKS` (the 6-row table above). Pure data, no I/O — imported by
both the accrual engine and the UI components that currently hardcode these
numbers (`IncomeMonthlyReward.tsx`, `StakingId.tsx`).

## Accrual engine (`src/lib/accrual.ts`)

### `runDailyAccrual(): Promise<void>`

Two independently-gated phases in one function — kept separate so that a
call landing on a weekend still runs the monthly-reward phase instead of
short-circuiting on the trading-day check (the 1st of a month can itself
fall on a Saturday or Sunday, and rewards must not silently skip that
month):

**Phase A — daily trading bonus + leadership** (skipped entirely if `today`
is Sat/Sun, or if `system.lastAccrualDate === today`):

1. Load every `Active` `investments` and `stakes` doc. For each:
   - Insert a `BonusLedgerEntry` (`income = principal * rate`), using the
     unique `(positionId, date)` index as the real idempotency guard (a
     duplicate insert is caught and ignored — this is what makes it safe to
     call from every page load, not just cron).
   - For `stakes`, increment `creditedDays`; if it now equals
     `durationDays`, set `status: "Completed"` (principal stays withdrawable
     via the capital wallet; no more daily bonus is generated).
2. For every member just credited above, walk `sponsorId` upward via
   `users` (unbounded depth, one small query per hop — sponsor chains are
   shallow enough that this beats a full `$graphLookup` per event). For each
   ancestor, compute their current rank (`computeRank`, below); if it has
   `commissionPct > 0`, insert a `LeadershipLedgerEntry`
   (`income = commissionPct/100 * refIncome`).
3. Upsert `system.lastAccrualDate = today`.

**Phase B — monthly reward** (runs on every call, any day of week; its own
idempotency comes from the `(memberId, month)` unique index on
`rewardLedger`, not from the daily watermark):

4. Let `month = today`'s `YYYY-MM`. Skip entirely if `system.lastRewardMonth
   === month`. Otherwise, for every member with a qualifying rank
   (`computeRank`), insert a `RewardLedgerEntry` for that `month` (a
   duplicate-key insert from a race is caught and ignored, same pattern as
   phase A). Upsert `system.lastRewardMonth = month`.

Steps are ordinary sequential `for` loops over plain arrays — expected data
volumes for a demo app (tens to low hundreds of active positions) make a
batch-optimized pipeline unnecessary; revisit only if that assumption breaks.

### `computeRank(memberId): Promise<LeadershipRank | null>`

Uses `getBusinessTotals(memberId)` (below) against `LEADERSHIP_RANKS`,
returning the highest rank where self/direct/team all meet threshold, or
`null` ("No-Rank").

### `getBusinessTotals(memberId)` (added to `src/lib/team.ts`)

Reuses `getTeamSnapshot` plus one small self-only query:
`{ selfInvestment, directBusiness, teamBusiness }` where `directBusiness` =
sum of `direct[].ownInvested` and `teamBusiness` = sum of `allTeam[].ownInvested`.
`fetchInvestedTotals` in `team.ts` is extended to sum **both** `investments`
and `stakes` (so staking capital counts toward business/rank totals, not
just Startup Plan capital) — this is the one behavioral change to the
existing team-hierarchy feature.

### Wallet math

- `getIncomeWallet(memberId)`: `Σ bonusLedger.income + Σ leadershipLedger.income + Σ rewardLedger.amount`, minus `Σ withdrawals{type:"income", status: Pending|Approved}.amount`.
- `getCapitalWallet(memberId)`: `Σ principal (investments + stakes)` minus `Σ bonusLedger.income` for those same positions, minus `Σ withdrawals{type:"investment", status: Pending|Approved}.amount`; floored at 0.
- `getAvailableFund(memberId)` (moved from `investments/route.ts` into
  `src/lib/fund.ts` so both `/api/investments` and the new `/api/stakes`
  share it): `Σ deposits{status:"Approved"} - Σ investments.amount - Σ stakes.amount`.

### Triggering accrual

- **Lazy (primary path)**: `src/app/page.tsx` (the dashboard server
  component, already reading the session per request) `await`s
  `runDailyAccrual()` before rendering. Idempotent and cheap on every call
  but the first per trading day, so this needs no external scheduler to be
  correct — any authenticated visit catches the whole system up.
- **Cron (optional, for when deployed with a scheduler)**: `GET
  /api/cron/accrue`, requires header `x-cron-secret` matching
  `process.env.CRON_SECRET`; calls the same `runDailyAccrual()`. Documented
  in the README as optional Vercel Cron wiring, not required for correctness.

## API surface

All routes follow the existing session pattern (`getSession()` → 401 JSON on
failure) and existing response shapes (ISO date strings, `{error}` on 4xx).

- `POST /api/stakes` — body `{tierId, amount}`. Validates `amount >= tier.min`
  and `amount <= getAvailableFund(memberId)`. Inserts the `Stake` doc.
- `GET /api/stakes` — member's own stakes (id, tierId, label, amount,
  dailyRate, durationDays, creditedDays, status, createdAt) — backs
  `StakingId`'s "Fund"/status display and `StakingReport`.
- `GET /api/income/staking` / `/api/income/investment` — `bonusLedger` rows
  for the member filtered by `positionType`, newest first.
- `GET /api/income/all` — combined `bonusLedger` rows, both types.
- `GET /api/income/leadership` — `leadershipLedger` rows where
  `beneficiaryMemberId` = member.
- `GET /api/income/rewards` — the 6 static `LEADERSHIP_RANKS` rows annotated
  with `status: "Achieved" | "Pending"` (member's current rank vs. each row)
  plus the member's own `rewardLedger` total.
- `GET /api/wallet` — one shared endpoint (mirrors the existing `/api/team`
  pattern — one computation, several consumers): `{ rank, incomeWallet,
  capitalWallet, totalStakingBonus, totalInvestmentBonus, totalLeadership,
  totalRewards, totalSelfInvestment }`. Consumed by `DashboardView` (stat
  tiles + Account Information card), `Withdraw` (income InfoCard),
  `InvestmentWithdraw` (capital InfoCard).
- `GET`/`POST /api/wallet-address` — reads/writes `users.walletAddress`.
- `GET /api/cron/accrue` — see above.
- `POST /api/withdrawals` (existing, modified) — admin charge becomes a flat
  5% for both `type`s, $10 minimum for both, and the amount is now validated
  server-side against `getIncomeWallet`/`getCapitalWallet` (today it has no
  server-side balance check at all).

## Component changes

- `StakingId.tsx` → client component: dropdown of the 5 `STAKING_TIERS`
  (replacing the current 50/100/200-day dropdown that doesn't match any real
  plan), amount field validated against the selected tier's minimum, posts
  to `/api/stakes`. Fund field switches from hardcoded `$128.40` to a live
  `/api/investments`-style available-fund fetch.
- `StakingReport.tsx`, `IncomeStakingBonus.tsx`, `IncomeInvBonus.tsx`,
  `IncomeAllBonus.tsx`, `IncomeLeadership.tsx` → same
  fetch/loading/error/`TableSkeleton` pattern as `InvestmentReport.tsx`,
  reading from the new endpoints instead of hardcoded rows.
- `IncomeMonthlyReward.tsx` → keeps its existing table shape; rows now come
  from `LEADERSHIP_RANKS` + `/api/income/rewards`'s per-row `status`.
- `DashboardView.tsx` → stat tiles and the Account Information card read
  from `/api/wallet` instead of hardcoded numbers; Team Information card is
  unchanged (already wired to `/api/team`).
- `Withdraw.tsx` / `InvestmentWithdraw.tsx` → InfoCard rows read from
  `/api/wallet` instead of hardcoded `NET_INCOME` / `WALLET_BALANCE`
  constants.
- `WalletAddress.tsx` → real form backed by `GET`/`POST /api/wallet-address`,
  same save/error pattern as `Profile.tsx`.

## Rebrand

Every user-facing "Win FX" / "WinFX" / "winfx" string becomes "PRIMEFX":
page `<title>`/metadata, Sidebar logo alt text + label, AuthShell, login/
signup/reset-password copy, all email subject/body strings in
`mailer.ts`-calling routes, README, `package.json`'s `name`. Session cookie
name (`src/lib/constants.ts`) becomes `primefx_session`. `.env.example`'s
`MONGODB_DB` becomes `primefx`. Member ID prefix (`src/lib/counters.ts`)
becomes `PFX` (e.g. `PFX10001`); the sequence/base-number logic is
unchanged.

## Error handling

Unchanged conventions: unauthenticated → 401 `{error}`; invalid body → 400
`{error}` with a specific message; insufficient balance / below-minimum /
below-tier-minimum are all 400s with a specific message, mirroring how
`/api/investments` already rejects below-`$50` and over-available-fund
today.

## Testing

No test runner exists in this repo. Verification is manual (left to the
user, per their instruction not to run the app automatically):

1. Sign up, deposit, approve the deposit directly in MongoDB, invest in the
   Startup plan, stake into one of the 5 tiers — confirm both show up under
   "available fund" deduction correctly and can't jointly overspend it.
2. Call `GET /api/cron/accrue` (or just load the dashboard on a weekday)
   and confirm `bonusLedger` rows appear for both positions, at the right
   daily rate.
3. Build a 2-deep referral chain where the sponsor already qualifies for a
   rank; confirm a `leadershipLedger` row appears for the sponsor when the
   downline member's position accrues.
4. Confirm `Withdraw` / `InvestmentWithdraw` reject amounts over the
   computed wallet balance, and that the 5%/$10-minimum rule applies to
   both.
5. Confirm all "Win FX" strings are gone (`grep -ri "win.?fx"`) and Member
   IDs generated after this change start with `PFX`.

## Out of scope

- Any in-app admin UI — deposits/withdrawals/stakes continue to be approved
  by direct database edit (per user decision).
- Real payment rails / real crypto wallet address — deposit address stays a
  placeholder, consistent with the existing demo scope.
- Automated tests — none exist in this repo today; not adding a runner as
  part of this change.
- Per-position partial capital withdrawal — the capital wallet is one pooled
  number across all of a member's investments+stakes, matching how
  `InvestmentWithdraw.tsx` already frames it ("Total Wallet") rather than a
  per-position claim flow.
