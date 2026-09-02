export const STARTUP_PLAN = {
  min: 50,
  dailyRate: 0.005,
} as const;

export type StakingTierId = "starter" | "growth" | "advanced" | "premium" | "elite";

export type StakingTier = {
  id: StakingTierId;
  label: string;
  min: number;
  dailyRate: number;
  durationDays: number;
};

export const STAKING_TIERS: StakingTier[] = [
  { id: "starter", label: "$200 Starter", min: 200, dailyRate: 0.006, durationDays: 100 },
  { id: "growth", label: "$2,000 Growth", min: 2000, dailyRate: 0.007, durationDays: 200 },
  { id: "advanced", label: "$4,000 Advanced", min: 4000, dailyRate: 0.008, durationDays: 300 },
  { id: "premium", label: "$8,000 Premium", min: 8000, dailyRate: 0.009, durationDays: 400 },
  { id: "elite", label: "$15,000 Elite", min: 15000, dailyRate: 0.01, durationDays: 500 },
];

export function getStakingTier(id: string): StakingTier | undefined {
  return STAKING_TIERS.find((t) => t.id === id);
}

export type LeadershipRank = {
  level: number;
  rank: string;
  commissionPct: number;
  selfInvestment: number;
  directBusiness: number;
  teamBusiness: number;
  monthlyReward: number;
};

// Ordered ascending by level — thresholds strictly increase with level, so
// scanning in order and keeping the last match yields the highest qualifying
// rank (see rankForTotals).
export const LEADERSHIP_RANKS: LeadershipRank[] = [
  { level: 1, rank: "Promoter", commissionPct: 20, selfInvestment: 200, directBusiness: 1000, teamBusiness: 2000, monthlyReward: 10 },
  { level: 2, rank: "Performer", commissionPct: 40, selfInvestment: 500, directBusiness: 2500, teamBusiness: 10000, monthlyReward: 50 },
  { level: 3, rank: "Manager", commissionPct: 60, selfInvestment: 1500, directBusiness: 5000, teamBusiness: 100000, monthlyReward: 500 },
  { level: 4, rank: "Director", commissionPct: 80, selfInvestment: 5000, directBusiness: 15000, teamBusiness: 600000, monthlyReward: 2000 },
  { level: 5, rank: "Ambassador", commissionPct: 100, selfInvestment: 10000, directBusiness: 30000, teamBusiness: 2400000, monthlyReward: 10000 },
  { level: 6, rank: "Crown Ambassador", commissionPct: 120, selfInvestment: 25000, directBusiness: 50000, teamBusiness: 10000000, monthlyReward: 30000 },
];

export function rankForTotals(
  totals: {
    selfInvestment: number;
    directBusiness: number;
    teamBusiness: number;
  },
  ranks: LeadershipRank[] = LEADERSHIP_RANKS
): LeadershipRank | null {
  let best: LeadershipRank | null = null;
  for (const rank of ranks) {
    if (
      totals.selfInvestment >= rank.selfInvestment &&
      totals.directBusiness >= rank.directBusiness &&
      totals.teamBusiness >= rank.teamBusiness
    ) {
      best = rank;
    }
  }
  return best;
}
