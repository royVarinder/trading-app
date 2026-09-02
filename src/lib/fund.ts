import type { Db } from "mongodb";
import { sumField } from "@/lib/aggregate";

export async function getAvailableFund(db: Db, memberId: string): Promise<number> {
  const [deposited, invested, staked] = await Promise.all([
    sumField(db, "deposits", { memberId, status: "Approved" }, "amount"),
    sumField(db, "investments", { memberId }, "amount"),
    sumField(db, "stakes", { memberId }, "amount"),
  ]);

  return Math.max(0, Math.round((deposited - invested - staked) * 100) / 100);
}
