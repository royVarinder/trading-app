import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = await getDb();
  const entries = await db
    .collection("leadershipLedger")
    .find({ beneficiaryMemberId: session.memberId })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e._id.toString(),
      beneficiaryRank: e.beneficiaryRank,
      sourceMemberId: e.sourceMemberId,
      sourceUsername: e.sourceUsername,
      level: e.level,
      refPrincipal: e.refPrincipal,
      refIncome: e.refIncome,
      positionType: e.positionType,
      income: e.income,
      date: e.date,
    })),
  });
}
