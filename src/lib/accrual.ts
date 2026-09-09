import type { Db, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { sumField } from "@/lib/aggregate";
import { rankForTotals, type LeadershipRank } from "@/lib/plans";
import { getBusinessTotals } from "@/lib/team";
import { getSettings } from "@/lib/settings";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD" in UTC
}

function isWeekend(dateKey: string): boolean {
  const day = new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
  return day === 0 || day === 6;
}

function monthKey(dateKey: string): string {
  return dateKey.slice(0, 7); // "YYYY-MM"
}

type SystemDoc = { _id: string; lastAccrualDate?: string; lastRewardMonth?: string };

async function getSystemDoc(db: Db): Promise<SystemDoc | null> {
  return db.collection<SystemDoc>("system").findOne({ _id: "accrual" });
}

// Only staking runs on this calendar-day/weekday-skipping cron path.
// Investment income moved to runInvestmentIncomeAccrual (below), which
// accrues per-position on an admin-configurable interval instead of once a
// day — see docs/superpowers/specs/2026-09-08-deposit-income-design.md for
// the interval-accrual pattern this reuses.
type ActivePosition = {
  _id: ObjectId;
  memberId: string;
  amount: number;
  dailyRate: number;
  positionType: "staking";
  durationDays: number;
};

async function loadActivePositions(db: Db): Promise<ActivePosition[]> {
  const stakes = await db.collection("stakes").find({ status: "Active" }).toArray();

  return stakes.map((doc) => ({
    _id: doc._id,
    memberId: doc.memberId as string,
    amount: doc.amount as number,
    dailyRate: doc.dailyRate as number,
    positionType: "staking" as const,
    durationDays: doc.durationDays as number,
  }));
}

async function creditPosition(
  db: Db,
  position: ActivePosition,
  date: string
): Promise<{ memberId: string; income: number } | null> {
  const income = round2(position.amount * position.dailyRate);

  try {
    await db.collection("bonusLedger").insertOne({
      memberId: position.memberId,
      positionId: position._id,
      positionType: position.positionType,
      principal: position.amount,
      rate: position.dailyRate,
      income,
      durationDays: position.durationDays,
      date,
      createdAt: new Date(),
    });
  } catch (err: unknown) {
    // Duplicate (positionId, date) — already credited today. Safe no-op;
    // this is the idempotency guard that makes it safe to call this
    // function from every page load, not just a once-a-day cron.
    if (typeof err === "object" && err !== null && "code" in err && err.code === 11000) {
      return null;
    }
    throw err;
  }

  await db.collection("stakes").updateOne({ _id: position._id }, { $inc: { creditedDays: 1 } });
  const stake = await db.collection("stakes").findOne({ _id: position._id });
  if (stake && stake.creditedDays >= stake.durationDays) {
    await db.collection("stakes").updateOne({ _id: position._id }, { $set: { status: "Completed" } });
  }

  return { memberId: position.memberId, income };
}

// Direct referrals' current ranks — the rank-compression check below only
// looks at direct referrals ("legs"), consistent with the qualifying-leg
// rule in src/lib/plans.ts.
async function getDirectReferralRanks(db: Db, memberId: string): Promise<LeadershipRank[]> {
  const directs = await db
    .collection<{ memberId: string }>("users")
    .find({ sponsorId: memberId }, { projection: { memberId: 1 } })
    .toArray();

  const ranks = await Promise.all(directs.map((d) => computeRank(d.memberId)));
  return ranks.filter((r): r is LeadershipRank => r !== null);
}

/**
 * Rank compression: an upline's commission rate on an override is reduced
 * by the commissionPct of every rank level <= their own that at least one
 * of their direct referrals ("legs") has independently achieved — counted
 * once per distinct level reached, not once per referral. So:
 * - A Promoter whose own leg also becomes a Promoter has their rate cut by
 *   exactly the Promoter commissionPct — fully cancelling it (same rank).
 * - A Performer whose leg becomes a Promoter (a lower rank) has their rate
 *   cut by just the Promoter commissionPct, keeping the differential.
 * - A Manager whose legs include both a Promoter and a Performer has their
 *   rate cut by Promoter's + Performer's commissionPct combined.
 * This applies the same way at every rank up the tree. Floored at 0 — a
 * rank never pays a negative commission.
 */
async function getEffectiveCommissionPct(db: Db, memberId: string, rank: LeadershipRank): Promise<number> {
  const legRanks = await getDirectReferralRanks(db, memberId);

  const deductionByLevel = new Map<number, number>();
  for (const legRank of legRanks) {
    if (legRank.level <= rank.level) deductionByLevel.set(legRank.level, legRank.commissionPct);
  }
  const deduction = [...deductionByLevel.values()].reduce((sum, pct) => sum + pct, 0);

  return Math.max(0, round2(rank.commissionPct - deduction));
}

async function creditLeadershipOverrides(
  db: Db,
  sourceMemberId: string,
  sourceUsername: string,
  positionType: "investment" | "staking",
  refPrincipal: number,
  refIncome: number,
  date: string
): Promise<void> {
  let level = 0;
  let currentMemberId: string = sourceMemberId;

  // 50 is a generous depth ceiling so this loop always terminates even if a
  // sponsorId chain were ever corrupted into a cycle; real chains are
  // nowhere near this deep.
  while (level < 50) {
    const current = await db
      .collection<{ memberId: string; sponsorId: string | null }>("users")
      .findOne({ memberId: currentMemberId });
    if (!current || !current.sponsorId) break;

    const ancestor = await db
      .collection<{ memberId: string; sponsorId: string | null }>("users")
      .findOne({ memberId: current.sponsorId });
    if (!ancestor) break;

    level += 1;
    const rank = await computeRank(ancestor.memberId);

    if (rank) {
      const effectiveCommissionPct = await getEffectiveCommissionPct(db, ancestor.memberId, rank);

      if (effectiveCommissionPct > 0) {
        const income = round2((effectiveCommissionPct / 100) * refIncome);
        await db.collection("leadershipLedger").insertOne({
          beneficiaryMemberId: ancestor.memberId,
          beneficiaryRank: rank.rank,
          commissionPct: effectiveCommissionPct,
          // The rank's uncompressed rate, kept for audit — commissionPct
          // above is what actually paid out (see getEffectiveCommissionPct).
          grossCommissionPct: rank.commissionPct,
          sourceMemberId,
          sourceUsername,
          level,
          positionType,
          refPrincipal,
          refIncome,
          income,
          date,
          createdAt: new Date(),
        });
      }
    }

    currentMemberId = ancestor.memberId;
  }
}

async function runTradingBonusPhase(db: Db, date: string): Promise<void> {
  const watermark = await getSystemDoc(db);
  if (watermark?.lastAccrualDate === date) return;
  if (isWeekend(date)) return;

  const positions = await loadActivePositions(db);
  const usernameCache = new Map<string, string>();

  for (const position of positions) {
    const credited = await creditPosition(db, position, date);
    if (!credited) continue;

    let username = usernameCache.get(credited.memberId);
    if (!username) {
      const user = await db.collection("users").findOne({ memberId: credited.memberId });
      username = (user?.username as string) ?? credited.memberId;
      usernameCache.set(credited.memberId, username);
    }

    await creditLeadershipOverrides(
      db,
      credited.memberId,
      username,
      position.positionType,
      position.amount,
      credited.income,
      date
    );
  }

  await db
    .collection<SystemDoc>("system")
    .updateOne({ _id: "accrual" }, { $set: { lastAccrualDate: date } }, { upsert: true });
}

async function runMonthlyRewardPhase(db: Db, date: string): Promise<void> {
  const month = monthKey(date);
  const watermark = await getSystemDoc(db);
  if (watermark?.lastRewardMonth === month) return;

  const members = await db.collection("users").find({}, { projection: { memberId: 1 } }).toArray();
  const settings = await getSettings();

  for (const member of members) {
    const totals = await getBusinessTotals(member.memberId);
    const rank = rankForTotals(totals, settings.leadershipRanks);
    if (!rank) continue;

    try {
      await db.collection("rewardLedger").insertOne({
        memberId: member.memberId,
        rank: rank.rank,
        amount: rank.monthlyReward,
        month,
        createdAt: new Date(),
      });
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "code" in err && err.code === 11000) continue;
      throw err;
    }
  }

  await db
    .collection<SystemDoc>("system")
    .updateOne({ _id: "accrual" }, { $set: { lastRewardMonth: month } }, { upsert: true });
}

/** Staking's daily trading bonus + the monthly leadership reward — the
 * original once-a-day, skip-weekends cron path. Investment income no
 * longer runs through here; see runInvestmentIncomeAccrual. */
export async function runDailyAccrual(): Promise<void> {
  const db = await getDb();
  const date = todayKey();
  await runTradingBonusPhase(db, date);
  await runMonthlyRewardPhase(db, date);
}

export async function computeRank(memberId: string): Promise<LeadershipRank | null> {
  const [totals, settings] = await Promise.all([getBusinessTotals(memberId), getSettings()]);
  return rankForTotals(totals, settings.leadershipRanks);
}

export type WalletSummary = {
  rank: string;
  totalSelfInvestment: number;
  totalStakingBonus: number;
  totalInvestmentBonus: number;
  totalLeadership: number;
  totalRewards: number;
  totalIncome: number;
  totalIncomeWithdrawal: number;
  netIncome: number;
  totalCapitalWithdrawal: number;
  netCapital: number;
};

export async function getWalletSummary(memberId: string): Promise<WalletSummary> {
  const db = await getDb();

  const [
    investmentPrincipal,
    stakePrincipal,
    totalStakingBonus,
    totalInvestmentBonus,
    totalLeadership,
    totalRewards,
    totalIncomeWithdrawal,
    totalCapitalWithdrawal,
    rank,
  ] = await Promise.all([
    sumField(db, "investments", { memberId }, "amount"),
    sumField(db, "stakes", { memberId }, "amount"),
    sumField(db, "bonusLedger", { memberId, positionType: "staking" }, "income"),
    sumField(db, "bonusLedger", { memberId, positionType: "investment" }, "income"),
    sumField(db, "leadershipLedger", { beneficiaryMemberId: memberId }, "income"),
    sumField(db, "rewardLedger", { memberId }, "amount"),
    sumField(
      db,
      "withdrawals",
      { memberId, type: "income", status: { $in: ["Pending", "Approved", "Paid"] } },
      "amount"
    ),
    sumField(
      db,
      "withdrawals",
      { memberId, type: "investment", status: { $in: ["Pending", "Approved", "Paid"] } },
      "amount"
    ),
    computeRank(memberId),
  ]);

  const totalSelfInvestment = round2(investmentPrincipal + stakePrincipal);
  const totalIncome = round2(totalStakingBonus + totalInvestmentBonus + totalLeadership + totalRewards);
  const netIncome = Math.max(0, round2(totalIncome - totalIncomeWithdrawal));
  // Staking principal is never withdrawable — only staking *profit* is (via
  // claims -> availableFund -> the "income" withdrawal type, unaffected by
  // this). netCapital therefore only ever draws down the Startup Plan
  // (investment) principal, minus dividends already earned on it — stakes
  // are deliberately excluded from this formula entirely, even though
  // totalSelfInvestment above still reports them for display purposes.
  const netCapital = Math.max(0, round2(investmentPrincipal - totalInvestmentBonus - totalCapitalWithdrawal));

  return {
    rank: rank?.rank ?? "No-Rank",
    totalSelfInvestment,
    totalStakingBonus: round2(totalStakingBonus),
    totalInvestmentBonus: round2(totalInvestmentBonus),
    totalLeadership: round2(totalLeadership),
    totalRewards: round2(totalRewards),
    totalIncome,
    totalIncomeWithdrawal: round2(totalIncomeWithdrawal),
    netIncome,
    totalCapitalWithdrawal: round2(totalCapitalWithdrawal),
    netCapital,
  };
}

/**
 * Credits investment income independently for every Active investment,
 * based on how many admin-configured intervals (settings.startupPlan) have
 * elapsed since that position's own investmentIncomeStartAt — not the
 * shared calendar-day watermark runTradingBonusPhase uses for staking.
 * There is no "package" tier here: the rate/interval is a single global
 * platform setting, applied uniformly to whatever amount a member moved
 * from wallet into an investment. Simple interest: each newly-elapsed
 * interval is worth `amount * (ratePct / 100)`, so it doesn't matter
 * whether this runs every minute or once a week — the total at any instant
 * is identical, only how it's batched into bonusLedger entries differs.
 *
 * The `date` field on each ledger entry is deliberately NOT wall-clock
 * time. It's derived from (investmentIncomeStartAt, totalDueIntervals) so
 * that two concurrent runs computing the same due-interval count for the
 * same position collide on the bonusLedger{positionId,date} unique index —
 * the second insert throws a duplicate-key error, caught below and treated
 * as a no-op, the same guard runTradingBonusPhase relies on for staking.
 *
 * Like the pre-existing staking bonus, investment income also triggers
 * leadership/sponsor commissions (creditLeadershipOverrides) — that
 * behavior predates this function and isn't being changed here.
 */
export async function runInvestmentIncomeAccrual(): Promise<void> {
  const db = await getDb();
  const { startupPlan } = await getSettings();

  // Backfill investments created before this field existed — only touches
  // docs missing it, so this is a cheap no-op on every subsequent call.
  await db.collection("investments").updateMany(
    { status: "Active", investmentIncomeStartAt: { $exists: false } },
    [{ $set: { investmentIncomeStartAt: "$createdAt", creditedIntervals: 0 } }]
  );

  const intervalMs = startupPlan.intervalHours * 3600_000;
  const now = Date.now();

  const investments = await db
    .collection("investments")
    .find({ status: "Active" })
    .toArray();

  for (const investment of investments) {
    const startAt = new Date(investment.investmentIncomeStartAt).getTime();
    const creditedIntervals = (investment.creditedIntervals as number | undefined) ?? 0;
    const totalDueIntervals = Math.floor((now - startAt) / intervalMs);
    const newIntervals = totalDueIntervals - creditedIntervals;
    if (newIntervals < 1) continue;

    const income = round2((investment.amount as number) * (startupPlan.ratePct / 100) * newIntervals);
    const dueAt = new Date(startAt + totalDueIntervals * intervalMs);
    const dateKey = dueAt.toISOString();

    try {
      await db.collection("bonusLedger").insertOne({
        memberId: investment.memberId,
        positionId: investment._id,
        positionType: "investment",
        principal: investment.amount,
        rate: startupPlan.ratePct / 100,
        income,
        intervalsCredited: newIntervals,
        date: dateKey,
        createdAt: new Date(),
      });
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "code" in err && err.code === 11000) {
        continue; // another concurrent run already credited up to this interval
      }
      throw err;
    }

    await db
      .collection("investments")
      .updateOne({ _id: investment._id }, { $max: { creditedIntervals: totalDueIntervals } });

    await creditLeadershipOverrides(
      db,
      investment.memberId,
      (investment.username as string) ?? investment.memberId,
      "investment",
      investment.amount,
      income,
      dateKey
    );
  }
}

/** Single entrypoint the three trigger points (dashboard load, admin manual
 * trigger, external cron) call — runs staking's daily trading-bonus/monthly-
 * reward phases plus the interval-based investment income phase. */
export async function runAllAccruals(): Promise<void> {
  await runDailyAccrual();
  await runInvestmentIncomeAccrual();
}
