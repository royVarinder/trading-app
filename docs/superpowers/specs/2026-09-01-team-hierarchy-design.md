# Team Hierarchy (Direct / Level / All Team) — Design

Date: 2026-09-01

## Problem

`DirectTeam`, `LevelTeam`, and `AllTeam` (and the "Team Information" card
on the main dashboard) currently render 100% hardcoded arrays — no
backend flow exists for the referral genealogy at all (see README's
"What's still demo data"). The rest of the app already stores everything
needed to make this real:

- `users` documents already carry `memberId` and `sponsorId` (captured
  at signup and validated against an existing sponsor).
- `deposits` documents already carry `{memberId, amount, status}`, where
  `status` starts as `"Pending"` and is expected to be flipped to
  `"Approved"` by whoever administers the app directly in MongoDB (no
  in-app admin approval flow exists, by design, in this codebase).

This spec covers building the real referral-hierarchy backend and
wiring the three team pages plus the dashboard's Team Information card
to it. It does **not** cover the income/bonus/staking/investment-ID
pages — those remain out of scope and stay as dummy data.

## Scenario being implemented

1. If member A refers member B and B signs up using A's referral
   (sponsor) ID, B appears in A's **Direct Team**.
2. If B in turn refers C, C appears in A's **Level Team** at Level 2
   (one level deeper than direct). If C refers D, D is Level 3, and so
   on — unbounded depth, driven purely by the `sponsorId` chain.
3. **All Team** is the combined view of every member in the entire
   downline, at any level. A member who has invested (see "paid"
   below) counts toward both the raw member counts and the paid/
   business totals — they are not split into separate buckets.
4. "Paid" / "Active" status is derived from real approved deposits, not
   a separate flag. "Date of Join" uses the member's real signup
   timestamp (`users.createdAt`) — nothing about dates is dummy going
   forward.

## Definitions

- **Paid / Active member**: a member with at least one `deposits`
  document where `status === "Approved"`. Everyone else is `Pending`.
  (Deposits stay `"Pending"` until an administrator edits the record
  directly in MongoDB — consistent with how the rest of this app
  already works; no in-app approval endpoint is being added here.)
- **Package** (Direct Team column): sum of a member's own approved
  deposit amounts.
- **All Business** (Direct Team column) / **Team Business** (Level Team
  column): sum of approved deposit amounts across a subtree (a member
  + everyone in their downline). For the Level Team table specifically,
  "Team Business" is the sum of *that level's own* approved deposits
  (not subtree-inclusive), so a dollar isn't counted at multiple
  levels.

## Data model

No new collections and no schema migrations. Everything is computed at
request time from `users` + `deposits`.

```ts
type TeamMember = {
  memberId: string;
  sponsorId: string | null;
  username: string;
  mobile: string;
  createdAt: Date;
  level: number;             // 1 = direct referral, 2 = their referrals, ...
  ownApproved: number;       // sum of this member's own approved deposits
  subtreeApproved: number;   // ownApproved + all descendants' ownApproved
  status: "Active" | "Pending"; // Active iff ownApproved > 0
};

type TeamSnapshot = {
  direct: TeamMember[];                  // level === 1
  levels: {
    level: number;
    users: number;
    paid: number;
    business: number; // sum of ownApproved at this level only
  }[];
  allTeam: TeamMember[];                 // every level, sorted by createdAt
  summary: {
    totalDirect: number;
    activeDirect: number;
    pendingDirect: number;
    totalTeam: number;
    activeTeam: number;
    pendingTeam: number;
  };
};
```

## Computation (`src/lib/team.ts`)

`getTeamSnapshot(memberId: string): Promise<TeamSnapshot>`

1. Single aggregation on `users` to pull the entire downline at any
   depth in one round trip:
   ```js
   db.collection("users").aggregate([
     { $match: { memberId } },
     { $graphLookup: {
         from: "users",
         startWith: "$memberId",
         connectFromField: "memberId",
         connectToField: "sponsorId",
         as: "downline",
         depthField: "depth", // 0-based; store as level = depth + 1
       } },
     { $project: { downline: 1 } },
   ])
   ```
2. Collect all resulting `memberId`s, then one aggregation on
   `deposits` to get approved totals per member:
   ```js
   db.collection("deposits").aggregate([
     { $match: { memberId: { $in: downlineIds }, status: "Approved" } },
     { $group: { _id: "$memberId", total: { $sum: "$amount" } } },
   ])
   ```
   Build a `Map<memberId, number>` from this, defaulting to 0.
3. Build a `sponsorId -> children[]` map from the flat downline list
   (restricted to members within this downline — the root's own
   `memberId` is the top of the map). Process nodes ordered by
   descending `level` (deepest first) so every node's `subtreeApproved`
   (`ownApproved` + sum of children's `subtreeApproved`) is fully
   resolved before its parent needs it.
4. Slice the annotated flat list:
   - `direct` = nodes with `level === 1`.
   - `levels` = group all nodes by `level`, aggregating `users` (count),
     `paid` (count where `ownApproved > 0`), `business` (sum of
     `ownApproved` for that level). If the downline is empty, return a
     single `{level: 1, users: 0, paid: 0, business: 0}` row so the
     table isn't blank.
   - `allTeam` = every node, sorted by `createdAt` ascending.
   - `summary` = counts derived from `direct` (totalDirect/active/
     pending) and `allTeam` (totalTeam/active/pending).

No caching — computed fresh per request. Downline sizes for this kind
of app are expected to be small enough (tens to low hundreds of
members) that a live `$graphLookup` per page load is fine; revisit if
that assumption breaks down.

## API

`GET /api/team` — session-protected (401 via existing `getSession()`
pattern used by `/api/deposits`, `/api/tickets`, etc.).

Response `200`:
```json
{
  "direct": [ { "memberId": "...", "sponsorId": "...", "username": "...", "mobile": "...", "createdAt": "...", "level": 1, "ownApproved": 100, "subtreeApproved": 250, "status": "Active" } ],
  "levels": [ { "level": 1, "users": 2, "paid": 1, "business": 100 } ],
  "allTeam": [ ... same shape as direct entries, all levels ... ],
  "summary": { "totalDirect": 2, "activeDirect": 1, "pendingDirect": 1, "totalTeam": 3, "activeTeam": 1, "pendingTeam": 2 }
}
```
Dates serialize as ISO strings over JSON, same as every other route in
this app.

One shared endpoint (not four per-page routes) because all four views
are slices of the same traversal — computing it four times per
page-visit would mean four redundant `$graphLookup` queries for
identical underlying data.

## Component changes

- `DirectTeam.tsx` — client component, `useEffect`-fetches
  `/api/team`, renders `direct[]`. `TableSkeleton` while loading, error
  banner on failure — same pattern as `DepositHistory.tsx`. Columns:
  `#`, User ID (`memberId`), Name (`username`), Sponsor ID (root
  member's own id, passed in as the existing `memberId` prop), Mobile,
  Package (`$${ownApproved}`), All Business (`$${subtreeApproved}`),
  Status (`StatusBadge`).
- `LevelTeam.tsx` — client component, fetches `/api/team`, renders
  `levels[]`. Drop the "Demo only" tooltip on the "View Team" button
  (no drill-down view requested; button stays as a visual affordance).
- `AllTeam.tsx` — client component, fetches `/api/team`, renders
  `allTeam[]` with real `createdAt` as "Date of Join", `memberId`,
  `username`, `sponsorId`, `StatusBadge`.
- `DashboardView.tsx` — gains its own `/api/team` fetch (additive; it
  fetches nothing today) to populate the "Team Information" card's 6
  numbers from `summary`. Everything else on that page (stat tiles,
  Account Information card) stays dummy — out of scope.

Each component fetches independently (no lifting state into
`HomeShell`), consistent with how every other dashboard page in this
app already works.

## Error handling

Same as existing pages: unauthenticated → `getSession()` returns
`null` → route responds `401 { error: "Not authenticated." }` → client
shows the standard red error banner. Empty downline is not an error —
it renders through `DataTable`'s existing `emptyMessage` prop, worded
per table (e.g. "You haven't referred anyone yet." for Direct Team).

## Testing

No test runner exists in this repo (no test files, no `test` script
beyond `lint`/`build`). Verification is manual:

1. Sign up a 3-deep referral chain (A refers B, B refers C) using the
   existing `/signup?ref=<memberId>` flow.
2. Confirm Direct Team (A sees B), Level Team (A sees Level 1: B,
   Level 2: C), and All Team (A sees both B and C) render correctly.
3. Manually flip one deposit's `status` to `"Approved"` in MongoDB and
   confirm the affected member's status flips to Active and the
   package/business/paid numbers update correctly at every level that
   should reflect it.
4. Confirm a brand-new account with no referrals sees empty-but-valid
   tables (not errors, not crashes).

## Out of scope

- Income/bonus pages, Investment ID / Staking ID / Reports — remain
  dummy data, untouched.
- Any in-app admin UI for approving deposits — deposits continue to be
  approved by direct database edit, as today.
- Caching or pagination of team data — not needed at expected scale.
