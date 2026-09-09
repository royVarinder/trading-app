import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { getClaimSummary } from "@/lib/claims";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const summary = await getClaimSummary(session.memberId);
  return NextResponse.json(summary);
}

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Recompute at submit time rather than trusting a client-sent amount —
  // this is what's actually claimable right now, not whatever the client
  // last rendered.
  const summary = await getClaimSummary(session.memberId);
  if (summary.claimable <= 0) {
    return NextResponse.json({ error: "You have no profit available to claim right now." }, { status: 400 });
  }

  const db = await getDb();
  const doc = {
    memberId: session.memberId,
    username: session.username,
    amount: summary.claimable,
    investmentProfit: summary.investmentProfit,
    stakingProfit: summary.stakingProfit,
    leadershipProfit: summary.leadershipProfit,
    createdAt: new Date(),
  };
  const result = await db.collection("claims").insertOne(doc);

  return NextResponse.json(
    { id: result.insertedId.toString(), amount: doc.amount, createdAt: doc.createdAt },
    { status: 201 }
  );
}
