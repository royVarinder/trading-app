import type { Db, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { sumField } from "@/lib/aggregate";
import { rankForTotals, type LeadershipRank } from "@/lib/plans";
import { getBusinessTotals } from "@/lib/team";

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

type ActivePosition = {
  _id: ObjectId;
  memberId: string;
  amount: number;
  dailyRate: number;
  positionType: "investment" | "staking";
  durationDays?: number;
};

async function loadActivePositions(db: Db): Promise<ActivePosition[]> {
  const [investments, stakes] = await Promise.all([
    db.collection("investments").find({ status: "Active" }).toArray(),
    db.collection("stakes").find({ status: "Active" }).toArray(),
  ]);

  return [
    ...investments.map((doc) => ({
      _id: doc._id,
      memberId: doc.memberId as string,
      amount: doc.amount as number,
      dailyRate: doc.dailyRate as number,
      positionType: "investment" as const,
    })),
    ...stakes.map((doc) => ({
      _id: doc._id,
      memberId: doc.memberId as string,
      amount: doc.amount as number,
      dailyRate: doc.dailyRate as number,
      positionType: "staking" as const,
      durationDays: doc.durationDays as number,
    })),
  ];
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
      durationDays: position.durationDays ?? null,
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

  if (position.positionType === "staking") {
    await db.collection("stakes").updateOne({ _id: position._id }, { $inc: { creditedDays: 1 } });
    const stake = await db.collection("stakes").findOne({ _id: position._id });
    if (stake && stake.creditedDays >= stake.durationDays) {
      await db.collection("stakes").updateOne({ _id: position._id }, { $set: { status: "Completed" } });
    }
  }

  return { memberId: position.memberId, income };
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

    if (rank && rank.commissionPct > 0) {
      const income = round2((rank.commissionPct / 100) * refIncome);
      await db.collection("leadershipLedger").insertOne({
        beneficiaryMemberId: ancestor.memberId,
        beneficiaryRank: rank.rank,
        commissionPct: rank.commissionPct,
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

  for (const member of members) {
    const totals = await getBusinessTotals(member.memberId);
    const rank = rankForTotals(totals);
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

export async function runDailyAccrual(): Promise<void> {
  const db = await getDb();
  const date = todayKey();
  await runTradingBonusPhase(db, date);
  await runMonthlyRewardPhase(db, date);
}

export async function computeRank(memberId: string): Promise<LeadershipRank | null> {
  const totals = await getBusinessTotals(memberId);
  return rankForTotals(totals);
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
    sumField(db, "withdrawals", { memberId, type: "income", status: { $in: ["Pending", "Approved"] } }, "amount"),
    sumField(db, "withdrawals", { memberId, type: "investment", status: { $in: ["Pending", "Approved"] } }, "amount"),
    computeRank(memberId),
  ]);

  const totalSelfInvestment = round2(investmentPrincipal + stakePrincipal);
  const totalIncome = round2(totalStakingBonus + totalInvestmentBonus + totalLeadership + totalRewards);
  const netIncome = Math.max(0, round2(totalIncome - totalIncomeWithdrawal));
  const dividendsEarned = round2(totalStakingBonus + totalInvestmentBonus);
  const netCapital = Math.max(0, round2(totalSelfInvestment - dividendsEarned - totalCapitalWithdrawal));

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
