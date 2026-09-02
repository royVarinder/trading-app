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
    .collection("bonusLedger")
    .find({ memberId: session.memberId, positionType: "investment" })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e._id.toString(),
      principal: e.principal,
      income: e.income,
      date: e.date,
    })),
  });
}
