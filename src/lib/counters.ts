import { getDb } from "@/lib/mongodb";

const MEMBER_ID_BASE = 10000;

export async function getNextMemberId(): Promise<string> {
  const db = await getDb();
  const result = await db
    .collection<{ _id: string; seq: number }>("counters")
    .findOneAndUpdate(
      { _id: "memberId" },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );

  const seq = result?.seq ?? 1;
  return `PFX${MEMBER_ID_BASE + seq}`;
}
