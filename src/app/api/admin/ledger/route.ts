import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";
import { sumField } from "@/lib/aggregate";
import { computeRank } from "@/lib/accrual";

export async function GET() {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const db = await getDb();

  const [totalBonus, totalLeadership, totalReward, bonusRecent, leadershipRecent, rewardRecent, users] =
    await Promise.all([
      sumField(db, "bonusLedger", {}, "income"),
      sumField(db, "leadershipLedger", {}, "income"),
      sumField(db, "rewardLedger", {}, "amount"),
      db.collection("bonusLedger").find({}).sort({ createdAt: -1 }).limit(50).toArray(),
      db.collection("leadershipLedger").find({}).sort({ createdAt: -1 }).limit(50).toArray(),
      db.collection("rewardLedger").find({}).sort({ createdAt: -1 }).limit(50).toArray(),
      db.collection("users").find({}, { projection: { memberId: 1 } }).toArray(),
    ]);

  const rankCounts = new Map<string, number>();
  for (const user of users) {
    const rank = await computeRank(user.memberId);
    const label = rank?.rank ?? "No-Rank";
    rankCounts.set(label, (rankCounts.get(label) ?? 0) + 1);
  }

  return NextResponse.json({
    totals: {
      totalBonus: Math.round(totalBonus * 100) / 100,
      totalLeadership: Math.round(totalLeadership * 100) / 100,
      totalReward: Math.round(totalReward * 100) / 100,
    },
    rankDistribution: Array.from(rankCounts.entries()).map(([rank, count]) => ({ rank, count })),
    bonus: bonusRecent.map((b) => ({
      memberId: b.memberId,
      positionType: b.positionType,
      principal: b.principal,
      income: b.income,
      date: b.date,
    })),
    leadership: leadershipRecent.map((l) => ({
      beneficiaryMemberId: l.beneficiaryMemberId,
      beneficiaryRank: l.beneficiaryRank,
      sourceUsername: l.sourceUsername,
      level: l.level,
      income: l.income,
      date: l.date,
    })),
    reward: rewardRecent.map((r) => ({
      memberId: r.memberId,
      rank: r.rank,
      amount: r.amount,
      month: r.month,
    })),
  });
}
