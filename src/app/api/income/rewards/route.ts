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
