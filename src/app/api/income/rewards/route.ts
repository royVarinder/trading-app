import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { computeRank } from "@/lib/accrual";
import { getSettings } from "@/lib/settings";
import { getBusinessTotals } from "@/lib/team";
import { isQualifiedLeg } from "@/lib/plans";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const [currentRank, { leadershipRanks }, totals] = await Promise.all([
    computeRank(session.memberId),
    getSettings(),
    getBusinessTotals(session.memberId),
  ]);
  const currentLevel = currentRank?.level ?? 0;

  return NextResponse.json({
    ranks: leadershipRanks.map((r) => ({
      level: r.level,
      rank: r.rank,
      commissionPct: r.commissionPct,
      selfInvestment: r.selfInvestment,
      directBusiness: r.directBusiness,
      teamBusiness: r.teamBusiness,
      // Whether at least one direct referral already qualifies as this
      // rank's "leg" (invested themselves + their own downline reaches
      // directBusiness above) — see src/lib/plans.ts#isQualifiedLeg.
      hasQualifiedLeg: totals.legs.some((leg) => isQualifiedLeg(leg, r)),
      monthlyReward: r.monthlyReward,
      status: r.level <= currentLevel ? "Achieved" : "Pending",
    })),
  });
}
