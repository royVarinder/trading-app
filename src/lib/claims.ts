import { getDb } from "@/lib/mongodb";
import { sumField } from "@/lib/aggregate";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type ClaimSummary = {
  totalInvested: number; // investment principal, still locked in position
  totalStaked: number; // staking principal, still locked in position
  investmentProfit: number; // all-time investment income (bonusLedger)
  // Staking profit is only counted once a stake's full duration has been
  // credited (status: "Completed") — matches how staking already locks
  // profit to a position for its selected number of days.
  completedStakingProfit: number;
  leadershipProfit: number; // all-time sponsor/leadership commissions
  totalClaimed: number; // lifetime total already moved into the wallet
  claimable: number; // what's newly available to claim right now
};

/**
 * Profit-only claim summary for the member-facing "Investment Withdrawal"
 * (claim) page. This never touches principal (totalInvested/totalStaked
 * are shown for context only) — only investment/staking/leadership PROFIT
 * can be claimed into the wallet. See runInvestmentIncomeAccrual (deposit
 * income's engine, retargeted) and the pre-existing staking daily cron for
 * where the underlying bonusLedger/leadershipLedger entries come from.
 */
export async function getClaimSummary(memberId: string): Promise<ClaimSummary> {
  const db = await getDb();

  const completedStakes = await db
    .collection("stakes")
    .find({ memberId, status: "Completed" }, { projection: { _id: 1 } })
    .toArray();
  const completedStakeIds = completedStakes.map((s) => s._id);

  const [totalInvested, totalStaked, investmentProfit, completedStakingProfit, leadershipProfit, totalClaimed] =
    await Promise.all([
      sumField(db, "investments", { memberId }, "amount"),
      sumField(db, "stakes", { memberId }, "amount"),
      sumField(db, "bonusLedger", { memberId, positionType: "investment" }, "income"),
      completedStakeIds.length
        ? sumField(
            db,
            "bonusLedger",
            { memberId, positionType: "staking", positionId: { $in: completedStakeIds } },
            "income"
          )
        : Promise.resolve(0),
      sumField(db, "leadershipLedger", { beneficiaryMemberId: memberId }, "income"),
      sumField(db, "claims", { memberId }, "amount"),
    ]);

  const claimable = Math.max(
    0,
    round2(investmentProfit + completedStakingProfit + leadershipProfit - totalClaimed)
  );

  return {
    totalInvested: round2(totalInvested),
    totalStaked: round2(totalStaked),
    investmentProfit: round2(investmentProfit),
    completedStakingProfit: round2(completedStakingProfit),
    leadershipProfit: round2(leadershipProfit),
    totalClaimed: round2(totalClaimed),
    claimable,
  };
}
