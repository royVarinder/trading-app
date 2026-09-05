import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";
import { sumField } from "@/lib/aggregate";

export async function GET() {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const db = await getDb();

  const [
    pendingDeposits,
    pendingWithdrawals,
    openTickets,
    totalMembers,
    totalDepositedApproved,
    totalInvested,
    totalStaked,
    totalBonus,
    totalLeadership,
    totalReward,
    totalPaidOut,
    system,
  ] = await Promise.all([
    db.collection("deposits").countDocuments({ status: "Pending" }),
    db.collection("withdrawals").countDocuments({ status: { $in: ["Pending", "Approved"] } }),
    db.collection("tickets").countDocuments({ status: { $ne: "Closed" } }),
    db.collection("users").countDocuments({}),
    sumField(db, "deposits", { status: "Approved" }, "amount"),
    sumField(db, "investments", {}, "amount"),
    sumField(db, "stakes", {}, "amount"),
    sumField(db, "bonusLedger", {}, "income"),
    sumField(db, "leadershipLedger", {}, "income"),
    sumField(db, "rewardLedger", {}, "amount"),
    sumField(db, "withdrawals", { status: "Paid" }, "netAmount"),
    db
      .collection<{ _id: string; lastAccrualDate?: string; lastRewardMonth?: string }>("system")
      .findOne({ _id: "accrual" }),
  ]);

  const round2 = (n: number) => Math.round(n * 100) / 100;

  return NextResponse.json({
    pendingDeposits,
    pendingWithdrawals,
    openTickets,
    totalMembers,
    totalDepositedApproved: round2(totalDepositedApproved),
    totalInvested: round2(totalInvested),
    totalStaked: round2(totalStaked),
    totalBonusPaid: round2(totalBonus + totalLeadership + totalReward),
    totalPaidOut: round2(totalPaidOut),
    lastAccrualDate: system?.lastAccrualDate ?? null,
    lastRewardMonth: system?.lastRewardMonth ?? null,
  });
}
