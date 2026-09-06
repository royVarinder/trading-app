import type { Db } from "mongodb";
import { sumField } from "@/lib/aggregate";

// Lifetime total of a member's *approved* deposits — the basis for the
// $50-to-refer eligibility check (see REFERRAL_DEPOSIT_THRESHOLD). Unlike
// getAvailableFund below, this is never reduced by investments/stakes/
// withdrawals — once a member has funded $50+, they stay eligible to refer.
export async function getTotalApprovedDeposits(db: Db, memberId: string): Promise<number> {
  const deposited = await sumField(db, "deposits", { memberId, status: "Approved" }, "amount");
  return Math.round(deposited * 100) / 100;
}

export async function getAvailableFund(db: Db, memberId: string): Promise<number> {
  const [deposited, invested, staked, adjustments] = await Promise.all([
    sumField(db, "deposits", { memberId, status: "Approved" }, "amount"),
    sumField(db, "investments", { memberId }, "amount"),
    sumField(db, "stakes", { memberId }, "amount"),
    // Admin-issued manual credits/debits against this member's available
    // fund (dispute resolution etc.) — see src/app/api/admin/members/[memberId]/route.ts.
    // Empty collection sums to 0, so this is a no-op until an admin uses it.
    sumField(db, "adjustments", { memberId }, "amount"),
  ]);

  return Math.max(0, Math.round((deposited - invested - staked + adjustments) * 100) / 100);
}
