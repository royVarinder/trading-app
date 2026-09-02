import type { Db } from "mongodb";
import { sumField } from "@/lib/aggregate";

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
