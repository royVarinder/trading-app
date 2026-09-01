# Team Hierarchy (Direct / Level / All Team) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded dummy data in Direct Team, Level Team, All Team, and the Dashboard's Team Information card with real data derived from the `users.sponsorId` referral chain and `deposits` records.

**Architecture:** A new `getTeamSnapshot(memberId)` function in `src/lib/team.ts` runs one `$graphLookup` aggregation on `users` to pull the entire downline at any depth, one aggregation on `deposits` to get approved totals per member, then computes per-member/per-level/summary numbers in memory. A single `GET /api/team` route exposes this snapshot; all four UI surfaces fetch it client-side and render their own slice.

**Tech Stack:** Next.js 16 App Router, TypeScript, MongoDB native driver (`$graphLookup`, `$group`), React client components with `useEffect`/`useState` (existing repo pattern — see `DepositHistory.tsx`).

**Spec:** `docs/superpowers/specs/2026-09-01-team-hierarchy-design.md`

## Global Constraints

- "Paid" / "Active" status = at least one `deposits` document with `status === "Approved"` for that member. Nothing else marks a member paid.
- "Package" = sum of a member's own approved deposits. "All Business" (Direct Team) / a subtree's business = that member + all descendants' approved deposits. "Team Business" (Level Team) = sum of approved deposits *at that level only* (no double counting across levels).
- Levels are unbounded depth, driven purely by the `sponsorId` chain — never hardcode a level count.
- Date of Join = real `users.createdAt`, not a placeholder.
- No new collections, no schema migrations, no in-app deposit-approval UI (deposits keep getting approved by direct database edit, as today).
- **This repo has no test runner** (`package.json` only has `dev`/`build`/`start`/`lint` scripts, no test files anywhere). Per the spec's Testing section, verification in this plan is manual: `npx tsc --noEmit` for type safety after each code task, plus curl/browser checks against a running `npm run dev` server with real signup/deposit data. Do not introduce a test framework as part of this plan — out of scope.
- Every dashboard fetch pattern in this repo already follows one shape: `useEffect` → `fetch(url)` → `.then(res => res.json())` → set state or set error → `TableSkeleton` while `state === null` → red error banner on `data.error`. Match it exactly (see `src/components/dashboard/DepositHistory.tsx`).

---

### Task 1: Team snapshot backend (`lib/team-types.ts`, `lib/team.ts`, `api/team/route.ts`, `lib/mongodb.ts` index)

**Files:**
- Create: `src/lib/team-types.ts`
- Create: `src/lib/team.ts`
- Create: `src/app/api/team/route.ts`
- Modify: `src/lib/mongodb.ts:32-45` (add a `sponsorId` index)

**Interfaces:**
- Produces: `TeamMemberSummary`, `LevelSummary`, `TeamSummary`, `TeamSnapshot` types (from `team-types.ts`, safe for client import — no server dependencies). `getTeamSnapshot(memberId: string): Promise<TeamSnapshot>` (from `team.ts`, server-only — imports `getDb`). `GET /api/team` route returning `TeamSnapshot` JSON, 401 if unauthenticated.
- Consumes: `getDb()` from `@/lib/mongodb`, `getSession()` from `@/lib/session` (both already exist).

This is one task because `team.ts` has no independently-testable surface without a route to call it through (no test runner, no TS script runner in this repo) — the route is the first point real verification is possible.

- [ ] **Step 1: Create `src/lib/team-types.ts`**

```ts
export type TeamMemberSummary = {
  memberId: string;
  sponsorId: string | null;
  username: string;
  mobile: string;
  createdAt: string; // ISO string — this is the wire format, not a Date
  level: number; // 1 = direct referral, 2 = their referrals, ...
  ownApproved: number; // sum of this member's own approved deposits
  subtreeApproved: number; // ownApproved + all descendants' ownApproved
  status: "Active" | "Pending"; // Active iff ownApproved > 0
};

export type LevelSummary = {
  level: number;
  users: number;
  paid: number;
  business: number; // sum of ownApproved at this level only
};

export type TeamSummary = {
  totalDirect: number;
  activeDirect: number;
  pendingDirect: number;
  totalTeam: number;
  activeTeam: number;
  pendingTeam: number;
};

export type TeamSnapshot = {
  direct: TeamMemberSummary[]; // level === 1
  levels: LevelSummary[];
  allTeam: TeamMemberSummary[]; // every level, sorted by createdAt ascending
  summary: TeamSummary;
};
```

- [ ] **Step 2: Add a `sponsorId` index in `src/lib/mongodb.ts`**

In the `Promise.all([...])` array inside `getDb()` (currently `src/lib/mongodb.ts:32-45`), add a new entry alongside the existing `db.collection("users").createIndexes([...])` call:

```ts
      db.collection("users").createIndex({ sponsorId: 1 }),
```

Add it as its own array element (after the existing `users.createIndexes` call, before `db.collection("deposits")...`), since `$graphLookup` will now query `users` by `sponsorId` on every team page load.

- [ ] **Step 3: Create `src/lib/team.ts`**

```ts
import type { Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { LevelSummary, TeamMemberSummary, TeamSnapshot, TeamSummary } from "@/lib/team-types";

type DownlineDoc = {
  memberId: string;
  sponsorId: string | null;
  username: string;
  mobile: string;
  createdAt: Date;
  depth: number;
};

type RawMember = {
  memberId: string;
  sponsorId: string | null;
  username: string;
  mobile: string;
  createdAt: Date;
  level: number;
  ownApproved: number;
  subtreeApproved: number;
  status: "Active" | "Pending";
};

export async function getTeamSnapshot(memberId: string): Promise<TeamSnapshot> {
  const db = await getDb();
  const downline = await fetchDownline(db, memberId);
  const approvedByMember = await fetchApprovedTotals(
    db,
    downline.map((d) => d.memberId)
  );
  const members = buildRawMembers(downline, approvedByMember);

  const direct = members.filter((m) => m.level === 1);
  const levels = buildLevelSummaries(members);
  const allTeam = [...members].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const summary = buildSummary(direct, allTeam);

  return {
    direct: direct.map(toSummaryMember),
    levels,
    allTeam: allTeam.map(toSummaryMember),
    summary,
  };
}

function toSummaryMember(m: RawMember): TeamMemberSummary {
  return {
    memberId: m.memberId,
    sponsorId: m.sponsorId,
    username: m.username,
    mobile: m.mobile,
    createdAt: m.createdAt.toISOString(),
    level: m.level,
    ownApproved: m.ownApproved,
    subtreeApproved: m.subtreeApproved,
    status: m.status,
  };
}

async function fetchDownline(db: Db, memberId: string): Promise<DownlineDoc[]> {
  const [root] = await db
    .collection("users")
    .aggregate<{ downline: DownlineDoc[] }>([
      { $match: { memberId } },
      {
        $graphLookup: {
          from: "users",
          startWith: "$memberId",
          connectFromField: "memberId",
          connectToField: "sponsorId",
          as: "downline",
          depthField: "depth",
        },
      },
      {
        $project: {
          _id: 0,
          "downline.memberId": 1,
          "downline.sponsorId": 1,
          "downline.username": 1,
          "downline.mobile": 1,
          "downline.createdAt": 1,
          "downline.depth": 1,
        },
      },
    ])
    .toArray();

  return root?.downline ?? [];
}

async function fetchApprovedTotals(db: Db, memberIds: string[]): Promise<Map<string, number>> {
  if (memberIds.length === 0) return new Map();

  const totals = await db
    .collection("deposits")
    .aggregate<{ _id: string; total: number }>([
      { $match: { memberId: { $in: memberIds }, status: "Approved" } },
      { $group: { _id: "$memberId", total: { $sum: "$amount" } } },
    ])
    .toArray();

  return new Map(totals.map((t) => [t._id, t.total]));
}

function buildRawMembers(
  downline: DownlineDoc[],
  approvedByMember: Map<string, number>
): RawMember[] {
  const ownApprovedOf = (id: string) => approvedByMember.get(id) ?? 0;

  const childrenBySponsor = new Map<string, DownlineDoc[]>();
  for (const doc of downline) {
    const key = doc.sponsorId ?? "";
    const list = childrenBySponsor.get(key) ?? [];
    list.push(doc);
    childrenBySponsor.set(key, list);
  }

  const subtreeApprovedOf = new Map<string, number>();
  const byDescendingDepth = [...downline].sort((a, b) => b.depth - a.depth);
  for (const doc of byDescendingDepth) {
    const children = childrenBySponsor.get(doc.memberId) ?? [];
    const childrenTotal = children.reduce(
      (sum, child) => sum + (subtreeApprovedOf.get(child.memberId) ?? 0),
      0
    );
    subtreeApprovedOf.set(doc.memberId, ownApprovedOf(doc.memberId) + childrenTotal);
  }

  return downline.map((doc) => {
    const ownApproved = ownApprovedOf(doc.memberId);
    const status: "Active" | "Pending" = ownApproved > 0 ? "Active" : "Pending";
    return {
      memberId: doc.memberId,
      sponsorId: doc.sponsorId,
      username: doc.username,
      mobile: doc.mobile,
      createdAt: doc.createdAt,
      level: doc.depth + 1,
      ownApproved,
      subtreeApproved: subtreeApprovedOf.get(doc.memberId) ?? ownApproved,
      status,
    };
  });
}

function buildLevelSummaries(members: RawMember[]): LevelSummary[] {
  if (members.length === 0) {
    return [{ level: 1, users: 0, paid: 0, business: 0 }];
  }

  const byLevel = new Map<number, RawMember[]>();
  for (const member of members) {
    const list = byLevel.get(member.level) ?? [];
    list.push(member);
    byLevel.set(member.level, list);
  }

  const maxLevel = Math.max(...byLevel.keys());
  const levels: LevelSummary[] = [];
  for (let level = 1; level <= maxLevel; level++) {
    const membersAtLevel = byLevel.get(level) ?? [];
    levels.push({
      level,
      users: membersAtLevel.length,
      paid: membersAtLevel.filter((m) => m.ownApproved > 0).length,
      business: membersAtLevel.reduce((sum, m) => sum + m.ownApproved, 0),
    });
  }
  return levels;
}

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
  };
}
```

- [ ] **Step 4: Create `src/app/api/team/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getTeamSnapshot } from "@/lib/team";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const snapshot = await getTeamSnapshot(session.memberId);
  return NextResponse.json(snapshot);
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors related to the new files. (Pre-existing unrelated errors, if any, are not this task's concern — but there should be none in a clean repo.)

- [ ] **Step 6: Start the dev server**

Run: `npm run dev` (leave running in the background for the rest of this task)

- [ ] **Step 7: Seed a 3-level referral chain via the real signup API**

Run in a POSIX shell (e.g. Git Bash) so the `$(...)` extraction works:

```bash
A_ID=$(curl -s -c cookiesA.txt -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"teamtestA","email":"teamtesta@example.com","countryCode":"+1","mobile":"5550001111","password":"password1","transactionPassword":"1234","acceptedTerms":true}' \
  | grep -o '"memberId":"[^"]*' | cut -d'"' -f4)
echo "A_ID=$A_ID"
```

```bash
B_ID=$(curl -s -c cookiesB.txt -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"sponsorId":"'"$A_ID"'","username":"teamtestB","email":"teamtestb@example.com","countryCode":"+1","mobile":"5550001112","password":"password1","transactionPassword":"1234","acceptedTerms":true}' \
  | grep -o '"memberId":"[^"]*' | cut -d'"' -f4)
echo "B_ID=$B_ID"
```

```bash
C_ID=$(curl -s -c cookiesC.txt -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"sponsorId":"'"$B_ID"'","username":"teamtestC","email":"teamtestc@example.com","countryCode":"+1","mobile":"5550001113","password":"password1","transactionPassword":"1234","acceptedTerms":true}' \
  | grep -o '"memberId":"[^"]*' | cut -d'"' -f4)
echo "C_ID=$C_ID"
```

Confirm all three of `A_ID`/`B_ID`/`C_ID` printed a non-empty `WF...` value before continuing — an empty value means the signup call failed (check the dev server log).

- [ ] **Step 8: Verify the snapshot as A**

```bash
curl -s -b cookiesA.txt http://localhost:3000/api/team
```
Expected: `direct` has exactly one entry (B, `level: 1`, `ownApproved: 0`, `subtreeApproved: 0`, `status: "Pending"`). `levels` has two entries: `{level: 1, users: 1, paid: 0, business: 0}` and `{level: 2, users: 1, paid: 0, business: 0}`. `allTeam` has both B and C. `summary` is `{totalDirect: 1, activeDirect: 0, pendingDirect: 1, totalTeam: 2, activeTeam: 0, pendingTeam: 2}`.

- [ ] **Step 9: Verify the paid/business rollup**

Submit a deposit as B (reuses `cookiesB.txt`, an existing endpoint):
```bash
curl -s -b cookiesB.txt -X POST http://localhost:3000/api/deposits \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"transactionHash":"0xTEST123"}'
```
Then flip it to Approved directly in MongoDB (matches how this app already expects deposits to be approved):
```bash
mongosh "$MONGODB_URI" --eval 'db.getSiblingDB("winfx").deposits.updateOne({memberId: "'"$B_ID"'"}, {$set: {status: "Approved"}})'
```
Re-run `curl -s -b cookiesA.txt http://localhost:3000/api/team` and confirm: B's entry now has `ownApproved: 100`, `subtreeApproved: 100`, `status: "Active"`. Level 1's `paid` is now `1` and `business` is `100`. `summary.activeDirect` and `summary.activeTeam` are both `1`.

- [ ] **Step 10: Commit**

```bash
git add src/lib/team-types.ts src/lib/team.ts src/app/api/team/route.ts src/lib/mongodb.ts
git commit -m "feat: add team snapshot backend (direct/level/all-team aggregation)"
```

---

### Task 2: Wire `DirectTeam.tsx` to the real backend

**Files:**
- Modify: `src/components/dashboard/DirectTeam.tsx` (full rewrite — currently 29 lines of hardcoded data)

**Interfaces:**
- Consumes: `GET /api/team` → `TeamSnapshot` (uses `.direct`), `TeamMemberSummary` type from `@/lib/team-types` (Task 1).
- Produces: no change to the component's public props — still `DirectTeam({ memberId }: { memberId: string })`, so `HomeShell.tsx` needs no changes.

- [ ] **Step 1: Rewrite `src/components/dashboard/DirectTeam.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";
import type { TeamMemberSummary } from "@/lib/team-types";

export function DirectTeam({ memberId }: { memberId: string }) {
  const [direct, setDirect] = useState<TeamMemberSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setDirect(data.direct ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load your direct team.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    direct?.map((m, i) => ({
      "#": i + 1,
      id: m.memberId,
      name: m.username,
      sponsor: memberId,
      mobile: m.mobile,
      package: `$${m.ownApproved.toFixed(2)}`,
      business: `$${m.subtreeApproved.toFixed(2)}`,
      status: <StatusBadge status={m.status} />,
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Direct Team" subtitle="Members you have personally sponsored." />

      {direct === null && !error ? (
        <TableSkeleton columns={8} rows={3} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "id", label: "User ID" },
            { key: "name", label: "Name" },
            { key: "sponsor", label: "Sponsor Id" },
            { key: "mobile", label: "Mobile No" },
            { key: "package", label: "Package" },
            { key: "business", label: "All Business" },
            { key: "status", label: "Status" },
          ]}
          rows={rows}
          emptyMessage="You haven't referred anyone yet."
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify in the browser**

With `npm run dev` still running and the seed data from Task 1 in place, log in as `teamtestA` (member A) at `http://localhost:3000/login`, open the Direct Team page from the sidebar. Expected: one row for B, Sponsor Id column showing A's memberId, Package `$100.00`, All Business `$100.00`, status badge "Active" (green).

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/DirectTeam.tsx
git commit -m "feat: wire Direct Team page to real referral data"
```

---

### Task 3: Wire `LevelTeam.tsx` to the real backend

**Files:**
- Modify: `src/components/dashboard/LevelTeam.tsx` (full rewrite — currently 43 lines of hardcoded data)

**Interfaces:**
- Consumes: `GET /api/team` → `TeamSnapshot` (uses `.levels`), `LevelSummary` type from `@/lib/team-types` (Task 1).
- Produces: no props change — `LevelTeam()` still takes no arguments, so `HomeShell.tsx` needs no changes.

- [ ] **Step 1: Rewrite `src/components/dashboard/LevelTeam.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";
import type { LevelSummary } from "@/lib/team-types";

export function LevelTeam() {
  const [levels, setLevels] = useState<LevelSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setLevels(data.levels ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load your level team.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    levels?.map((l) => ({
      "#": l.level,
      level: `Level-${l.level}`,
      users: l.users,
      paid: l.paid,
      business: `$${l.business.toFixed(2)}`,
      action: (
        <button type="button" className="btn-solid !py-1.5 !px-3 !text-xs">
          View Team
        </button>
      ),
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Level Team" subtitle="Your downline broken out by level." />

      {levels === null && !error ? (
        <TableSkeleton columns={6} rows={3} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "level", label: "Level" },
            { key: "users", label: "Total Users" },
            { key: "paid", label: "Total Paid Users" },
            { key: "business", label: "Team Business" },
            { key: "action", label: "Action" },
          ]}
          rows={rows}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify in the browser**

Logged in as A, open Level Team. Expected: Level-1 row shows Total Users `1`, Total Paid Users `1`, Team Business `$100.00`; Level-2 row shows Total Users `1`, Total Paid Users `0`, Team Business `$0.00` (matches Task 1's seeded data: B is paid, C is not).

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/LevelTeam.tsx
git commit -m "feat: wire Level Team page to real referral data"
```

---

### Task 4: Wire `AllTeam.tsx` to the real backend

**Files:**
- Modify: `src/components/dashboard/AllTeam.tsx` (full rewrite — currently 29 lines of hardcoded data)

**Interfaces:**
- Consumes: `GET /api/team` → `TeamSnapshot` (uses `.allTeam`), `TeamMemberSummary` type from `@/lib/team-types` (Task 1).
- Produces: no props change — still `AllTeam({ memberId }: { memberId: string })`.

- [ ] **Step 1: Rewrite `src/components/dashboard/AllTeam.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";
import type { TeamMemberSummary } from "@/lib/team-types";

export function AllTeam({ memberId }: { memberId: string }) {
  const [allTeam, setAllTeam] = useState<TeamMemberSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setAllTeam(data.allTeam ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load your team report.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    allTeam?.map((m, i) => ({
      "#": i + 1,
      join: new Date(m.createdAt).toLocaleDateString(),
      id: m.memberId,
      name: m.username,
      sponsor: m.sponsorId ?? memberId,
      status: <StatusBadge status={m.status} />,
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="All Team Report" subtitle="Every member across your entire downline." />

      {allTeam === null && !error ? (
        <TableSkeleton columns={6} rows={3} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "S.No" },
            { key: "join", label: "Date of Join" },
            { key: "id", label: "Member Id" },
            { key: "name", label: "Name" },
            { key: "sponsor", label: "Sponsor ID" },
            { key: "status", label: "Status" },
          ]}
          rows={rows}
          emptyMessage="Your downline is empty."
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify in the browser**

Logged in as A, open All Team Report. Expected: two rows — B (Sponsor ID = A's memberId, status Active) and C (Sponsor ID = B's memberId, status Pending) — sorted with B before C (B signed up first), each showing its real signup date.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/AllTeam.tsx
git commit -m "feat: wire All Team Report page to real referral data"
```

---

### Task 5: Wire the Dashboard's Team Information card to the real backend

**Files:**
- Modify: `src/components/dashboard/DashboardView.tsx:1-92` (add client fetch + replace one `InfoCard`'s rows; the stat tiles below and Account Information card stay dummy — out of scope)

**Interfaces:**
- Consumes: `GET /api/team` → `TeamSnapshot` (uses `.summary`), `TeamSummary` type from `@/lib/team-types` (Task 1).
- Produces: no props change — still `DashboardView({ memberId }: { memberId: string })`.

- [ ] **Step 1: Add `"use client"`, imports, and state to `src/components/dashboard/DashboardView.tsx`**

At the top of the file (line 1), add the client directive and new imports:

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
```

(This replaces the current lines 1-14, adding the `"use client"` directive and the two new imports; `STATS` and `TICKER_SYMBOLS` below are unchanged.)

Immediately before `export function DashboardView`, add a default-zero constant:

```tsx
const EMPTY_SUMMARY: TeamSummary = {
  totalDirect: 0,
  activeDirect: 0,
  pendingDirect: 0,
  totalTeam: 0,
  activeTeam: 0,
  pendingTeam: 0,
};
```

Change the function body's opening to fetch the summary:

```tsx
export function DashboardView({ memberId }: { memberId: string }) {
  const [summary, setSummary] = useState<TeamSummary>(EMPTY_SUMMARY);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || data.error) return;
        setSummary(data.summary ?? EMPTY_SUMMARY);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
```

(Errors are swallowed here on purpose: this card sits on a dashboard page that is mostly still dummy data by design, so a full-page error banner would be inconsistent with the surrounding stat tiles. It silently keeps showing zeros, same as today's "empty account" look.)

- [ ] **Step 2: Replace the "Team Information" `InfoCard`'s rows**

Find the existing block (currently `src/components/dashboard/DashboardView.tsx:80-91`):

```tsx
        <InfoCard
          title="Team Information"
          rows={[
            { label: "User ID", value: memberId },
            { label: "Total Direct", value: "1" },
            { label: "Active Direct", value: "0" },
            { label: "Pending Direct", value: "1" },
            { label: "Total Team", value: "1" },
            { label: "Active Team", value: "0" },
            { label: "Pending Team", value: "1" },
          ]}
        />
```

Replace with:

```tsx
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
```

(`InfoCard`'s `rows` prop already types `value` as `ReactNode`, which numbers satisfy directly — no `String()` wrapping needed.)

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Verify in the browser**

Logged in as A, open the Dashboard. Expected: Team Information card shows Total Direct `1`, Active Direct `1`, Pending Direct `0`, Total Team `2`, Active Team `1`, Pending Team `1` (matches Task 1's seeded + approved data). The rest of the page (stat tiles, Account Information, tour status) is unchanged dummy content.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/DashboardView.tsx
git commit -m "feat: wire Dashboard Team Information card to real referral data"
```

---

### Task 6: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Full type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds (this also re-runs the full TypeScript check across the whole app, including the new API route).

- [ ] **Step 3: End-to-end manual scenario, from scratch**

Using a fresh `npm run dev` and either a cleared `users`/`deposits` collection or three brand-new test accounts:

1. Sign up member A with no sponsor.
2. Sign up member B with `sponsorId` = A's memberId.
3. Sign up member C with `sponsorId` = B's memberId.
4. As A: Direct Team shows only B. Level Team shows Level-1 (B) and Level-2 (C), both with 0 paid / $0 business. All Team shows both B and C with real join dates and "Pending" status. Dashboard's Team Information shows Total Direct 1, Total Team 2, both Active counts 0.
5. Submit a deposit as B, then flip it to `"Approved"` directly in MongoDB.
6. Refresh all four surfaces as A: B now shows Active/paid everywhere it should (Direct Team package + business, Level-1 paid count + business, All Team status, Dashboard active counts); C is unaffected (still Pending, still $0) since C has no approved deposit of its own — but confirm C's presence doesn't change B's own numbers.
7. Confirm a brand-new account with zero referrals renders all three team pages without errors (empty tables with the `emptyMessage` text, Level Team showing a single all-zero Level-1 row, Dashboard Team Information showing all zeros).

- [ ] **Step 4: Clean up test data**

Remove the test accounts (`teamtestA`/`B`/`C` or whichever usernames were used) and their deposits from MongoDB so they don't linger in a real database:

```bash
mongosh "$MONGODB_URI" --eval 'db.getSiblingDB("winfx").users.deleteMany({username: {$in: ["teamtestA","teamtestB","teamtestC"]}}); db.getSiblingDB("winfx").deposits.deleteMany({memberId: {$in: ["'"$A_ID"'","'"$B_ID"'","'"$C_ID"'"]}})'
```
