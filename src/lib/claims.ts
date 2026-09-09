import { getDb } from "@/lib/mongodb";
import { sumField } from "@/lib/aggregate";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type ClaimSummary = {
  totalInvested: number; // investment principal, still locked in position
  totalStaked: number; // staking principal, still locked in position
  investmentProfit: number; // all-time investment income (bonusLedger)
  stakingProfit: number; // all-time staking income (bonusLedger) — claimable anytime, not gated on the stake completing
  leadershipProfit: number; // all-time sponsor/leadership commissions — investment + staking combined
  totalClaimed: number; // lifetime total already moved into the wallet
  claimable: number; // what's newly available to claim right now
};

/**
 * Profit-only claim summary for the member-facing "Investment Withdrawal"
 * (claim) page. This never touches principal (totalInvested/totalStaked
 * are shown for context only) — only investment/staking/leadership PROFIT
 * can be claimed into the wallet, and it's claimable at any time (staking
 * profit does NOT wait for the stake's duration to complete). See
 * runInvestmentIncomeAccrual and the staking daily cron for where the
 * underlying bonusLedger/leadershipLedger entries come from.
 */
export async function getClaimSummary(memberId: string): Promise<ClaimSummary> {
  const db = await getDb();

  const [totalInvested, totalStaked, investmentProfit, stakingProfit, leadershipProfit, totalClaimed] =
    await Promise.all([
      sumField(db, "investments", { memberId }, "amount"),
      sumField(db, "stakes", { memberId }, "amount"),
      sumField(db, "bonusLedger", { memberId, positionType: "investment" }, "income"),
      sumField(db, "bonusLedger", { memberId, positionType: "staking" }, "income"),
      // Leadership commission on both investment and staking downline
      // income — leadershipLedger entries aren't filtered by positionType
      // here, so a rank achiever's commission already reflects both.
      sumField(db, "leadershipLedger", { beneficiaryMemberId: memberId }, "income"),
      sumField(db, "claims", { memberId }, "amount"),
    ]);

  const claimable = Math.max(0, round2(investmentProfit + stakingProfit + leadershipProfit - totalClaimed));

  return {
    totalInvested: round2(totalInvested),
    totalStaked: round2(totalStaked),
    investmentProfit: round2(investmentProfit),
    stakingProfit: round2(stakingProfit),
    leadershipProfit: round2(leadershipProfit),
    totalClaimed: round2(totalClaimed),
    claimable,
  };
}
