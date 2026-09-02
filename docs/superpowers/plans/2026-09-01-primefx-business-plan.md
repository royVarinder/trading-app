# PRIMEFX Business Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the PRIMEFX business plan (Startup investment plan, 5-tier staking plans, leadership rank commissions, monthly rewards, withdrawal rules) into real backend logic, and rebrand the app from "Win FX" to "PRIMEFX" throughout.

**Architecture:** Extend the existing `investments` collection and add `stakes`, `bonusLedger`, `leadershipLedger`, `rewardLedger`, and a `system` watermark collection. A single idempotent `runDailyAccrual()` function credits daily trading bonuses (Mon–Fri only) and monthly rank rewards; it is called both lazily (every authenticated page load, cheap no-op after the first call of the day) and optionally via a cron-secured route. All money math funnels through a small number of shared lib functions (`getAvailableFund`, `getWalletSummary`, `computeRank`) that every API route and component reads from, mirroring the existing `/api/team` "compute fresh, one shared source of truth" pattern already in this codebase.

**Tech Stack:** Next.js 16 App Router, TypeScript, MongoDB native driver (no ODM), existing session/auth/mailer libs — no new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-01-primefx-business-plan-design.md`

## Global Constraints

- No real payment rails, no real crypto wallet address, no admin approval UI — deposits/withdrawals/stakes are approved by direct MongoDB edit, exactly like the existing `deposits` flow (per spec's Out of Scope and the user's explicit choice).
- Money amounts are always rounded to 2 decimal places at the point of computation (`Math.round(n * 100) / 100`), matching the existing `withdrawals/route.ts` convention.
- All new API routes follow the existing pattern exactly: `getSession()` → `401 {error}` if missing; invalid/malformed body → `400 {error}` with a specific message; dates serialize as ISO strings (or `"YYYY-MM-DD"` for ledger `date` fields, which are day-keys, not timestamps).
- **No test runner exists in this repo and none is being added.** Every task ends with a "Manual verification" note describing how a human would check the work later — these are descriptions for the record, not commands to run now.
- **Do not run `npm run build`, `npm run dev`, `npm run lint`, or any other command that executes the app, and do not run `git commit`.** The user reviews and commits this work themselves. Skip the "run tests"/"commit" steps that a normal plan would have — implementation steps only.
- Brand name is **"PRIMEFX"** (one word) everywhere user-facing text appears. Member ID prefix is **"PFX"**.

---

### Task 1: Rebrand — "Win FX" → "PRIMEFX", Member ID prefix

**Files:**
- Modify: `src/lib/constants.ts`
- Modify: `src/lib/counters.ts`
- Modify: `src/lib/mongodb.ts:28`
- Modify: `src/app/layout.tsx:16-17`
- Modify: `src/components/Sidebar.tsx:48-49`
- Modify: `src/components/AuthShell.tsx:21`
- Modify: `src/app/login/page.tsx:49`
- Modify: `src/app/signup/page.tsx:79`
- Modify: `src/app/reset-password/page.tsx:69`
- Modify: `src/app/api/deposits/route.ts:63`
- Modify: `src/app/api/auth/signup/route.ts:106`
- Modify: `src/app/api/auth/login/route.ts:44`
- Modify: `src/app/api/profile/route.ts:85,89`
- Modify: `src/app/api/auth/forgot-password/route.ts:49,53`
- Modify: `src/app/api/tickets/route.ts:58`
- Modify: `package.json`
- Modify: `.env.example`

**Interfaces:**
- Produces: `SESSION_COOKIE_NAME = "primefx_session"` (consumed already by `src/lib/session.ts`, no change needed there — it imports the constant).
- Produces: `getNextMemberId()` now returns IDs like `"PFX10001"` instead of `"WF10001"` — same function signature, no callers need changes.

Note: `src/components/dashboard/DashboardView.tsx`'s "Welcome to Win FX" string and `README.md`'s "Win FX" occurrences are intentionally **not** touched here — Task 14 rewrites `DashboardView.tsx` wholesale with the new copy already in place, and Task 16 rewrites `README.md` wholesale.

- [ ] **Step 1: `src/lib/constants.ts`**

```ts
export const SESSION_COOKIE_NAME = "primefx_session";
```

- [ ] **Step 2: `src/lib/counters.ts`** — change the prefix used in the returned template string

```ts
import { getDb } from "@/lib/mongodb";

const MEMBER_ID_BASE = 10000;

export async function getNextMemberId(): Promise<string> {
  const db = await getDb();
  const result = await db
    .collection<{ _id: string; seq: number }>("counters")
    .findOneAndUpdate(
      { _id: "memberId" },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );

  const seq = result?.seq ?? 1;
  return `PFX${MEMBER_ID_BASE + seq}`;
}
```

- [ ] **Step 3: `src/lib/mongodb.ts:28`** — change the fallback DB name

```ts
  const db = client.db(process.env.MONGODB_DB || "primefx");
```

- [ ] **Step 4: `src/app/layout.tsx:16-17`**

```ts
export const metadata: Metadata = {
  title: "PRIMEFX",
  description: "PRIMEFX member dashboard",
};
```

- [ ] **Step 5: `src/components/Sidebar.tsx:48-49`**

```tsx
          <Image src="/primeLogo.png" alt="PRIMEFX" width={36} height={36} className="rounded-xl" />
          <span className="text-base font-bold tracking-wide text-white">PRIMEFX</span>
```

- [ ] **Step 6: `src/components/AuthShell.tsx:21`**

```tsx
            alt="PRIMEFX"
```

- [ ] **Step 7: `src/app/login/page.tsx:49`**

```tsx
      title="Welcome to PRIMEFX"
```

- [ ] **Step 8: `src/app/signup/page.tsx:79`**

```tsx
      title="Welcome to PRIMEFX"
```

- [ ] **Step 9: `src/app/reset-password/page.tsx:69`**

```tsx
      subtitle="Choose a new password for your PRIMEFX account."
```

- [ ] **Step 10: `src/app/api/deposits/route.ts:63`**

```ts
    "New deposit request — PRIMEFX",
```

- [ ] **Step 11: `src/app/api/auth/signup/route.ts:106`**

```ts
    "New PRIMEFX signup",
```

- [ ] **Step 12: `src/app/api/auth/login/route.ts:44`**

```ts
    "PRIMEFX login",
```

- [ ] **Step 13: `src/app/api/profile/route.ts:85,89`**

```ts
    "Your PRIMEFX profile was updated",
    [
      `Hi ${username},`,
      "",
      "Your PRIMEFX profile was just updated. Here are your current details:",
```

- [ ] **Step 14: `src/app/api/auth/forgot-password/route.ts:49,53`**

```ts
    "Reset your PRIMEFX password",
    [
      `Hi ${user.username},`,
      "",
      "We received a request to reset your PRIMEFX password. Click the link below to choose a new one:",
```

(Keep whatever the surrounding lines already are — only the two quoted strings change; check the file's actual line 51-52 content before editing so the rest of the array is untouched.)

- [ ] **Step 15: `src/app/api/tickets/route.ts:58`**

```ts
    "New support ticket — PRIMEFX",
```

- [ ] **Step 16: `package.json`** — change the `name` field

```json
  "name": "primefx",
```

- [ ] **Step 17: `.env.example`** — change the DB name

```bash
MONGODB_DB=primefx
```

**Manual verification (for the record, not run now):** after this task, `grep -ri "win.?fx" src .env.example package.json` should return zero matches outside `DashboardView.tsx` and `README.md` (handled later), and a fresh signup should produce a `PFX#####` member ID.

---

### Task 2: Plan & rank constants (`src/lib/plans.ts`)

**Files:**
- Create: `src/lib/plans.ts`

**Interfaces:**
- Produces: `STARTUP_PLAN: { min: number; dailyRate: number }`, `STAKING_TIERS: StakingTier[]`, `getStakingTier(id: string): StakingTier | undefined`, `LEADERSHIP_RANKS: LeadershipRank[]`, `rankForTotals(totals: { selfInvestment: number; directBusiness: number; teamBusiness: number }): LeadershipRank | null`.
- Consumes: nothing — pure data module, no imports, safe to use from both server code and client components.

- [ ] **Step 1: write `src/lib/plans.ts`**

```ts
export const STARTUP_PLAN = {
  min: 50,
  dailyRate: 0.005,
} as const;

export type StakingTierId = "starter" | "growth" | "advanced" | "premium" | "elite";

export type StakingTier = {
  id: StakingTierId;
  label: string;
  min: number;
  dailyRate: number;
  durationDays: number;
};

export const STAKING_TIERS: StakingTier[] = [
  { id: "starter", label: "$200 Starter", min: 200, dailyRate: 0.006, durationDays: 100 },
  { id: "growth", label: "$2,000 Growth", min: 2000, dailyRate: 0.007, durationDays: 200 },
  { id: "advanced", label: "$4,000 Advanced", min: 4000, dailyRate: 0.008, durationDays: 300 },
  { id: "premium", label: "$8,000 Premium", min: 8000, dailyRate: 0.009, durationDays: 400 },
  { id: "elite", label: "$15,000 Elite", min: 15000, dailyRate: 0.01, durationDays: 500 },
];

export function getStakingTier(id: string): StakingTier | undefined {
  return STAKING_TIERS.find((t) => t.id === id);
}

export type LeadershipRank = {
  level: number;
  rank: string;
  commissionPct: number;
  selfInvestment: number;
  directBusiness: number;
  teamBusiness: number;
  monthlyReward: number;
};

// Ordered ascending by level — thresholds strictly increase with level, so
// scanning in order and keeping the last match yields the highest qualifying
// rank (see rankForTotals).
export const LEADERSHIP_RANKS: LeadershipRank[] = [
  { level: 1, rank: "Promoter", commissionPct: 20, selfInvestment: 200, directBusiness: 1000, teamBusiness: 2000, monthlyReward: 10 },
  { level: 2, rank: "Performer", commissionPct: 40, selfInvestment: 500, directBusiness: 2500, teamBusiness: 10000, monthlyReward: 50 },
  { level: 3, rank: "Manager", commissionPct: 60, selfInvestment: 1500, directBusiness: 5000, teamBusiness: 100000, monthlyReward: 500 },
  { level: 4, rank: "Director", commissionPct: 80, selfInvestment: 5000, directBusiness: 15000, teamBusiness: 600000, monthlyReward: 2000 },
  { level: 5, rank: "Ambassador", commissionPct: 100, selfInvestment: 10000, directBusiness: 30000, teamBusiness: 2400000, monthlyReward: 10000 },
  { level: 6, rank: "Crown Ambassador", commissionPct: 120, selfInvestment: 25000, directBusiness: 50000, teamBusiness: 10000000, monthlyReward: 30000 },
];

export function rankForTotals(totals: {
  selfInvestment: number;
  directBusiness: number;
  teamBusiness: number;
}): LeadershipRank | null {
  let best: LeadershipRank | null = null;
  for (const rank of LEADERSHIP_RANKS) {
    if (
      totals.selfInvestment >= rank.selfInvestment &&
      totals.directBusiness >= rank.directBusiness &&
      totals.teamBusiness >= rank.teamBusiness
    ) {
      best = rank;
    }
  }
  return best;
}
```

**Manual verification:** `rankForTotals({selfInvestment: 0, directBusiness: 0, teamBusiness: 0})` returns `null`; `rankForTotals({selfInvestment: 30000, directBusiness: 60000, teamBusiness: 20000000})` returns the Crown Ambassador row.

---

### Task 3: Mongo indexes for new collections

**Files:**
- Modify: `src/lib/mongodb.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: unique index on `bonusLedger{positionId,date}` (this is what makes accrual crediting idempotent — Task 6 relies on the duplicate-key error this produces) and unique index on `rewardLedger{memberId,month}` (same idempotency role for monthly rewards).

- [ ] **Step 1: add the new `createIndexes`/`createIndex` calls to the existing `Promise.all` array in `getDb()`**

Insert these entries into the array already being built in `src/lib/mongodb.ts` (alongside the existing `deposits`/`investments`/`tickets`/`withdrawals` index calls):

```ts
      db.collection("stakes").createIndex({ memberId: 1, createdAt: -1 }),
      db.collection("bonusLedger").createIndex({ memberId: 1, date: -1 }),
      db.collection("bonusLedger").createIndex({ positionId: 1, date: 1 }, { unique: true }),
      db.collection("leadershipLedger").createIndex({ beneficiaryMemberId: 1, date: -1 }),
      db.collection("rewardLedger").createIndex({ memberId: 1, month: 1 }, { unique: true }),
```

The full array (for placement reference) becomes:

```ts
    await Promise.all([
      db
        .collection("users")
        .createIndexes([
          { key: { username: 1 }, unique: true },
          { key: { email: 1 }, unique: true },
          { key: { mobile: 1 }, unique: true },
          { key: { memberId: 1 }, unique: true },
        ]),
      db.collection("users").createIndex({ sponsorId: 1 }),
      db.collection("deposits").createIndex({ memberId: 1, createdAt: -1 }),
      db.collection("investments").createIndex({ memberId: 1, createdAt: -1 }),
      db.collection("tickets").createIndex({ memberId: 1, createdAt: -1 }),
      db.collection("withdrawals").createIndex({ memberId: 1, type: 1, createdAt: -1 }),
      db.collection("passwordResets").createIndex({ token: 1 }, { unique: true }),
      db.collection("passwordResets").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection("stakes").createIndex({ memberId: 1, createdAt: -1 }),
      db.collection("bonusLedger").createIndex({ memberId: 1, date: -1 }),
      db.collection("bonusLedger").createIndex({ positionId: 1, date: 1 }, { unique: true }),
      db.collection("leadershipLedger").createIndex({ beneficiaryMemberId: 1, date: -1 }),
      db.collection("rewardLedger").createIndex({ memberId: 1, month: 1 }, { unique: true }),
    ]).catch(() => {
      indexesEnsured = false;
    });
```

**Manual verification:** on first DB connection after this change, `db.stakes.getIndexes()` / `db.bonusLedger.getIndexes()` / `db.rewardLedger.getIndexes()` in `mongosh` show the new indexes.

---

### Task 4: Business totals in `src/lib/team.ts` + `src/lib/team-types.ts`

**Files:**
- Modify: `src/lib/team-types.ts`
- Modify: `src/lib/team.ts`

**Interfaces:**
- Produces: `TeamSummary` gains `directBusiness: number` and `teamBusiness: number`. Produces new exported `getBusinessTotals(memberId: string): Promise<{ selfInvestment: number; directBusiness: number; teamBusiness: number }>`.
- Consumes: nothing new — reuses `getTeamSnapshot` and the existing (unexported) `fetchInvestedTotals`, both already in `team.ts`.
- Behavior change: `fetchInvestedTotals` now sums **both** `investments` and `stakes` collections (previously `investments` only), so a member's `ownInvested`/business totals include staking capital. This is the one intentional behavior change to the existing team-hierarchy feature, per the spec.

- [ ] **Step 1: `src/lib/team-types.ts`** — add two fields to `TeamSummary`

```ts
export type TeamSummary = {
  totalDirect: number;
  activeDirect: number;
  pendingDirect: number;
  totalTeam: number;
  activeTeam: number;
  pendingTeam: number;
  directBusiness: number; // sum of ownInvested across direct[] (level 1 only)
  teamBusiness: number;   // sum of ownInvested across allTeam[] (every level)
};
```

- [ ] **Step 2: `src/lib/team.ts`** — extend `fetchInvestedTotals` to include `stakes`

Replace the existing function body with:

```ts
async function fetchInvestedTotals(db: Db, memberIds: string[]): Promise<Map<string, number>> {
  if (memberIds.length === 0) return new Map();

  // "Invested" now covers both the Startup Plan (`investments`) and staking
  // plans (`stakes`) — both represent capital a member has actually
  // committed, and both should count toward business/rank totals.
  const [investmentTotals, stakeTotals] = await Promise.all([
    db
      .collection("investments")
      .aggregate<{ _id: string; total: number }>([
        { $match: { memberId: { $in: memberIds } } },
        { $group: { _id: "$memberId", total: { $sum: "$amount" } } },
      ])
      .toArray(),
    db
      .collection("stakes")
      .aggregate<{ _id: string; total: number }>([
        { $match: { memberId: { $in: memberIds } } },
        { $group: { _id: "$memberId", total: { $sum: "$amount" } } },
      ])
      .toArray(),
  ]);

  const merged = new Map<string, number>();
  for (const t of investmentTotals) merged.set(t._id, (merged.get(t._id) ?? 0) + t.total);
  for (const t of stakeTotals) merged.set(t._id, (merged.get(t._id) ?? 0) + t.total);
  return merged;
}
```

- [ ] **Step 3: `src/lib/team.ts`** — extend `buildSummary` to compute the two new totals

Replace the existing function body with:

```ts
function buildSummary(direct: RawMember[], allTeam: RawMember[]): TeamSummary {
  const activeDirect = direct.filter((m) => m.status === "Active").length;
  const activeTeam = allTeam.filter((m) => m.status === "Active").length;
  return {
    totalDirect: direct.length,
    activeDirect,
    pendingDirect: direct.length - activeDirect,
    totalTeam: allTeam.length,
    activeTeam,
    pendingTeam: allTeam.length - activeTeam,
    directBusiness: direct.reduce((sum, m) => sum + m.ownInvested, 0),
    teamBusiness: allTeam.reduce((sum, m) => sum + m.ownInvested, 0),
  };
}
```

- [ ] **Step 4: `src/lib/team.ts`** — add the new exported `getBusinessTotals` function (append near the bottom of the file, after `buildSummary`)

```ts
export async function getBusinessTotals(
  memberId: string
): Promise<{ selfInvestment: number; directBusiness: number; teamBusiness: number }> {
  const db = await getDb();
  const [snapshot, selfTotals] = await Promise.all([
    getTeamSnapshot(memberId),
    fetchInvestedTotals(db, [memberId]),
  ]);

  return {
    selfInvestment: selfTotals.get(memberId) ?? 0,
    directBusiness: snapshot.summary.directBusiness,
    teamBusiness: snapshot.summary.teamBusiness,
  };
}
```

**Manual verification:** for an account with no investments/stakes and no downline, `getBusinessTotals(memberId)` resolves to `{selfInvestment: 0, directBusiness: 0, teamBusiness: 0}`. `GET /api/team`'s JSON response now includes `summary.directBusiness` and `summary.teamBusiness`.

---

### Task 5: Shared aggregation helper, `getAvailableFund`, and `investments` schema fields

**Files:**
- Create: `src/lib/aggregate.ts`
- Create: `src/lib/fund.ts`
- Modify: `src/app/api/investments/route.ts`

**Interfaces:**
- Produces: `sumField(db: Db, collection: string, match: Record<string, unknown>, field: string): Promise<number>` (used by both `fund.ts` and Task 6's `accrual.ts`).
- Produces: `getAvailableFund(db: Db, memberId: string): Promise<number>` — now subtracts **both** `investments` and `stakes` totals from approved deposits (previously investments only). Same name/signature as the private function it replaces, so Task 7 (`/api/stakes`) can import it directly.
- Produces: `investments` documents now carry `dailyRate: number` and `status: "Active" | "Withdrawn"` fields, which Task 6's accrual engine reads.

- [ ] **Step 1: write `src/lib/aggregate.ts`**

```ts
import type { Db } from "mongodb";

export async function sumField(
  db: Db,
  collection: string,
  match: Record<string, unknown>,
  field: string
): Promise<number> {
  const result = await db
    .collection(collection)
    .aggregate<{ total: number }>([{ $match: match }, { $group: { _id: null, total: { $sum: `$${field}` } } }])
    .toArray();
  return result[0]?.total ?? 0;
}
```

- [ ] **Step 2: write `src/lib/fund.ts`**

```ts
import type { Db } from "mongodb";
import { sumField } from "@/lib/aggregate";

export async function getAvailableFund(db: Db, memberId: string): Promise<number> {
  const [deposited, invested, staked] = await Promise.all([
    sumField(db, "deposits", { memberId, status: "Approved" }, "amount"),
    sumField(db, "investments", { memberId }, "amount"),
    sumField(db, "stakes", { memberId }, "amount"),
  ]);

  return Math.max(0, Math.round((deposited - invested - staked) * 100) / 100);
}
```

- [ ] **Step 3: `src/app/api/investments/route.ts`** — remove the local `getAvailableFund`/`Db` import, use the shared one, and stamp new positions with `dailyRate`/`status`

Replace the whole file with:

```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { getAvailableFund } from "@/lib/fund";
import { STARTUP_PLAN } from "@/lib/plans";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = await getDb();
  const [investments, availableFund] = await Promise.all([
    db
      .collection("investments")
      .find({ memberId: session.memberId })
      .sort({ createdAt: -1 })
      .toArray(),
    getAvailableFund(db, session.memberId),
  ]);

  return NextResponse.json({
    availableFund,
    investments: investments.map((inv) => ({
      id: inv._id.toString(),
      amount: inv.amount,
      createdAt: inv.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < STARTUP_PLAN.min) {
    return NextResponse.json(
      { error: `Minimum investment package is $${STARTUP_PLAN.min}.` },
      { status: 400 }
    );
  }

  const db = await getDb();
  const availableFund = await getAvailableFund(db, session.memberId);
  if (amount > availableFund) {
    return NextResponse.json(
      { error: "Amount exceeds your available fund balance." },
      { status: 400 }
    );
  }

  const doc = {
    memberId: session.memberId,
    username: session.username,
    amount,
    dailyRate: STARTUP_PLAN.dailyRate,
    status: "Active" as const,
    createdAt: new Date(),
  };
  const result = await db.collection("investments").insertOne(doc);

  return NextResponse.json(
    {
      id: result.insertedId.toString(),
      amount: doc.amount,
      createdAt: doc.createdAt,
    },
    { status: 201 }
  );
}
```

**Manual verification:** a fresh `POST /api/investments` document in MongoDB now has `dailyRate: 0.005` and `status: "Active"`; `getAvailableFund` for a member with a $100 deposit, a $50 investment, and a $30 stake returns `20`.

---

### Task 6: Accrual engine (`src/lib/accrual.ts`)

**Files:**
- Create: `src/lib/accrual.ts`

**Interfaces:**
- Consumes: `sumField` (`@/lib/aggregate`), `rankForTotals`/`LeadershipRank` (`@/lib/plans`), `getBusinessTotals` (`@/lib/team`), `getDb` (`@/lib/mongodb`).
- Produces: `runDailyAccrual(): Promise<void>`, `computeRank(memberId: string): Promise<LeadershipRank | null>`, `getWalletSummary(memberId: string): Promise<WalletSummary>` where

```ts
type WalletSummary = {
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

  These three functions are consumed by: `src/app/page.tsx` (Task 10, `runDailyAccrual`), `src/app/api/cron/accrue/route.ts` (Task 10, `runDailyAccrual`), `src/app/api/income/rewards/route.ts` (Task 8, `computeRank`), `src/app/api/wallet/route.ts` (Task 9, `getWalletSummary`), `src/app/api/withdrawals/route.ts` (Task 11, `getWalletSummary`).

- [ ] **Step 1: write `src/lib/accrual.ts`**

```ts
import type { Db, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { sumField } from "@/lib/aggregate";
import { rankForTotals, type LeadershipRank } from "@/lib/plans";
import { getBusinessTotals } from "@/lib/team";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD" in UTC
}

function isWeekend(dateKey: string): boolean {
  const day = new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
  return day === 0 || day === 6;
}

function monthKey(dateKey: string): string {
  return dateKey.slice(0, 7); // "YYYY-MM"
}

type SystemDoc = { _id: string; lastAccrualDate?: string; lastRewardMonth?: string };

async function getSystemDoc(db: Db): Promise<SystemDoc | null> {
  return db.collection<SystemDoc>("system").findOne({ _id: "accrual" });
}

type ActivePosition = {
  _id: ObjectId;
  memberId: string;
  amount: number;
  dailyRate: number;
  positionType: "investment" | "staking";
  durationDays?: number;
};

async function loadActivePositions(db: Db): Promise<ActivePosition[]> {
  const [investments, stakes] = await Promise.all([
    db.collection("investments").find({ status: "Active" }).toArray(),
    db.collection("stakes").find({ status: "Active" }).toArray(),
  ]);

  return [
    ...investments.map((doc) => ({
      _id: doc._id,
      memberId: doc.memberId as string,
      amount: doc.amount as number,
      dailyRate: doc.dailyRate as number,
      positionType: "investment" as const,
    })),
    ...stakes.map((doc) => ({
      _id: doc._id,
      memberId: doc.memberId as string,
      amount: doc.amount as number,
      dailyRate: doc.dailyRate as number,
      positionType: "staking" as const,
      durationDays: doc.durationDays as number,
    })),
  ];
}

async function creditPosition(
  db: Db,
  position: ActivePosition,
  date: string
): Promise<{ memberId: string; income: number } | null> {
  const income = round2(position.amount * position.dailyRate);

  try {
    await db.collection("bonusLedger").insertOne({
      memberId: position.memberId,
      positionId: position._id,
      positionType: position.positionType,
      principal: position.amount,
      rate: position.dailyRate,
      income,
      durationDays: position.durationDays ?? null,
      date,
      createdAt: new Date(),
    });
  } catch (err: unknown) {
    // Duplicate (positionId, date) — already credited today. Safe no-op;
    // this is the idempotency guard that makes it safe to call this
    // function from every page load, not just a once-a-day cron.
    if (typeof err === "object" && err !== null && "code" in err && err.code === 11000) {
      return null;
    }
    throw err;
  }

  if (position.positionType === "staking") {
    await db.collection("stakes").updateOne({ _id: position._id }, { $inc: { creditedDays: 1 } });
    const stake = await db.collection("stakes").findOne({ _id: position._id });
    if (stake && stake.creditedDays >= stake.durationDays) {
      await db.collection("stakes").updateOne({ _id: position._id }, { $set: { status: "Completed" } });
    }
  }

  return { memberId: position.memberId, income };
}

async function creditLeadershipOverrides(
  db: Db,
  sourceMemberId: string,
  sourceUsername: string,
  positionType: "investment" | "staking",
  refPrincipal: number,
  refIncome: number,
  date: string
): Promise<void> {
  let level = 0;
  let currentMemberId: string | null = sourceMemberId;

  // 50 is a generous depth ceiling so this loop always terminates even if a
  // sponsorId chain were ever corrupted into a cycle; real chains are
  // nowhere near this deep.
  while (level < 50) {
    const current = await db.collection("users").findOne({ memberId: currentMemberId });
    if (!current || !current.sponsorId) break;

    const ancestor = await db.collection("users").findOne({ memberId: current.sponsorId });
    if (!ancestor) break;

    level += 1;
    const rank = await computeRank(ancestor.memberId);

    if (rank && rank.commissionPct > 0) {
      const income = round2((rank.commissionPct / 100) * refIncome);
      await db.collection("leadershipLedger").insertOne({
        beneficiaryMemberId: ancestor.memberId,
        beneficiaryRank: rank.rank,
        commissionPct: rank.commissionPct,
        sourceMemberId,
        sourceUsername,
        level,
        positionType,
        refPrincipal,
        refIncome,
        income,
        date,
        createdAt: new Date(),
      });
    }

    currentMemberId = ancestor.memberId;
  }
}

async function runTradingBonusPhase(db: Db, date: string): Promise<void> {
  const watermark = await getSystemDoc(db);
  if (watermark?.lastAccrualDate === date) return;
  if (isWeekend(date)) return;

  const positions = await loadActivePositions(db);
  const usernameCache = new Map<string, string>();

  for (const position of positions) {
    const credited = await creditPosition(db, position, date);
    if (!credited) continue;

    let username = usernameCache.get(credited.memberId);
    if (!username) {
      const user = await db.collection("users").findOne({ memberId: credited.memberId });
      username = (user?.username as string) ?? credited.memberId;
      usernameCache.set(credited.memberId, username);
    }

    await creditLeadershipOverrides(
      db,
      credited.memberId,
      username,
      position.positionType,
      position.amount,
      credited.income,
      date
    );
  }

  await db
    .collection<SystemDoc>("system")
    .updateOne({ _id: "accrual" }, { $set: { lastAccrualDate: date } }, { upsert: true });
}

async function runMonthlyRewardPhase(db: Db, date: string): Promise<void> {
  const month = monthKey(date);
  const watermark = await getSystemDoc(db);
  if (watermark?.lastRewardMonth === month) return;

  const members = await db.collection("users").find({}, { projection: { memberId: 1 } }).toArray();

  for (const member of members) {
    const totals = await getBusinessTotals(member.memberId);
    const rank = rankForTotals(totals);
    if (!rank) continue;

    try {
      await db.collection("rewardLedger").insertOne({
        memberId: member.memberId,
        rank: rank.rank,
        amount: rank.monthlyReward,
        month,
        createdAt: new Date(),
      });
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "code" in err && err.code === 11000) continue;
      throw err;
    }
  }

  await db
    .collection<SystemDoc>("system")
    .updateOne({ _id: "accrual" }, { $set: { lastRewardMonth: month } }, { upsert: true });
}

export async function runDailyAccrual(): Promise<void> {
  const db = await getDb();
  const date = todayKey();
  await runTradingBonusPhase(db, date);
  await runMonthlyRewardPhase(db, date);
}

export async function computeRank(memberId: string): Promise<LeadershipRank | null> {
  const totals = await getBusinessTotals(memberId);
  return rankForTotals(totals);
}

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

export async function getWalletSummary(memberId: string): Promise<WalletSummary> {
  const db = await getDb();

  const [
    investmentPrincipal,
    stakePrincipal,
    totalStakingBonus,
    totalInvestmentBonus,
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
    sumField(db, "leadershipLedger", { beneficiaryMemberId: memberId }, "income"),
    sumField(db, "rewardLedger", { memberId }, "amount"),
    sumField(db, "withdrawals", { memberId, type: "income", status: { $in: ["Pending", "Approved"] } }, "amount"),
    sumField(db, "withdrawals", { memberId, type: "investment", status: { $in: ["Pending", "Approved"] } }, "amount"),
    computeRank(memberId),
  ]);

  const totalSelfInvestment = round2(investmentPrincipal + stakePrincipal);
  const totalIncome = round2(totalStakingBonus + totalInvestmentBonus + totalLeadership + totalRewards);
  const netIncome = Math.max(0, round2(totalIncome - totalIncomeWithdrawal));
  const dividendsEarned = round2(totalStakingBonus + totalInvestmentBonus);
  const netCapital = Math.max(0, round2(totalSelfInvestment - dividendsEarned - totalCapitalWithdrawal));

  return {
    rank: rank?.rank ?? "No-Rank",
    totalSelfInvestment,
    totalStakingBonus: round2(totalStakingBonus),
    totalInvestmentBonus: round2(totalInvestmentBonus),
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

**Manual verification:** with one `Active` investment of $100 (`dailyRate: 0.005`) and `system.lastAccrualDate` unset, calling `runDailyAccrual()` on a weekday inserts one `bonusLedger` row with `income: 0.5`; calling it again the same day inserts nothing new (idempotent). If that member's sponsor already qualifies for a rank, exactly one `leadershipLedger` row appears for the sponsor with `income = commissionPct/100 * 0.5`.

---

### Task 7: Stakes API (`src/app/api/stakes/route.ts`)

**Files:**
- Create: `src/app/api/stakes/route.ts`

**Interfaces:**
- Consumes: `getAvailableFund` (`@/lib/fund`), `getStakingTier` (`@/lib/plans`).
- Produces: `POST /api/stakes` (body `{tierId: string, amount: number}` → `201 {id, tierId, amount, dailyRate, durationDays, creditedDays, status, createdAt}`), `GET /api/stakes` (→ `200 {stakes: [...]}`) — consumed by Task 12 (`StakingId.tsx`) and Task 13 (`StakingReport.tsx`).

- [ ] **Step 1: write `src/app/api/stakes/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { getAvailableFund } from "@/lib/fund";
import { getStakingTier } from "@/lib/plans";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = await getDb();
  const stakes = await db
    .collection("stakes")
    .find({ memberId: session.memberId })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    stakes: stakes.map((s) => ({
      id: s._id.toString(),
      tierId: s.tierId,
      amount: s.amount,
      dailyRate: s.dailyRate,
      durationDays: s.durationDays,
      creditedDays: s.creditedDays,
      status: s.status,
      createdAt: s.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const tier = getStakingTier(typeof body.tierId === "string" ? body.tierId : "");
  if (!tier) {
    return NextResponse.json({ error: "Select a valid staking plan." }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < tier.min) {
    return NextResponse.json(
      { error: `Minimum stake for ${tier.label} is $${tier.min}.` },
      { status: 400 }
    );
  }

  const db = await getDb();
  const availableFund = await getAvailableFund(db, session.memberId);
  if (amount > availableFund) {
    return NextResponse.json(
      { error: "Amount exceeds your available fund balance." },
      { status: 400 }
    );
  }

  const doc = {
    memberId: session.memberId,
    username: session.username,
    amount,
    tierId: tier.id,
    dailyRate: tier.dailyRate,
    durationDays: tier.durationDays,
    startDate: new Date(),
    creditedDays: 0,
    status: "Active" as const,
    createdAt: new Date(),
  };
  const result = await db.collection("stakes").insertOne(doc);

  return NextResponse.json(
    {
      id: result.insertedId.toString(),
      tierId: doc.tierId,
      amount: doc.amount,
      dailyRate: doc.dailyRate,
      durationDays: doc.durationDays,
      creditedDays: doc.creditedDays,
      status: doc.status,
      createdAt: doc.createdAt,
    },
    { status: 201 }
  );
}
```

**Manual verification:** `POST /api/stakes {tierId:"starter", amount: 150}` → `400` ("Minimum stake for $200 Starter is $200."). `POST /api/stakes {tierId:"starter", amount: 200}` when available fund is $0 → `400` ("Amount exceeds..."). With sufficient fund, → `201` with `status: "Active", creditedDays: 0`.

---

### Task 8: Income read APIs

**Files:**
- Create: `src/app/api/income/staking/route.ts`
- Create: `src/app/api/income/investment/route.ts`
- Create: `src/app/api/income/all/route.ts`
- Create: `src/app/api/income/leadership/route.ts`
- Create: `src/app/api/income/rewards/route.ts`

**Interfaces:**
- Consumes: `computeRank` (`@/lib/accrual`), `LEADERSHIP_RANKS` (`@/lib/plans`).
- Produces: five `GET`-only routes consumed by Task 13's components (`IncomeStakingBonus`, `IncomeInvBonus`, `IncomeAllBonus`, `IncomeLeadership`, `IncomeMonthlyReward`).

- [ ] **Step 1: `src/app/api/income/staking/route.ts`**

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
    .find({ memberId: session.memberId, positionType: "staking" })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e._id.toString(),
      principal: e.principal,
      rate: e.rate,
      durationDays: e.durationDays ?? null,
      income: e.income,
      date: e.date,
    })),
  });
}
```

- [ ] **Step 2: `src/app/api/income/investment/route.ts`**

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
    .find({ memberId: session.memberId, positionType: "investment" })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e._id.toString(),
      principal: e.principal,
      income: e.income,
      date: e.date,
    })),
  });
}
```

- [ ] **Step 3: `src/app/api/income/all/route.ts`**

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
    .find({ memberId: session.memberId })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e._id.toString(),
      principal: e.principal,
      positionType: e.positionType,
      income: e.income,
      date: e.date,
    })),
  });
}
```

- [ ] **Step 4: `src/app/api/income/leadership/route.ts`**

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
    .collection("leadershipLedger")
    .find({ beneficiaryMemberId: session.memberId })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e._id.toString(),
      beneficiaryRank: e.beneficiaryRank,
      sourceMemberId: e.sourceMemberId,
      sourceUsername: e.sourceUsername,
      level: e.level,
      refPrincipal: e.refPrincipal,
      refIncome: e.refIncome,
      positionType: e.positionType,
      income: e.income,
      date: e.date,
    })),
  });
}
```

- [ ] **Step 5: `src/app/api/income/rewards/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { LEADERSHIP_RANKS } from "@/lib/plans";
import { computeRank } from "@/lib/accrual";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const currentRank = await computeRank(session.memberId);
  const currentLevel = currentRank?.level ?? 0;

  return NextResponse.json({
    ranks: LEADERSHIP_RANKS.map((r) => ({
      level: r.level,
      rank: r.rank,
      commissionPct: r.commissionPct,
      selfInvestment: r.selfInvestment,
      directBusiness: r.directBusiness,
      teamBusiness: r.teamBusiness,
      monthlyReward: r.monthlyReward,
      status: r.level <= currentLevel ? "Achieved" : "Pending",
    })),
  });
}
```

**Manual verification:** each route returns `401` when logged out; after Task 6's accrual has run at least once, `/api/income/staking` and `/api/income/investment` show rows summing correctly into `/api/income/all`; `/api/income/rewards` always returns exactly 6 rows regardless of the member's rank.

---

### Task 9: Wallet summary API + wallet address API

**Files:**
- Create: `src/app/api/wallet/route.ts`
- Create: `src/app/api/wallet-address/route.ts`

**Interfaces:**
- Consumes: `getWalletSummary` (`@/lib/accrual`), `getAvailableFund` (`@/lib/fund`).
- Produces: `GET /api/wallet` → `200 {...WalletSummary, availableFund}` — consumed by Task 14 (`DashboardView`, `Withdraw`, `InvestmentWithdraw`). `GET`/`POST /api/wallet-address` — consumed by Task 15 (`WalletAddress.tsx`).

- [ ] **Step 1: `src/app/api/wallet/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getWalletSummary } from "@/lib/accrual";
import { getDb } from "@/lib/mongodb";
import { getAvailableFund } from "@/lib/fund";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = await getDb();
  const [summary, availableFund] = await Promise.all([
    getWalletSummary(session.memberId),
    getAvailableFund(db, session.memberId),
  ]);

  return NextResponse.json({ ...summary, availableFund });
}
```

- [ ] **Step 2: `src/app/api/wallet-address/route.ts`**

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
  const user = await db
    .collection("users")
    .findOne({ memberId: session.memberId }, { projection: { walletAddress: 1 } });

  return NextResponse.json({ walletAddress: user?.walletAddress ?? "" });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const walletAddress = typeof body.walletAddress === "string" ? body.walletAddress.trim() : "";
  if (!walletAddress) {
    return NextResponse.json({ error: "Enter a wallet address." }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("users").updateOne({ memberId: session.memberId }, { $set: { walletAddress } });

  return NextResponse.json({ walletAddress });
}
```

**Manual verification:** `GET /api/wallet` for a brand-new account returns all-zero numeric fields and `rank: "No-Rank"`. `POST /api/wallet-address {walletAddress: "0xabc"}` then `GET /api/wallet-address` round-trips `{walletAddress: "0xabc"}`.

---

### Task 10: Cron route + lazy accrual trigger

**Files:**
- Create: `src/app/api/cron/accrue/route.ts`
- Modify: `src/app/page.tsx`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `runDailyAccrual` (`@/lib/accrual`).
- Produces: `GET /api/cron/accrue` (optional external scheduler hook); every authenticated dashboard page load now triggers `runDailyAccrual()` server-side before rendering.

- [ ] **Step 1: `src/app/api/cron/accrue/route.ts`**

```ts
import { NextResponse } from "next/server";
import { runDailyAccrual } from "@/lib/accrual";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  await runDailyAccrual();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: `src/app/page.tsx`** — replace the whole file

```tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { HomeShell } from "@/components/HomeShell";
import { runDailyAccrual } from "@/lib/accrual";

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  await runDailyAccrual();

  return <HomeShell username={session.username} memberId={session.memberId} />;
}
```

- [ ] **Step 3: `.env.example`** — document the optional cron secret

Add this line (with a blank line before it, after the existing `SMTP_APP_PASSWORD` line):

```bash

# Optional — if set, GET /api/cron/accrue requires header `x-cron-secret` to match.
# Leave blank during local development; the app still accrues correctly via
# the lazy trigger in src/app/page.tsx with no cron configured at all.
CRON_SECRET=
```

**Manual verification:** loading `/` on a weekday with `system.lastAccrualDate` unset produces `bonusLedger` rows for every `Active` position; loading `/` again immediately after does nothing (no duplicate rows, no error). `GET /api/cron/accrue` with no `CRON_SECRET` set in the environment runs unguarded and returns `{ok: true}`.

---

### Task 11: Harden `POST /api/withdrawals` — flat 5% both types, server-side balance check

**Files:**
- Modify: `src/app/api/withdrawals/route.ts`

**Interfaces:**
- Consumes: `getWalletSummary` (`@/lib/accrual`).
- Behavior change: admin charge is now a flat 5% for **both** `"income"` and `"investment"` withdrawal types (previously 0% for `"investment"`); the $10 minimum now applies to **both** types (previously income-only); the requested `amount` is now validated server-side against `getWalletSummary(memberId).netIncome` / `.netCapital` (previously unvalidated).

- [ ] **Step 1: replace `src/app/api/withdrawals/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { getWalletSummary } from "@/lib/accrual";

type WithdrawalType = "income" | "investment";

function parseType(value: string | null): WithdrawalType | null {
  return value === "income" || value === "investment" ? value : null;
}

const MIN_WITHDRAWAL = 10;
const ADMIN_CHARGE_RATE = 0.05;

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const type = parseType(new URL(req.url).searchParams.get("type"));
  if (!type) {
    return NextResponse.json({ error: "Missing or invalid type query parameter." }, { status: 400 });
  }

  const db = await getDb();
  const withdrawals = await db
    .collection("withdrawals")
    .find({ memberId: session.memberId, type })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    withdrawals: withdrawals.map((w) => ({
      id: w._id.toString(),
      amount: w.amount,
      adminCharge: w.adminCharge,
      netAmount: w.netAmount,
      status: w.status,
      createdAt: w.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const type = parseType(typeof body.type === "string" ? body.type : null);
  if (!type) {
    return NextResponse.json({ error: "Invalid withdrawal type." }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid withdrawal amount." }, { status: 400 });
  }
  if (amount < MIN_WITHDRAWAL) {
    return NextResponse.json({ error: `Minimum withdrawal is $${MIN_WITHDRAWAL}.` }, { status: 400 });
  }

  const summary = await getWalletSummary(session.memberId);
  const balance = type === "income" ? summary.netIncome : summary.netCapital;
  if (amount > balance) {
    return NextResponse.json({ error: "Amount exceeds your available balance." }, { status: 400 });
  }

  const adminCharge = Math.round(amount * ADMIN_CHARGE_RATE * 100) / 100;
  const netAmount = Math.round((amount - adminCharge) * 100) / 100;

  const db = await getDb();
  const doc = {
    memberId: session.memberId,
    username: session.username,
    type,
    amount,
    adminCharge,
    netAmount,
    status: "Pending",
    createdAt: new Date(),
  };
  const result = await db.collection("withdrawals").insertOne(doc);

  return NextResponse.json(
    {
      id: result.insertedId.toString(),
      amount: doc.amount,
      adminCharge: doc.adminCharge,
      netAmount: doc.netAmount,
      status: doc.status,
      createdAt: doc.createdAt,
    },
    { status: 201 }
  );
}
```

**Manual verification:** `POST {type:"investment", amount: 100}` when `netCapital` is $0 → `400`. With `netCapital >= 100`, → `201` with `adminCharge: 5, netAmount: 95` (previously would have been `adminCharge: 0`).

---

### Task 12: `StakingId.tsx` — real tiers, live fund, real submit

**Files:**
- Modify: `src/components/dashboard/StakingId.tsx`

**Interfaces:**
- Consumes: `STAKING_TIERS` (`@/lib/plans`), `GET /api/investments` (for the live fund figure — same endpoint `InvestmentId.tsx` already uses), `POST /api/stakes` (Task 7).

- [ ] **Step 1: replace `src/components/dashboard/StakingId.tsx`**

```tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { STAKING_TIERS } from "@/lib/plans";

export function StakingId({ memberId }: { memberId: string }) {
  const [availableFund, setAvailableFund] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/investments")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.error) setAvailableFund(data.availableFund ?? 0);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const tierId = String(formData.get("tierId") ?? "");
    const amount = Number(formData.get("stakingAmount"));

    setSubmitting(true);
    try {
      const res = await fetch("/api/stakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId, amount }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to submit staking request.");
        return;
      }

      setSaved(true);
      form.reset();
      setAvailableFund((prev) => (prev ?? 0) - amount);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Staking ID" subtitle="Lock funds into a staking plan for a fixed term." />

      <div className="max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label className="field-label">User Id</label>
            <input value={memberId} disabled className="field-input" />
          </div>
          <div>
            <label className="field-label">Fund</label>
            <input
              value={availableFund === null ? "Loading…" : `$${availableFund.toFixed(2)}`}
              disabled
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Member ID</label>
            <input value={memberId} disabled className="field-input" />
          </div>
          <div>
            <label className="field-label" htmlFor="tierId">
              Staking Plan
            </label>
            <select id="tierId" name="tierId" className="field-input" required defaultValue="">
              <option value="" disabled>
                Select Plan
              </option>
              {STAKING_TIERS.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.label} — {(tier.dailyRate * 100).toFixed(1)}%/day, {tier.durationDays} days
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="stakingAmount">
              Staking Amount
            </label>
            <input
              id="stakingAmount"
              name="stakingAmount"
              type="number"
              min={200}
              step="1"
              placeholder="Enter Staking Amount (must meet the selected plan's minimum)"
              className="field-input"
              required
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button type="submit" className="btn-solid disabled:opacity-70" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <button type="reset" className="btn-outline" disabled={submitting}>
              Reset
            </button>
            {saved && <span className="text-sm font-medium text-emerald-600">Staking plan created.</span>}
          </div>
          {error && <p className="text-sm font-medium text-red-500 sm:col-span-2">{error}</p>}
        </form>
      </div>
    </div>
  );
}
```

**Manual verification:** the dropdown lists exactly the 5 real tiers with correct rate/duration text; submitting below the selected tier's minimum shows the server's error message inline.

---

### Task 13: Wire the income/report components to real data

**Files:**
- Modify: `src/components/dashboard/StakingReport.tsx`
- Modify: `src/components/dashboard/IncomeStakingBonus.tsx`
- Modify: `src/components/dashboard/IncomeInvBonus.tsx`
- Modify: `src/components/dashboard/IncomeAllBonus.tsx`
- Modify: `src/components/dashboard/IncomeLeadership.tsx`
- Modify: `src/components/dashboard/IncomeMonthlyReward.tsx`
- Modify: `src/components/HomeShell.tsx`

**Interfaces:**
- Consumes: `GET /api/stakes`, `GET /api/income/staking`, `GET /api/income/investment`, `GET /api/income/all`, `GET /api/income/leadership`, `GET /api/income/rewards` (all Task 7/8).

- [ ] **Step 1: replace `src/components/dashboard/StakingReport.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type Stake = {
  id: string;
  amount: number;
  durationDays: number;
  creditedDays: number;
  status: string;
  createdAt: string;
};

export function StakingReport({ memberId }: { memberId: string }) {
  const [stakes, setStakes] = useState<Stake[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/stakes")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setStakes(data.stakes ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load your staking report.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    stakes?.map((s, i) => ({
      "#": i + 1,
      id: memberId,
      staking: `$${s.amount.toFixed(2)}`,
      days: `${s.creditedDays}/${s.durationDays}`,
      date: new Date(s.createdAt).toLocaleDateString(),
      status: <StatusBadge status={s.status} />,
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Staking Report" subtitle="Every staking plan you have active or completed." />

      {stakes === null && !error ? (
        <TableSkeleton columns={6} rows={2} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "id", label: "Member Id" },
            { key: "staking", label: "Staking" },
            { key: "days", label: "Days" },
            { key: "date", label: "Date" },
            { key: "status", label: "Status" },
          ]}
          rows={rows}
          emptyMessage="You haven't staked into a plan yet."
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: replace `src/components/dashboard/IncomeStakingBonus.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type BonusEntry = {
  id: string;
  principal: number;
  durationDays: number | null;
  income: number;
  date: string;
};

export function IncomeStakingBonus({ memberId }: { memberId: string }) {
  const [entries, setEntries] = useState<BonusEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/income/staking")
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
        if (!cancelled) setError("Unable to load your staking bonus history.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    entries?.map((e, i) => ({
      "#": i + 1,
      id: memberId,
      staking: `$${e.principal.toFixed(2)}`,
      days: e.durationDays ?? "—",
      level: 1,
      income: `$${e.income.toFixed(2)}`,
      date: new Date(e.date).toLocaleDateString(),
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Staking Trading Bonus" subtitle="Daily trading bonus earned on your staked funds." />

      {entries === null && !error ? (
        <TableSkeleton columns={7} rows={2} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "id", label: "Member ID" },
            { key: "staking", label: "Staking" },
            { key: "days", label: "Days" },
            { key: "level", label: "Level" },
            { key: "income", label: "Income" },
            { key: "date", label: "Date" },
          ]}
          rows={rows}
          emptyMessage="No staking bonus earned yet."
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: replace `src/components/dashboard/IncomeInvBonus.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type BonusEntry = {
  id: string;
  principal: number;
  income: number;
  date: string;
};

export function IncomeInvBonus({ memberId }: { memberId: string }) {
  const [entries, setEntries] = useState<BonusEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/income/investment")
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
        if (!cancelled) setError("Unable to load your investment bonus history.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    entries?.map((e, i) => ({
      "#": i + 1,
      id: memberId,
      package: `$${e.principal.toFixed(2)}`,
      income: `$${e.income.toFixed(2)}`,
      date: new Date(e.date).toLocaleDateString(),
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Investment Trading Bonus" subtitle="Daily trading bonus earned on your investment package." />

      {entries === null && !error ? (
        <TableSkeleton columns={5} rows={2} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "id", label: "Member ID" },
            { key: "package", label: "Package" },
            { key: "income", label: "Income" },
            { key: "date", label: "Date" },
          ]}
          rows={rows}
          emptyMessage="No investment bonus earned yet."
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: replace `src/components/dashboard/IncomeAllBonus.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type BonusEntry = {
  id: string;
  principal: number;
  positionType: "investment" | "staking";
  income: number;
  date: string;
};

export function IncomeAllBonus({ memberId }: { memberId: string }) {
  const [entries, setEntries] = useState<BonusEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/income/all")
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
        if (!cancelled) setError("Unable to load your combined bonus history.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    entries?.map((e, i) => ({
      "#": i + 1,
      id: memberId,
      investment: `$${e.principal.toFixed(2)}`,
      level: 1,
      income: `$${e.income.toFixed(2)}`,
      type: e.positionType === "staking" ? "Staking" : "Investment",
      date: new Date(e.date).toLocaleDateString(),
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="All Investment & Staking Bonus" subtitle="Combined trading bonus from every source." />

      {entries === null && !error ? (
        <TableSkeleton columns={7} rows={3} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "id", label: "Member ID" },
            { key: "investment", label: "Investment" },
            { key: "level", label: "Level" },
            { key: "income", label: "Income" },
            { key: "type", label: "Type" },
            { key: "date", label: "Date" },
          ]}
          rows={rows}
          emptyMessage="No bonus earned yet."
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: replace `src/components/dashboard/IncomeLeadership.tsx`** — this file gains a `memberId` prop (previously took none)

```tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type LeadershipEntry = {
  id: string;
  beneficiaryRank: string;
  sourceMemberId: string;
  sourceUsername: string;
  level: number;
  refPrincipal: number;
  refIncome: number;
  positionType: "investment" | "staking";
  income: number;
  date: string;
};

export function IncomeLeadership({ memberId }: { memberId: string }) {
  const [entries, setEntries] = useState<LeadershipEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/income/leadership")
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
        if (!cancelled) setError("Unable to load your leadership bonus history.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    entries?.map((e, i) => ({
      "#": i + 1,
      id: memberId,
      rank: e.beneficiaryRank,
      refId: e.sourceMemberId,
      refName: e.sourceUsername,
      level: e.level,
      refInv: `$${e.refPrincipal.toFixed(2)}`,
      refRoi: `$${e.refIncome.toFixed(2)}`,
      type: e.positionType === "staking" ? "Staking" : "Investment",
      income: `$${e.income.toFixed(2)}`,
      date: new Date(e.date).toLocaleDateString(),
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Leadership Bonus" subtitle="Rank-based bonus earned from your team's investments." />

      {entries === null && !error ? (
        <TableSkeleton columns={11} rows={2} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "id", label: "Member Id" },
            { key: "rank", label: "My Rank" },
            { key: "refId", label: "Ref. ID" },
            { key: "refName", label: "Ref. Name" },
            { key: "level", label: "Level" },
            { key: "refInv", label: "Ref. Inv." },
            { key: "refRoi", label: "Ref. ROI" },
            { key: "type", label: "Type" },
            { key: "income", label: "Income" },
            { key: "date", label: "Date" },
          ]}
          rows={rows}
          emptyMessage="No leadership bonus earned yet — reach a ranked position to unlock this."
        />
      )}
    </div>
  );
}
```

- [ ] **Step 6: replace `src/components/dashboard/IncomeMonthlyReward.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type RankRow = {
  level: number;
  rank: string;
  commissionPct: number;
  selfInvestment: number;
  directBusiness: number;
  teamBusiness: number;
  monthlyReward: number;
  status: "Achieved" | "Pending";
};

export function IncomeMonthlyReward() {
  const [ranks, setRanks] = useState<RankRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/income/rewards")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setRanks(data.ranks ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load leadership rank data.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    ranks?.map((r) => ({
      level: r.level,
      rank: r.rank,
      cmsn: `${r.commissionPct}%`,
      selfInv: `$${r.selfInvestment.toLocaleString()}`,
      direct: `$${r.directBusiness.toLocaleString()}`,
      team: `$${r.teamBusiness.toLocaleString()}`,
      reward: `$${r.monthlyReward.toLocaleString()}`,
      status: <StatusBadge status={r.status} />,
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Monthly / Reward Bonus" subtitle="Leadership ranks and the qualification targets for each." />

      {ranks === null && !error ? (
        <TableSkeleton columns={8} rows={6} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "level", label: "Level" },
            { key: "rank", label: "Leadership Rank" },
            { key: "cmsn", label: "C.MSN" },
            { key: "selfInv", label: "Self Investment" },
            { key: "direct", label: "Direct Business" },
            { key: "team", label: "Team Business" },
            { key: "reward", label: "Monthly Reward" },
            { key: "status", label: "Status" },
          ]}
          rows={rows}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 7: `src/components/HomeShell.tsx`** — pass `memberId` into `IncomeLeadership` now that it takes the prop

Find this line:

```tsx
    "income-leadership": <IncomeLeadership />,
```

Replace with:

```tsx
    "income-leadership": <IncomeLeadership memberId={memberId} />,
```

**Manual verification:** every one of these six pages shows a loading skeleton, then either real rows (after Task 6's accrual has run) or the correct empty-state message — no page shows the old hardcoded demo numbers anymore.

---

### Task 14: Wire `DashboardView`, `Withdraw`, `InvestmentWithdraw` to `/api/wallet`

**Files:**
- Modify: `src/components/dashboard/DashboardView.tsx`
- Modify: `src/components/dashboard/Withdraw.tsx`
- Modify: `src/components/dashboard/InvestmentWithdraw.tsx`

**Interfaces:**
- Consumes: `GET /api/wallet` (Task 9), `GET /api/team` (existing, now also returns `summary.directBusiness`/`summary.teamBusiness` per Task 4).

- [ ] **Step 1: replace `src/components/dashboard/DashboardView.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { InfoCard } from "@/components/dashboard/shared/InfoCard";
import { TradingViewWidget } from "@/components/dashboard/shared/TradingViewWidget";
import type { TeamSummary } from "@/lib/team-types";
import {
  TreeIcon,
  LayersIcon,
  TrendingUpIcon,
  ReportIcon,
  ShieldIcon,
  DepositIcon,
  WithdrawIcon,
  IdIcon,
  TicketIcon,
  GridIcon,
} from "@/components/icons";

type WalletSummary = {
  rank: string;
  totalSelfInvestment: number;
  totalStakingBonus: number;
  totalInvestmentBonus: number;
  totalLeadership: number;
  totalRewards: number;
  totalIncome: number;
  totalIncomeWithdrawal: number;
  netIncome: number;
  availableFund: number;
};

const TICKER_SYMBOLS = [
  { proName: "FOREXCOM:SPXUSD", title: "S&P 500 Index" },
  { proName: "FX_IDC:EURUSD", title: "EUR to USD" },
  { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
  { proName: "BITSTAMP:ETHUSD", title: "Ethereum" },
];

const EMPTY_SUMMARY: TeamSummary = {
  totalDirect: 0,
  activeDirect: 0,
  pendingDirect: 0,
  totalTeam: 0,
  activeTeam: 0,
  pendingTeam: 0,
  directBusiness: 0,
  teamBusiness: 0,
};

const EMPTY_WALLET: WalletSummary = {
  rank: "No-Rank",
  totalSelfInvestment: 0,
  totalStakingBonus: 0,
  totalInvestmentBonus: 0,
  totalLeadership: 0,
  totalRewards: 0,
  totalIncome: 0,
  totalIncomeWithdrawal: 0,
  netIncome: 0,
  availableFund: 0,
};

export function DashboardView({ memberId }: { memberId: string }) {
  const [summary, setSummary] = useState<TeamSummary>(EMPTY_SUMMARY);
  const [wallet, setWallet] = useState<WalletSummary>(EMPTY_WALLET);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || data.error) return;
        setSummary(data.summary ?? EMPTY_SUMMARY);
      })
      .catch(() => {});

    fetch("/api/wallet")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || data.error) return;
        setWallet(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    { label: "Direct Team Business", value: `$${summary.directBusiness.toFixed(2)}`, icon: TreeIcon },
    { label: "Total Team Business", value: `$${summary.teamBusiness.toFixed(2)}`, icon: LayersIcon },
    { label: "Staking Trading Bonus", value: `$${wallet.totalStakingBonus.toFixed(2)}`, icon: TrendingUpIcon },
    { label: "Investment Trading Bonus", value: `$${wallet.totalInvestmentBonus.toFixed(2)}`, icon: ReportIcon },
    { label: "Leadership Bonus", value: `$${wallet.totalLeadership.toFixed(2)}`, icon: ShieldIcon },
    { label: "Total Income", value: `$${wallet.totalIncome.toFixed(2)}`, icon: DepositIcon },
    { label: "Total Withdrawal", value: `$${wallet.totalIncomeWithdrawal.toFixed(2)}`, icon: WithdrawIcon },
    { label: "Net Income", value: `$${wallet.netIncome.toFixed(2)}`, icon: IdIcon },
    { label: "Reward Bonus", value: `$${wallet.totalRewards.toFixed(2)}`, icon: TicketIcon },
    { label: "Fund Wallet", value: `$${wallet.availableFund.toFixed(2)}`, icon: GridIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1f2430]">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back — here&apos;s a snapshot of your account today.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-brand-purple to-brand-purple-light px-6 py-4 text-center shadow-sm">
        <span className="mb-1 inline-block rounded-full bg-white/15 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
          Notification
        </span>
        <p className="text-sm font-bold text-white">
          Welcome to PRIMEFX — your dashboard is up to date.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-brand-ink p-2 shadow-sm">
        <TradingViewWidget
          scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
          config={{
            symbols: TICKER_SYMBOLS,
            isTransparent: true,
            displayMode: "adaptive",
            colorTheme: "dark",
            locale: "en",
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <InfoCard
          title="Account Information"
          rows={[
            { label: "User ID", value: memberId },
            { label: "Rank", value: wallet.rank },
            { label: "Total Self Investment", value: `$${wallet.totalSelfInvestment.toFixed(2)}` },
            { label: "Total Income", value: `$${wallet.totalIncome.toFixed(2)}` },
            { label: "Total Withdrawal", value: `$${wallet.totalIncomeWithdrawal.toFixed(2)}` },
            { label: "Net Income", value: `$${wallet.netIncome.toFixed(2)}`, valueClassName: "text-emerald-600" },
          ]}
        />
        <InfoCard
          title="Team Information"
          rows={[
            { label: "User ID", value: memberId },
            { label: "Total Direct", value: summary.totalDirect },
            { label: "Active Direct", value: summary.activeDirect },
            { label: "Pending Direct", value: summary.pendingDirect },
            { label: "Total Team", value: summary.totalTeam },
            { label: "Active Team", value: summary.activeTeam },
            { label: "Pending Team", value: summary.pendingTeam },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-xl font-bold text-[#1f2430]">{stat.value}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-purple-light text-white">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Thailand Tour Status
            </p>
            <span className="mt-2 inline-block rounded-full bg-brand-gold/15 px-3 py-1 text-xs font-semibold text-brand-gold">
              Pending
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
        <TradingViewWidget
          scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js"
          config={{
            width: "100%",
            height: 400,
            currencies: ["EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD"],
            isTransparent: true,
            colorTheme: "light",
            locale: "en",
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: replace `src/components/dashboard/Withdraw.tsx`**

```tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { InfoCard } from "@/components/dashboard/shared/InfoCard";

const MIN_WITHDRAWAL = 10;

type WalletSummary = {
  totalIncome: number;
  totalIncomeWithdrawal: number;
  netIncome: number;
};

const EMPTY_WALLET: WalletSummary = { totalIncome: 0, totalIncomeWithdrawal: 0, netIncome: 0 };

export function Withdraw() {
  const [wallet, setWallet] = useState<WalletSummary>(EMPTY_WALLET);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function loadWallet() {
    fetch("/api/wallet")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setWallet(data);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadWallet();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const amount = Number(new FormData(form).get("amount"));

    if (amount < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is $${MIN_WITHDRAWAL}.`);
      return;
    }
    if (amount > wallet.netIncome) {
      setError("Amount exceeds your available net income.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "income", amount }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to submit withdrawal request.");
        return;
      }

      setSubmitted(true);
      form.reset();
      loadWallet();
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Withdraw" subtitle="Request a payout of your available trading income." />

      <div className="max-w-md">
        <InfoCard
          rows={[
            { label: "Total Income", value: `$${wallet.totalIncome.toFixed(2)}` },
            { label: "Total Withdrawal", value: `$${wallet.totalIncomeWithdrawal.toFixed(2)}` },
            { label: "Net Income", value: `$${wallet.netIncome.toFixed(2)}`, valueClassName: "text-emerald-600" },
          ]}
          footer={
            <p className="text-xs text-gray-400">
              Minimum withdrawal ${MIN_WITHDRAWAL}, 5% admin charge applies
            </p>
          }
        />
      </div>

      <div className="max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="field-label" htmlFor="withdrawAmount">
              Withdrawal Amount
            </label>
            <input
              id="withdrawAmount"
              name="amount"
              type="number"
              min={MIN_WITHDRAWAL}
              step="0.01"
              placeholder={`Minimum $${MIN_WITHDRAWAL}`}
              className="field-input"
              required
            />
          </div>
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          {submitted && <p className="text-sm font-medium text-emerald-600">Request submitted — pending admin review.</p>}
          <button type="submit" className="btn-solid disabled:opacity-70" disabled={submitting}>
            {submitting ? "Submitting..." : "Request Withdrawal"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: replace `src/components/dashboard/InvestmentWithdraw.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { InfoCard } from "@/components/dashboard/shared/InfoCard";

type WalletSummary = {
  totalSelfInvestment: number;
  totalCapitalWithdrawal: number;
  netCapital: number;
};

const EMPTY_WALLET: WalletSummary = { totalSelfInvestment: 0, totalCapitalWithdrawal: 0, netCapital: 0 };

export function InvestmentWithdraw() {
  const [wallet, setWallet] = useState<WalletSummary>(EMPTY_WALLET);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function loadWallet() {
    fetch("/api/wallet")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setWallet(data);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadWallet();
  }, []);

  async function claimWallet() {
    setError(null);

    if (wallet.netCapital <= 0) {
      setError("You have no capital available to withdraw right now.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "investment", amount: wallet.netCapital }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to claim wallet.");
        return;
      }

      setClaimed(true);
      loadWallet();
      setTimeout(() => setClaimed(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Investment Withdrawal Request" subtitle="Claim funds sitting in your investment wallet." />

      <div className="max-w-md">
        <InfoCard
          rows={[
            { label: "Total Wallet", value: `$${wallet.totalSelfInvestment.toFixed(2)}` },
            { label: "Total Withdrawal Income", value: `$${wallet.totalCapitalWithdrawal.toFixed(2)}` },
            { label: "Net Wallet Income", value: `$${wallet.netCapital.toFixed(2)}`, valueClassName: "text-emerald-600" },
          ]}
          footer={
            <div className="flex items-center gap-3">
              <button type="button" onClick={claimWallet} className="btn-solid disabled:opacity-70" disabled={submitting}>
                {submitting ? "Claiming..." : "Claim Wallet"}
              </button>
              {claimed && <span className="text-sm font-medium text-emerald-600">Claim submitted — pending admin review.</span>}
              {error && <span className="text-sm font-medium text-red-500">{error}</span>}
            </div>
          }
        />
      </div>
    </div>
  );
}
```

**Manual verification:** dashboard stat tiles show `$0.00` (not blank/NaN) for a brand-new account; after Task 6's accrual runs, they update to real numbers. `Withdraw`/`InvestmentWithdraw`'s "Claim"/"Request" buttons are rejected client-side (and would also be rejected server-side per Task 11) when the wallet balance is $0.

---

### Task 15: Real `WalletAddress.tsx`

**Files:**
- Modify: `src/components/dashboard/WalletAddress.tsx`

**Interfaces:**
- Consumes: `GET`/`POST /api/wallet-address` (Task 9).

- [ ] **Step 1: replace `src/components/dashboard/WalletAddress.tsx`**

```tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";

export function WalletAddress() {
  const [walletAddress, setWalletAddress] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/wallet-address")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setLoadError(data.error);
        } else {
          setWalletAddress(data.walletAddress ?? "");
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("Unable to load your wallet address.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);

    const address = String(new FormData(e.currentTarget).get("walletAddress") ?? "").trim();

    try {
      const res = await fetch("/api/wallet-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.error ?? "Unable to save wallet address.");
        return;
      }

      setWalletAddress(data.walletAddress);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Wallet Address" subtitle="Used for future withdrawals." />
      <div className="max-w-xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {loadError ? (
          <p className="text-sm font-medium text-red-500">{loadError}</p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="field-label" htmlFor="walletAddress">
                USDT BEP 20 Wallet Address
              </label>
              <input
                id="walletAddress"
                name="walletAddress"
                type="text"
                defaultValue={walletAddress}
                key={walletAddress}
                placeholder="Wallet Address"
                className="field-input"
              />
            </div>
            {saveError && <p className="text-sm font-medium text-red-500">{saveError}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-solid disabled:opacity-70" disabled={saving}>
                {saving ? "Saving..." : "Save Wallet Details"}
              </button>
              {saved && <span className="text-sm font-medium text-emerald-600">Wallet address saved.</span>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
```

(The `key={walletAddress}` on the input forces React to remount it once the fetched value arrives, so the uncontrolled `defaultValue` actually reflects it — the same trick isn't needed elsewhere in this codebase because other forms use controlled inputs, but this one deliberately stays uncontrolled to match its original structure.)

**Manual verification:** saving an address, then reloading the page, shows the saved address pre-filled instead of an empty field.

---

### Task 16: README refresh

**Files:**
- Modify: `README.md`

**Interfaces:** none — documentation only.

- [ ] **Step 1: rewrite `README.md`**

```markdown
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
```

**Manual verification:** `grep -ri "win.?fx" README.md` returns zero matches; the README's feature list matches what's actually implemented after Tasks 1–15.

---

## Self-review notes

- **Spec coverage:** every section of the design spec has a task — data model (Tasks 2–5), accrual engine (Task 6), API surface (Tasks 7–11), component wiring (Tasks 12–15), rebrand (Task 1). The one spec-level bug found and fixed during spec self-review (monthly reward silently skipping when the 1st falls on a weekend) is reflected in Task 6's two-phase `runDailyAccrual`.
- **Type consistency checked:** `WalletSummary`'s field names (`netIncome`, `netCapital`, `totalIncomeWithdrawal`, `totalCapitalWithdrawal`, etc.) are identical between Task 6 (where the type is defined and returned), Task 9 (the route that spreads it into JSON), Task 11 (which reads `.netIncome`/`.netCapital`), and Task 14 (the three components that consume the JSON shape). `StakingTier`/`LeadershipRank` field names from Task 2 are used unchanged in Tasks 6, 7, 8, 12, and 13.
- **No placeholders:** every step above is either a complete file or a complete, located edit — no "similar to Task N" references and no TODOs.
