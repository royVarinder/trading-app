# Deposit Income — Design Spec

Date: 2026-09-08
Status: Approved for implementation

## Problem

Today, members only earn profit after moving `availableFund` into a separate
"investment" or "stake" position. The business wants profit to accrue
directly on every approved **deposit**, automatically, at an admin-configurable
rate and interval (e.g. 0.5% every 24 hours, or every 1 hour). Multiple
deposits from the same member each accrue independently based on their own
approval time — e.g. a $100 deposit and a second $100 deposit an hour later
each run their own accrual clock.

This is a new, separate income stream. It does not replace or interact with
the existing investment/staking bonus system, and it does not trigger
leadership/sponsor commissions (unlike investment and staking bonuses).

## Non-goals

- No leadership override commissions on deposit income.
- No duration cap or maximum payout — income accrues indefinitely as long as
  the deposit is approved (until the platform's normal withdrawal path is
  used to withdraw it, exactly like other income types).
- No new background scheduler / real cron. This follows the existing lazy
  accrual pattern already used by `runDailyAccrual()`.
- No compounding. Interest is always `principal * ratePct`, never computed on
  top of previously earned income.

## Data model changes

### `settings` collection — `PlatformSettings.depositIncome`

```ts
depositIncome: {
  enabled: boolean;     // default true
  ratePct: number;      // default 0.5  (percent per interval, e.g. 0.5 = 0.5%)
  intervalHours: number; // default 24  (supports fractional values, e.g. 0.0167 for a 1-minute test interval)
}
```

Added to `PlatformSettings`, `DEFAULT_SETTINGS`, and `PublicSettings` follows
the same pattern as `startupPlan`. Editable via `PATCH /api/admin/settings`
(super-admin only, same as other plan settings) with validation: `ratePct >=
0`, `intervalHours > 0`.

### `deposits` collection — new fields on approval

When an admin approves a deposit (status transitions to `"Approved"`), two
fields are set:

- `depositIncomeStartAt: Date` — the approval timestamp; the clock deposit
  income accrues against.
- `creditedIntervals: number` — starts at `0`; count of intervals already
  paid out for this deposit.

Only deposits with `status: "Approved"` are considered for accrual.

**Backward compatibility:** deposits approved before this feature ships won't
have `depositIncomeStartAt`/`creditedIntervals` set. The accrual function
(below) lazily initializes both the first time it sees such a deposit —
`depositIncomeStartAt` falls back to the deposit's `createdAt` (its
submission time) and `creditedIntervals` to `0` — so pre-existing approved
deposits start earning retroactively from when they were originally
submitted, no migration script required.

### `bonusLedger` collection — extended, not replaced

`positionType` grows a third variant: `"deposit"` (alongside existing
`"investment"` | `"staking"`). A deposit-income accrual run writes one entry
per deposit per accrual pass (not one entry per elapsed interval — see
Accrual logic below):

```ts
{
  memberId: string;
  positionId: ObjectId;       // the deposit's _id
  positionType: "deposit";
  principal: number;          // deposit.amount
  rate: number;                // ratePct / 100, the per-interval rate at time of credit
  income: number;              // ratePct% * principal * intervalsCredited
  intervalsCredited: number;   // how many intervals this entry covers
  date: string;                 // "YYYY-MM-DD", for display/sort consistency with other ledger entries
  createdAt: Date;
}
```

Reusing `bonusLedger` means `/api/income/all` (which already reads all
`positionType`s from `bonusLedger`) and `getWalletSummary()`'s aggregation
pattern extend with minimal new code.

## Accrual logic

New function in `src/lib/accrual.ts`:

```ts
async function runDepositIncomeAccrual(db: Db): Promise<void>
```

For each `Approved` deposit:

1. Read `settings.depositIncome`. If `!enabled`, skip entirely (no writes,
   no field initialization needed beyond approval-time defaults).
2. `intervalMs = intervalHours * 3600_000`.
3. `totalDueIntervals = floor((now - depositIncomeStartAt) / intervalMs)`.
4. `newIntervals = totalDueIntervals - creditedIntervals`.
5. If `newIntervals >= 1`:
   - `income = round2(deposit.amount * (ratePct / 100) * newIntervals)`.
   - Insert one `bonusLedger` entry (as above) with `intervalsCredited:
     newIntervals`.
   - `db.deposits.updateOne({_id}, {$set: {creditedIntervals:
     totalDueIntervals}})`.

This is idempotent and safe to call redundantly (calling it twice in the same
second is a no-op the second time, since `newIntervals` will be `0`) — no
global date watermark is needed, unlike `runTradingBonusPhase`, because the
guard is per-deposit (`creditedIntervals`), not per-calendar-day. Because
interest is simple (not compounding), it doesn't matter whether this runs
every minute or once a week — the total income at any wall-clock instant is
identical, just batched differently across ledger entries.

`runDepositIncomeAccrual` is called from the same three places
`runDailyAccrual()` already runs from, so it needs no new trigger
infrastructure:

- `src/app/dashboard/page.tsx` (lazy, on every dashboard visit)
- `POST /api/admin/accrue` (admin manual trigger)
- `GET /api/cron/accrue` (external cron/pinger, if configured)

## Wallet summary changes

`WalletSummary` (in `src/lib/accrual.ts`) gains `totalDepositIncome: number`,
computed via `sumField(db, "bonusLedger", { memberId, positionType:
"deposit" }, "income")` and folded into the existing `totalIncome` sum
alongside staking/investment bonus, leadership, and rewards. `netIncome`
(income minus income-type withdrawals) covers deposit income automatically
since it already nets `totalIncome` against `totalIncomeWithdrawal` — no
separate withdrawal type is introduced; deposit income withdraws through the
existing `type: "income"` withdrawal path.

Consumers of `WalletSummary` (`DashboardView.tsx`, `admin/members/[memberId]`,
`withdrawals` route, `InvestmentWithdraw`/`Withdraw` components) need no
changes beyond `DashboardView.tsx`, which gets the new field added to its
local `WalletSummary` type, `EMPTY_WALLET`, and a new stat tile ("Deposit
Income") — the others only read pre-existing fields and are unaffected by an
additive field.

## New/changed API surface

- `GET /api/income/deposit` — new route mirroring `GET /api/income/staking`
  and `GET /api/income/investment`: returns the caller's `bonusLedger`
  entries where `positionType: "deposit"`.
- `PATCH /api/admin/settings` — accepts an optional `depositIncome` patch
  (validated as described above), same handler that already validates
  `startupPlan`.
- No new endpoints for triggering — reuses `/api/admin/accrue` and
  `/api/cron/accrue`.

## New/changed UI

- `src/app/admin/(protected)/settings/page.tsx` — new "Deposit Income"
  section: enabled toggle, rate % input, interval-hours input (accepts
  fractional values so an admin can set e.g. `0.0167` hours ≈ 1 minute for
  quick manual testing).
- `src/components/dashboard/IncomeDepositBonus.tsx` — new component mirroring
  `IncomeStakingBonus.tsx` / `IncomeInvBonus.tsx`, backed by `GET
  /api/income/deposit`.
- `DashboardView.tsx` — one new stat tile for "Deposit Income" next to the
  existing Staking/Investment Trading Bonus tiles, reading
  `wallet.totalDepositIncome`.

## Testing / verification plan

1. As admin, set `depositIncome.intervalHours` to a small value (e.g. `0.02`
   ≈ 72 seconds) and `ratePct` to `0.5` via the settings UI.
2. As a member, submit and have an admin approve a deposit (e.g. $100).
   Confirm `depositIncomeStartAt` and `creditedIntervals: 0` are set on
   approval.
3. Wait past one interval, then reload the member dashboard (triggers lazy
   accrual) or click the admin's manual "run accrual" button.
4. Confirm a `bonusLedger` entry with `positionType: "deposit"` appears, and
   the wallet summary's `totalDepositIncome`/`totalIncome` reflect it.
5. Approve a second deposit (e.g. another $100) at a distinctly later time.
   Confirm each deposit accrues independently off its own
   `depositIncomeStartAt`/`creditedIntervals`, matching the original
   "$100 now, $100 an hour later" example.
6. Toggle `depositIncome.enabled` off and confirm no further accrual occurs
   for any deposit until re-enabled.
