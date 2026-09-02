import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { computeRank } from "@/lib/accrual";
import { getSettings } from "@/lib/settings";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const [currentRank, { leadershipRanks }] = await Promise.all([
    computeRank(session.memberId),
    getSettings(),
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
      monthlyReward: r.monthlyReward,
      status: r.level <= currentLevel ? "Achieved" : "Pending",
    })),
  });
}
