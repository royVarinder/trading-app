# Deposit Income Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every admin-approved deposit automatically earns its own simple-interest income at an admin-configurable rate (%) and interval (hours), independent of the existing investment/staking bonus system.

**Architecture:** Reuse the existing `bonusLedger`/accrual pattern (`src/lib/accrual.ts`) rather than building a parallel system. A new `runDepositIncomeAccrual()` function walks all `Approved` deposits, computes how many configured intervals have elapsed since each deposit's own start time, and credits `bonusLedger` (a new `positionType: "deposit"`) — exactly the way `runTradingBonusPhase` already credits investment/staking positions, but keyed off per-deposit elapsed intervals instead of a shared calendar-day watermark. It's wired into the same three places the existing daily accrual already runs from (dashboard page load, admin manual trigger, external cron endpoint) via a new combined `runAllAccruals()` entrypoint.

**Tech Stack:** Next.js App Router, MongoDB (native driver, no ORM), TypeScript, Tailwind. No test runner exists in this repo (no Jest/Vitest, no `*.test.ts` files anywhere) — this plan follows that reality rather than introducing one unprompted. Each task's "Verify" step is a concrete, runnable command (a throwaway `node --env-file=.env.local -e "..."` snippet against the real dev database, or `curl` against `next dev`, or a manual browser check) instead of a unit test — the same style already used by `scripts/create-admin.mjs`.

**Spec:** `docs/superpowers/specs/2026-09-08-deposit-income-design.md`

## Global Constraints

- Simple interest only — never compound. Income for N newly-elapsed intervals is always `deposit.amount * (ratePct / 100) * N`.
- No leadership/sponsor commission on deposit income (unlike investment/staking bonuses).
- No duration cap — a deposit accrues indefinitely while `status: "Approved"`.
- No new background scheduler/cron infra (no `vercel.json`) — accrual stays lazy, triggered by page loads / manual admin action / the existing optional external pinger.
- Reuse `bonusLedger` (extend `positionType` to include `"deposit"`) — do not create a new collection.
- The existing unique index `bonusLedger.createIndex({ positionId: 1, date: 1 }, { unique: true })` must keep working as the concurrency guard. This means the `date` field on a deposit-income ledger entry must be a **deterministic** function of `(depositId, totalDueIntervals)` — never wall-clock `now` — so that two concurrent accrual runs computing the same due-interval count collide on insert (caught as a no-op) instead of double-crediting. See Task 3 for the exact formula.
- Do not add `depositIncome` to `PublicSettings`/`getPublicSettings()` — it's admin-only configuration, not a member-facing plan choice like `startupPlan`/`stakingTiers`.

---

### Task 1: Deposit income settings (schema + admin validation)

**Files:**
- Modify: `src/lib/settings.ts`
- Modify: `src/app/api/admin/settings/route.ts`

**Interfaces:**
- Produces: `PlatformSettings.depositIncome: { enabled: boolean; ratePct: number; intervalHours: number }`, and `DEFAULT_SETTINGS.depositIncome = { enabled: true, ratePct: 0.5, intervalHours: 24 }`. Later tasks read this via `(await getSettings()).depositIncome`.

- [ ] **Step 1: Add `depositIncome` to the settings type and defaults**

In `src/lib/settings.ts`, update the `PlatformSettings` type:

```ts
export type PlatformSettings = {
  startupPlan: { min: number; dailyRate: number };
  stakingTiers: StakingTier[];
  leadershipRanks: LeadershipRank[];
  depositWalletAddress: string;
  withdrawalMin: number;
  withdrawalAdminChargeRate: number;
  depositIncome: { enabled: boolean; ratePct: number; intervalHours: number };
};
```

Update `DEFAULT_SETTINGS` to add, alongside the existing fields:

```ts
  depositIncome: { enabled: true, ratePct: 0.5, intervalHours: 24 },
```

Update `getSettings()`'s value construction to add:

```ts
    depositIncome: doc?.depositIncome ?? DEFAULT_SETTINGS.depositIncome,
```

(`PublicSettings`/`getPublicSettings()` stay unchanged — see Global Constraints.)

- [ ] **Step 2: Verify the default shape**

Run:

```bash
node --env-file=.env.local -e "
const { DEFAULT_SETTINGS } = require('./src/lib/settings.ts');
console.log(DEFAULT_SETTINGS.depositIncome);
"
```

This will fail directly (the repo has no `ts-node`/`require` TS loader). Instead verify with the TypeScript compiler, which is already a project dependency:

Run: `npx tsc --noEmit`
Expected: no new type errors (confirms `depositIncome` is well-typed and every existing reference to `PlatformSettings` still compiles).

- [ ] **Step 3: Add admin PATCH validation**

In `src/app/api/admin/settings/route.ts`, add this block after the existing `withdrawalAdminChargeRate` block (before the `if (Object.keys(patch).length === 0)` check):

```ts
  if (body.depositIncome) {
    const enabled = Boolean(body.depositIncome.enabled);
    const ratePct = Number(body.depositIncome.ratePct);
    const intervalHours = Number(body.depositIncome.intervalHours);
    if (!Number.isFinite(ratePct) || ratePct < 0 || !Number.isFinite(intervalHours) || intervalHours <= 0) {
      return NextResponse.json({ error: "Invalid deposit income values." }, { status: 400 });
    }
    patch.depositIncome = { enabled, ratePct, intervalHours };
  }
```

- [ ] **Step 4: Verify via the running dev server**

Run: `npm run dev` (leave running), then in another shell, log in as a super admin and capture the admin session cookie (reuse however other manual admin testing is normally done in this repo, e.g. via the browser devtools cookie after logging in at `/admin/login`), then:

```bash
curl -s -X PATCH http://localhost:3000/api/admin/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: primefx_admin_session=<paste session cookie>" \
  -d '{"depositIncome":{"enabled":true,"ratePct":0.5,"intervalHours":24}}'
```

Expected: JSON response echoing back `depositIncome: { enabled: true, ratePct: 0.5, intervalHours: 24 }` alongside the rest of the settings document.

- [ ] **Step 5: Commit**

```bash
git add src/lib/settings.ts src/app/api/admin/settings/route.ts
git commit -m "feat: add configurable deposit income rate/interval to settings"
```

---

### Task 2: Track accrual start on deposit approval

**Files:**
- Modify: `src/app/api/admin/deposits/[id]/route.ts`

**Interfaces:**
- Produces: an `Approved` deposit document now always has `depositIncomeStartAt: Date` and `creditedIntervals: number` (starts at `0`) set at the moment of approval. Task 3's accrual function relies on these two fields (and lazily backfills them for deposits approved before this change shipped).

- [ ] **Step 1: Set accrual-start fields when approving**

In `src/app/api/admin/deposits/[id]/route.ts`, replace:

```ts
  const newStatus = action === "approve" ? "Approved" : "Rejected";
  await db.collection("deposits").updateOne(
    { _id: deposit._id },
    {
      $set: {
        status: newStatus,
        reviewedBy: session.username,
        reviewedAt: new Date(),
        rejectionReason: action === "reject" ? rejectionReason || "Not specified" : null,
      },
    }
  );
```

with:

```ts
  const newStatus = action === "approve" ? "Approved" : "Rejected";
  const reviewedAt = new Date();
  const setFields: Record<string, unknown> = {
    status: newStatus,
    reviewedBy: session.username,
    reviewedAt,
    rejectionReason: action === "reject" ? rejectionReason || "Not specified" : null,
  };
  if (action === "approve") {
    // Anchors deposit-income accrual (src/lib/accrual.ts#runDepositIncomeAccrual) —
    // this deposit starts earning from the moment it's approved, not from
    // when it was originally submitted.
    setFields.depositIncomeStartAt = reviewedAt;
    setFields.creditedIntervals = 0;
  }
  await db.collection("deposits").updateOne({ _id: deposit._id }, { $set: setFields });
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no new type errors.

With `next dev` running and a Pending test deposit already submitted by a test member account, approve it via the admin UI (`/admin/deposits`) or:

```bash
curl -s -X PATCH http://localhost:3000/api/admin/deposits/<depositId> \
  -H "Content-Type: application/json" \
  -H "Cookie: primefx_admin_session=<paste session cookie>" \
  -d '{"action":"approve"}'
```

Then check the document directly:

```bash
node --env-file=.env.local -e "
const { MongoClient } = require('mongodb');
(async () => {
  const client = await new MongoClient(process.env.MONGODB_URI).connect();
  const db = client.db(process.env.MONGODB_DB || 'primefx');
  const dep = await db.collection('deposits').findOne({ status: 'Approved' }, { sort: { reviewedAt: -1 } });
  console.log({ depositIncomeStartAt: dep.depositIncomeStartAt, creditedIntervals: dep.creditedIntervals });
  await client.close();
})();
"
```

Expected: `depositIncomeStartAt` is a recent `Date`, `creditedIntervals` is `0`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/deposits/\[id\]/route.ts
git commit -m "feat: anchor deposit income accrual start time on approval"
```

---

### Task 3: Deposit income accrual engine + wallet summary

**Files:**
- Modify: `src/lib/accrual.ts`

**Interfaces:**
- Consumes: `getSettings()` → `.depositIncome` (Task 1); `deposits` documents with `status`, `amount`, `depositIncomeStartAt`, `creditedIntervals`, `createdAt` (Task 2).
- Produces:
  - `export async function runDepositIncomeAccrual(): Promise<void>`
  - `export async function runAllAccruals(): Promise<void>` — calls both `runDailyAccrual()` and `runDepositIncomeAccrual()`. Task 4's trigger points call this instead of `runDailyAccrual()` directly.
  - `WalletSummary` gains `totalDepositIncome: number`, included in `totalIncome`.

- [ ] **Step 1: Add `totalDepositIncome` to `WalletSummary`**

Replace:

```ts
export type WalletSummary = {
  rank: string;
  totalSelfInvestment: number;
  totalStakingBonus: number;
  totalInvestmentBonus: number;
  totalLeadership: number;
  totalRewards: number;
  totalIncome: number;
  totalIncomeWithdrawal: number;
  netIncome: number;
  totalCapitalWithdrawal: number;
  netCapital: number;
};
```

with:

```ts
export type WalletSummary = {
  rank: string;
  totalSelfInvestment: number;
  totalStakingBonus: number;
  totalInvestmentBonus: number;
  totalDepositIncome: number;
  totalLeadership: number;
  totalRewards: number;
  totalIncome: number;
  totalIncomeWithdrawal: number;
  netIncome: number;
  totalCapitalWithdrawal: number;
  netCapital: number;
};
```

- [ ] **Step 2: Fold `totalDepositIncome` into `getWalletSummary()`**

Replace the whole `getWalletSummary` function body with:

```ts
export async function getWalletSummary(memberId: string): Promise<WalletSummary> {
  const db = await getDb();

  const [
    investmentPrincipal,
    stakePrincipal,
    totalStakingBonus,
    totalInvestmentBonus,
    totalDepositIncome,
    totalLeadership,
    totalRewards,
    totalIncomeWithdrawal,
    totalCapitalWithdrawal,
    rank,
  ] = await Promise.all([
    sumField(db, "investments", { memberId }, "amount"),
    sumField(db, "stakes", { memberId }, "amount"),
    sumField(db, "bonusLedger", { memberId, positionType: "staking" }, "income"),
    sumField(db, "bonusLedger", { memberId, positionType: "investment" }, "income"),
    sumField(db, "bonusLedger", { memberId, positionType: "deposit" }, "income"),
    sumField(db, "leadershipLedger", { beneficiaryMemberId: memberId }, "income"),
    sumField(db, "rewardLedger", { memberId }, "amount"),
    sumField(
      db,
      "withdrawals",
      { memberId, type: "income", status: { $in: ["Pending", "Approved", "Paid"] } },
      "amount"
    ),
    sumField(
      db,
      "withdrawals",
      { memberId, type: "investment", status: { $in: ["Pending", "Approved", "Paid"] } },
      "amount"
    ),
    computeRank(memberId),
  ]);

  const totalSelfInvestment = round2(investmentPrincipal + stakePrincipal);
  const totalIncome = round2(
    totalStakingBonus + totalInvestmentBonus + totalDepositIncome + totalLeadership + totalRewards
  );
  const netIncome = Math.max(0, round2(totalIncome - totalIncomeWithdrawal));
  const dividendsEarned = round2(totalStakingBonus + totalInvestmentBonus);
  const netCapital = Math.max(0, round2(totalSelfInvestment - dividendsEarned - totalCapitalWithdrawal));

  return {
    rank: rank?.rank ?? "No-Rank",
    totalSelfInvestment,
    totalStakingBonus: round2(totalStakingBonus),
    totalInvestmentBonus: round2(totalInvestmentBonus),
    totalDepositIncome: round2(totalDepositIncome),
    totalLeadership: round2(totalLeadership),
    totalRewards: round2(totalRewards),
    totalIncome,
    totalIncomeWithdrawal: round2(totalIncomeWithdrawal),
    netIncome,
    totalCapitalWithdrawal: round2(totalCapitalWithdrawal),
    netCapital,
  };
}
```

(Note: `dividendsEarned`/`netCapital` deliberately do NOT include `totalDepositIncome` — deposits aren't part of `totalSelfInvestment` in the first place, so there's nothing to net against there. Deposit income only affects the income side, same as staking/investment bonuses.)

- [ ] **Step 3: Add `runDepositIncomeAccrual()` and `runAllAccruals()`**

Add this at the end of `src/lib/accrual.ts` (after `getWalletSummary`):

```ts
/**
 * Credits deposit income independently for every Approved deposit, based on
 * how many admin-configured intervals have elapsed since that deposit's own
 * depositIncomeStartAt — not a shared calendar-day watermark like
 * runTradingBonusPhase. Simple interest: each newly-elapsed interval is
 * worth `amount * (ratePct / 100)`, so it doesn't matter whether this runs
 * every minute or once a week — the total at any instant is identical,
 * only how it's batched into bonusLedger entries differs.
 *
 * The `date` field on each ledger entry is deliberately NOT wall-clock time.
 * It's derived from (depositIncomeStartAt, totalDueIntervals) so that two
 * concurrent runs computing the same due-interval count for the same
 * deposit collide on the bonusLedger{positionId,date} unique index — the
 * second insert throws a duplicate-key error, caught below and treated as
 * a no-op, the same guard runTradingBonusPhase already relies on for
 * investment/staking positions.
 */
export async function runDepositIncomeAccrual(): Promise<void> {
  const db = await getDb();
  const { depositIncome } = await getSettings();
  if (!depositIncome.enabled) return;

  // Backfill deposits approved before this feature existed — they have no
  // depositIncomeStartAt yet. Only touches docs missing the field, so this
  // is a cheap no-op on every subsequent call.
  await db.collection("deposits").updateMany(
    { status: "Approved", depositIncomeStartAt: { $exists: false } },
    [{ $set: { depositIncomeStartAt: "$createdAt", creditedIntervals: 0 } }]
  );

  const intervalMs = depositIncome.intervalHours * 3600_000;
  const now = Date.now();

  const deposits = await db
    .collection("deposits")
    .find({ status: "Approved" })
    .toArray();

  for (const deposit of deposits) {
    const startAt = new Date(deposit.depositIncomeStartAt).getTime();
    const creditedIntervals = (deposit.creditedIntervals as number | undefined) ?? 0;
    const totalDueIntervals = Math.floor((now - startAt) / intervalMs);
    const newIntervals = totalDueIntervals - creditedIntervals;
    if (newIntervals < 1) continue;

    const income = round2((deposit.amount as number) * (depositIncome.ratePct / 100) * newIntervals);
    const dueAt = new Date(startAt + totalDueIntervals * intervalMs);

    try {
      await db.collection("bonusLedger").insertOne({
        memberId: deposit.memberId,
        positionId: deposit._id,
        positionType: "deposit",
        principal: deposit.amount,
        rate: depositIncome.ratePct / 100,
        income,
        intervalsCredited: newIntervals,
        date: dueAt.toISOString(),
        createdAt: new Date(),
      });
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "code" in err && err.code === 11000) {
        continue; // another concurrent run already credited up to this interval
      }
      throw err;
    }

    await db
      .collection("deposits")
      .updateOne({ _id: deposit._id }, { $max: { creditedIntervals: totalDueIntervals } });
  }
}

/** Single entrypoint the three trigger points (dashboard load, admin manual
 * trigger, external cron) call — runs the existing daily trading-bonus/
 * monthly-reward phases plus the new deposit income phase. */
export async function runAllAccruals(): Promise<void> {
  await runDailyAccrual();
  await runDepositIncomeAccrual();
}
```

- [ ] **Step 4: Verify the interval math with a throwaway script**

Run:

```bash
node --env-file=.env.local -e "
const { MongoClient, ObjectId } = require('mongodb');
(async () => {
  const client = await new MongoClient(process.env.MONGODB_URI).connect();
  const db = client.db(process.env.MONGODB_DB || 'primefx');

  // Insert a fake deposit whose accrual window started 3 intervals ago
  // (using a 1-minute interval for a fast test) with no prior credits.
  const startAt = new Date(Date.now() - 3.5 * 60_000); // 3.5 minutes ago
  const dep = await db.collection('deposits').insertOne({
    memberId: 'TEST-VERIFY',
    username: 'test-verify',
    amount: 1000,
    status: 'Approved',
    depositIncomeStartAt: startAt,
    creditedIntervals: 0,
    createdAt: startAt,
  });

  await db.collection('settings').updateOne(
    { _id: 'platform' },
    { \$set: { depositIncome: { enabled: true, ratePct: 0.5, intervalHours: 1 / 60 } } },
    { upsert: true }
  );

  console.log('Inserted test deposit', dep.insertedId.toString(), '— now run runDepositIncomeAccrual() via the app and re-check bonusLedger for positionId', dep.insertedId.toString());
  await client.close();
})();
"
```

Then, with `next dev` running, trigger accrual by visiting the dashboard (or `POST /api/admin/accrue`), and check the result:

```bash
node --env-file=.env.local -e "
const { MongoClient } = require('mongodb');
(async () => {
  const client = await new MongoClient(process.env.MONGODB_URI).connect();
  const db = client.db(process.env.MONGODB_DB || 'primefx');
  const entries = await db.collection('bonusLedger').find({ memberId: 'TEST-VERIFY' }).toArray();
  console.log(entries);
  const dep = await db.collection('deposits').findOne({ memberId: 'TEST-VERIFY' });
  console.log({ creditedIntervals: dep.creditedIntervals });
  await client.close();
})();
"
```

Expected: one `bonusLedger` entry with `positionType: 'deposit'`, `intervalsCredited: 3`, `income: 15` (1000 \* 0.005 \* 3), and the deposit's `creditedIntervals` is now `3`. Run the accrual trigger a second time immediately after — expected: no new ledger entry (0 or 1 more interval elapsed at most, and if 0, nothing is inserted; re-running with no new elapsed time produces no duplicate for the same interval count).

Clean up the test data:

```bash
node --env-file=.env.local -e "
const { MongoClient } = require('mongodb');
(async () => {
  const client = await new MongoClient(process.env.MONGODB_URI).connect();
  const db = client.db(process.env.MONGODB_DB || 'primefx');
  await db.collection('deposits').deleteMany({ memberId: 'TEST-VERIFY' });
  await db.collection('bonusLedger').deleteMany({ memberId: 'TEST-VERIFY' });
  await db.collection('settings').updateOne({ _id: 'platform' }, { \$set: { depositIncome: { enabled: true, ratePct: 0.5, intervalHours: 24 } } });
  await client.close();
})();
"
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/accrual.ts
git commit -m "feat: add deposit income accrual engine and fold into wallet summary"
```

---

### Task 4: Wire the new accrual into existing trigger points

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/api/admin/accrue/route.ts`
- Modify: `src/app/api/cron/accrue/route.ts`

**Interfaces:**
- Consumes: `runAllAccruals(): Promise<void>` from `@/lib/accrual` (Task 3).

- [ ] **Step 1: Dashboard lazy trigger**

In `src/app/dashboard/page.tsx`, replace:

```ts
import { runDailyAccrual } from "@/lib/accrual";
```

with:

```ts
import { runAllAccruals } from "@/lib/accrual";
```

and replace:

```ts
  await runDailyAccrual();
```

with:

```ts
  await runAllAccruals();
```

- [ ] **Step 2: Admin manual trigger**

In `src/app/api/admin/accrue/route.ts`, replace:

```ts
import { runDailyAccrual } from "@/lib/accrual";
```

with:

```ts
import { runAllAccruals } from "@/lib/accrual";
```

and replace:

```ts
  await runDailyAccrual();
```

with:

```ts
  await runAllAccruals();
```

- [ ] **Step 3: External cron endpoint**

In `src/app/api/cron/accrue/route.ts`, replace:

```ts
import { runDailyAccrual } from "@/lib/accrual";
```

with:

```ts
import { runAllAccruals } from "@/lib/accrual";
```

and replace:

```ts
  await runDailyAccrual();
```

with:

```ts
  await runAllAccruals();
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors (confirms all three call sites resolve `runAllAccruals` correctly).

With `next dev` running, load `/dashboard` as a logged-in member and confirm no server error in the terminal — this exercises `runAllAccruals()` end-to-end (both the existing daily phase and the new deposit phase) on a real request.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx src/app/api/admin/accrue/route.ts src/app/api/cron/accrue/route.ts
git commit -m "feat: run deposit income accrual from all existing accrual trigger points"
```

---

### Task 5: `GET /api/income/deposit`

**Files:**
- Create: `src/app/api/income/deposit/route.ts`

**Interfaces:**
- Consumes: `bonusLedger` documents with `positionType: "deposit"` (Task 3).
- Produces: `GET /api/income/deposit` → `{ entries: { id: string; principal: number; income: number; intervalsCredited: number; date: string }[] }`. Task 6's `IncomeDepositBonus` component fetches this.

- [ ] **Step 1: Create the route**

```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = await getDb();
  const entries = await db
    .collection("bonusLedger")
    .find({ memberId: session.memberId, positionType: "deposit" })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e._id.toString(),
      principal: e.principal,
      income: e.income,
      intervalsCredited: e.intervalsCredited,
      date: e.date,
    })),
  });
}
```

- [ ] **Step 2: Verify**

With `next dev` running and a logged-in member session cookie (`primefx_session`) for a member with at least one `bonusLedger` entry from Task 3's verification (or a fresh one credited via the dashboard):

```bash
curl -s http://localhost:3000/api/income/deposit -H "Cookie: primefx_session=<paste session cookie>"
```

Expected: `{"entries":[...]}` — an array (possibly empty if the member has no deposit-income entries yet, which is a valid response, not an error).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/income/deposit/route.ts
git commit -m "feat: add GET /api/income/deposit endpoint"
```

---

### Task 6: Dashboard UI — stat tile, income history page, nav entry

**Files:**
- Create: `src/components/dashboard/IncomeDepositBonus.tsx`
- Modify: `src/components/dashboard/menu.ts`
- Modify: `src/components/HomeShell.tsx`
- Modify: `src/components/dashboard/DashboardView.tsx`

**Interfaces:**
- Consumes: `GET /api/income/deposit` (Task 5); `WalletSummary.totalDepositIncome` via `GET /api/wallet` (Task 3, already passed through unchanged by `src/app/api/wallet/route.ts`).
- Produces: `MenuId` gains `"income-deposit-bonus"`; `IncomeDepositBonus({ memberId }: { memberId: string })` component.

- [ ] **Step 1: Create the income history component**

Mirrors `src/components/dashboard/IncomeStakingBonus.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type DepositIncomeEntry = {
  id: string;
  principal: number;
  income: number;
  intervalsCredited: number;
  date: string;
};

export function IncomeDepositBonus({ memberId }: { memberId: string }) {
  const [entries, setEntries] = useState<DepositIncomeEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/income/deposit")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setEntries(data.entries ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load your deposit income history.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    entries?.map((e, i) => ({
      "#": i + 1,
      id: memberId,
      deposit: `$${e.principal.toFixed(2)}`,
      intervals: e.intervalsCredited,
      income: `$${e.income.toFixed(2)}`,
      date: new Date(e.date).toLocaleDateString(),
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Deposit Income" subtitle="Profit earned automatically on your approved deposits." />

      {entries === null && !error ? (
        <TableSkeleton columns={6} rows={2} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "id", label: "Member ID" },
            { key: "deposit", label: "Deposit" },
            { key: "intervals", label: "Intervals" },
            { key: "income", label: "Income" },
            { key: "date", label: "Date" },
          ]}
          rows={rows}
          emptyMessage="No deposit income earned yet."
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add the nav entry**

In `src/components/dashboard/menu.ts`, add `"income-deposit-bonus"` to the `MenuId` union, right after `"income-staking-bonus"`:

```ts
  | "income-staking-bonus"
  | "income-deposit-bonus"
  | "income-inv-bonus"
```

Then add a child entry to the `"income-report"` section's `children` array, as the first child:

```ts
    children: [
      { id: "income-deposit-bonus", label: "Deposit Income" },
      { id: "income-staking-bonus", label: "Staking Trading Bonus" },
      { id: "income-inv-bonus", label: "Inv Trading Bonus" },
      { id: "income-all-bonus", label: "All Invs & Staking Bonus" },
      { id: "income-leadership", label: "Leadership Bonus" },
      { id: "income-monthly-reward", label: "Monthly Rewards Bonus" },
    ],
```

- [ ] **Step 3: Wire it into `HomeShell`**

In `src/components/HomeShell.tsx`, add the import alongside the other income imports:

```ts
import { IncomeDepositBonus } from "@/components/dashboard/IncomeDepositBonus";
```

and add the entry to the `content` map, right after `"income-staking-bonus"`:

```ts
    "income-staking-bonus": <IncomeStakingBonus memberId={memberId} />,
    "income-deposit-bonus": <IncomeDepositBonus memberId={memberId} />,
    "income-inv-bonus": <IncomeInvBonus memberId={memberId} />,
```

- [ ] **Step 4: Add the dashboard stat tile**

In `src/components/dashboard/DashboardView.tsx`, add `totalDepositIncome` to the local `WalletSummary` type (right after `totalInvestmentBonus`):

```ts
  totalDepositIncome: number;
```

Add it to `EMPTY_WALLET` too:

```ts
  totalDepositIncome: 0,
```

Add a stat tile to the `stats` array, right after the Investment Trading Bonus tile:

```ts
    { label: "Deposit Income", value: `$${wallet.totalDepositIncome.toFixed(2)}`, icon: DepositIcon },
```

(Reuses `DepositIcon`, already imported and already reused for the "Total Income" tile — no new icon import needed.)

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

With `next dev` running, log in as the member who has the deposit-income ledger entry from Task 3's verification (or trigger a fresh one), open the dashboard, and confirm:
- A "Deposit Income" stat tile shows a non-zero dollar amount.
- The sidebar's "Income Report" section has a new "Deposit Income" link that renders a table with the credited entry.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/IncomeDepositBonus.tsx src/components/dashboard/menu.ts src/components/HomeShell.tsx src/components/dashboard/DashboardView.tsx
git commit -m "feat: add deposit income dashboard tile and income history page"
```

---

### Task 7: Admin settings UI

**Files:**
- Modify: `src/app/admin/(protected)/settings/page.tsx`

**Interfaces:**
- Consumes: `GET /api/admin/settings` / `PATCH /api/admin/settings` with `depositIncome` (Task 1).

- [ ] **Step 1: Add `depositIncome` to the local `Settings` type**

In `src/app/admin/(protected)/settings/page.tsx`, update the local `Settings` type:

```ts
type Settings = {
  startupPlan: { min: number; dailyRate: number };
  stakingTiers: StakingTier[];
  leadershipRanks: LeadershipRank[];
  depositWalletAddress: string;
  withdrawalMin: number;
  withdrawalAdminChargeRate: number;
  depositIncome: { enabled: boolean; ratePct: number; intervalHours: number };
};
```

- [ ] **Step 2: Add a "Deposit Income" settings section**

Insert this new section right after the "Startup (Investment) Plan" card (after its closing `</div>`, before the "Staking Tiers" card):

```tsx
      <div className="rounded-2xl border border-[color:var(--fincept-border)] bg-[color:var(--fincept-card)] p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[color:var(--fincept-text)]">Deposit Income</h2>
        <p className="mt-1 text-xs text-[color:var(--fincept-text-muted)]">
          Every approved deposit earns this rate, automatically, every N hours — independent of investments/staking.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <input
              id="depositIncomeEnabled"
              type="checkbox"
              checked={settings.depositIncome.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  depositIncome: { ...settings.depositIncome, enabled: e.target.checked },
                })
              }
            />
            <label htmlFor="depositIncomeEnabled" className="field-label mb-0">
              Enabled
            </label>
          </div>
          <div>
            <label className="field-label">Rate per interval (%)</label>
            <input
              type="number"
              step="0.01"
              className="field-input"
              value={settings.depositIncome.ratePct}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  depositIncome: { ...settings.depositIncome, ratePct: Number(e.target.value) },
                })
              }
            />
          </div>
          <div>
            <label className="field-label">Interval (hours)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="field-input"
              value={settings.depositIncome.intervalHours}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  depositIncome: { ...settings.depositIncome, intervalHours: Number(e.target.value) },
                })
              }
            />
            <p className="mt-1 text-[11px] text-[color:var(--fincept-text-muted)]">
              e.g. 24 for daily, 1 for hourly, 0.02 (~1 minute) for quick testing.
            </p>
          </div>
        </div>
      </div>
```

Note: unlike `startupPlan.dailyRate`/`stakingTiers[].dailyRate`, `depositIncome.ratePct` is stored and sent as a plain percent number (e.g. `0.5`, not `0.005`) — so no `toPercentDisplay()`/`/100` conversion is needed here, matching the `PlatformSettings.depositIncome.ratePct` shape defined in Task 1.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

With `next dev` running, log in as a super admin, open `/admin/settings`, confirm the new "Deposit Income" card renders with the current values (`enabled: true`, `ratePct: 0.5`, `intervalHours: 24` by default), change the interval to `0.02`, click "Save Settings", and confirm the success message appears and a page reload shows the saved value persisted.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(protected)/settings/page.tsx"
git commit -m "feat: add deposit income controls to admin settings page"
```

---

### Task 8: End-to-end verification against the original scenario

**Files:** none (manual verification only — nothing to commit).

- [ ] **Step 1: Reproduce the original example**

With `next dev` running:

1. As admin, set `depositIncome` to `{ enabled: true, ratePct: 0.5, intervalHours: 0.0167 }` (~1 minute) via `/admin/settings`, so the scenario doesn't require waiting 24 hours.
2. As a test member, submit a $100 deposit and have the admin approve it. Note the approval time.
3. Wait ~2 minutes, then reload the member dashboard. Confirm the "Deposit Income" tile shows ~$1.00 (2 intervals × 0.5% × $100).
4. Approve a second $100 deposit for the same member (simulating "deposited 100 again an hour later").
5. Wait ~2 more minutes, reload the dashboard again. Confirm the "Deposit Income" tile now reflects income from **both** deposits, each accruing off its own approval time — i.e. the total is more than what a single $100 deposit would have earned over the same elapsed time, and the `/api/income/deposit` history shows separate ledger entries per deposit (`positionId` differs between them).

- [ ] **Step 2: Confirm the disable switch works**

Toggle `depositIncome.enabled` off in `/admin/settings`, wait a couple minutes, reload the dashboard, and confirm the "Deposit Income" tile stops increasing (no new `bonusLedger` entries for either test deposit) until re-enabled.

- [ ] **Step 3: Clean up test data**

```bash
node --env-file=.env.local -e "
const { MongoClient } = require('mongodb');
(async () => {
  const client = await new MongoClient(process.env.MONGODB_URI).connect();
  const db = client.db(process.env.MONGODB_DB || 'primefx');
  await db.collection('settings').updateOne(
    { _id: 'platform' },
    { \$set: { depositIncome: { enabled: true, ratePct: 0.5, intervalHours: 24 } } }
  );
  await client.close();
})();
"
```

Resets the interval back to the real default (24h) once you're done testing — leave the test member's deposits/ledger entries in place unless you specifically want a clean slate (they're harmless real data at that point).
