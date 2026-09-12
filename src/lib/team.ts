import type { Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { LevelSummary, TeamMemberSummary, TeamSnapshot, TeamSummary } from "@/lib/team-types";
import type { LegStats } from "@/lib/plans";

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
  ownInvested: number;
  subtreeInvested: number;
  status: "Active" | "Pending";
};

export async function getTeamSnapshot(memberId: string): Promise<TeamSnapshot> {
  const db = await getDb();
  const downline = await fetchDownline(db, memberId);
  const investedByMember = await fetchInvestedTotals(
    db,
    downline.map((d) => d.memberId)
  );
  const members = buildRawMembers(downline, investedByMember);

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
    ownInvested: m.ownInvested,
    subtreeInvested: m.subtreeInvested,
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

async function fetchInvestedTotals(db: Db, memberIds: string[]): Promise<Map<string, number>> {
  if (memberIds.length === 0) return new Map();

  // "Invested" covers both the Startup Plan (`investments`) and staking
  // plans (`stakes`) — both represent capital a member has actually
  // committed, and both should count toward business/rank totals. A deposit
  // alone only funds the available balance; a member only counts as paid/
  // invested once they've actually moved that balance into a plan.
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

function buildRawMembers(
  downline: DownlineDoc[],
  investedByMember: Map<string, number>
): RawMember[] {
  const ownInvestedOf = (id: string) => investedByMember.get(id) ?? 0;

  const childrenBySponsor = new Map<string, DownlineDoc[]>();
  for (const doc of downline) {
    const key = doc.sponsorId ?? "";
    const list = childrenBySponsor.get(key) ?? [];
    list.push(doc);
    childrenBySponsor.set(key, list);
  }

  const subtreeInvestedOf = new Map<string, number>();
  const byDescendingDepth = [...downline].sort((a, b) => b.depth - a.depth);
  for (const doc of byDescendingDepth) {
    const children = childrenBySponsor.get(doc.memberId) ?? [];
    const childrenTotal = children.reduce(
      (sum, child) => sum + (subtreeInvestedOf.get(child.memberId) ?? 0),
      0
    );
    subtreeInvestedOf.set(doc.memberId, ownInvestedOf(doc.memberId) + childrenTotal);
  }

  return downline.map((doc) => {
    const ownInvested = ownInvestedOf(doc.memberId);
    const status: "Active" | "Pending" = ownInvested > 0 ? "Active" : "Pending";
    return {
      memberId: doc.memberId,
      sponsorId: doc.sponsorId,
      username: doc.username,
      mobile: doc.mobile,
      createdAt: doc.createdAt,
      level: doc.depth + 1,
      ownInvested,
      subtreeInvested: subtreeInvestedOf.get(doc.memberId) ?? ownInvested,
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
      paid: membersAtLevel.filter((m) => m.ownInvested > 0).length,
      business: membersAtLevel.reduce((sum, m) => sum + m.ownInvested, 0),
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
    directBusiness: direct.reduce((sum, m) => sum + m.ownInvested, 0),
    teamBusiness: allTeam.reduce((sum, m) => sum + m.ownInvested, 0),
  };
}

/**
 * Rank qualification totals. Shares the same investments+stakes combined
 * totals as the Direct/Level/All Team report pages (getTeamSnapshot) —
 * a member's staking capital counts toward their own rank and their
 * upline's business totals exactly like a Startup Plan investment does.
 *
 * - selfInvestment: the member's own investment + staking amount combined.
 * - directBusiness: the member's single best-performing direct referral's
 *   own investment + staking combined (no downline/subtree involved).
 * - teamBusiness: the sum of ALL the member's direct referrals' own
 *   investment + staking combined — includes the "best" one above, so the
 *   remaining direct referrals together must cover the gap between
 *   directBusiness and teamBusiness.
 * - legs: per-direct-referral stats — each leg's own investment+staking
 *   total, used to evaluate the qualifying-leg gate (a leg qualifies on its
 *   own capital, its downline is not involved) — see
 *   src/lib/plans.ts#rankForTotals / isQualifiedLeg.
 *
 * There is no minimum direct-referral count — a member with zero direct
 * referrals simply has directBusiness/teamBusiness of 0 and won't qualify
 * for any rank that requires more than that.
 */
export async function getBusinessTotals(
  memberId: string
): Promise<{ selfInvestment: number; directBusiness: number; teamBusiness: number; legs: LegStats[] }> {
  const db = await getDb();

  const directReferrals = await db
    .collection<{ memberId: string }>("users")
    .find({ sponsorId: memberId }, { projection: { memberId: 1 } })
    .toArray();
  const directIds = directReferrals.map((d) => d.memberId);

  const [selfTotals, directTotals] = await Promise.all([
    fetchInvestedTotals(db, [memberId]),
    fetchInvestedTotals(db, directIds),
  ]);

  const directAmounts = directIds.map((id) => directTotals.get(id) ?? 0);
  const directBusiness = directAmounts.length > 0 ? Math.max(...directAmounts) : 0;
  const teamBusiness = directAmounts.reduce((sum, amount) => sum + amount, 0);
  const legs: LegStats[] = directIds.map((id) => ({ memberId: id, invested: directTotals.get(id) ?? 0 }));

  return {
    selfInvestment: selfTotals.get(memberId) ?? 0,
    directBusiness,
    teamBusiness,
    legs,
  };
}
