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
