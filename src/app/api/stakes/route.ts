import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { getAvailableFund } from "@/lib/fund";
import { getStakingTier } from "@/lib/plans";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = await getDb();
  const stakes = await db
    .collection("stakes")
    .find({ memberId: session.memberId })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    stakes: stakes.map((s) => ({
      id: s._id.toString(),
      tierId: s.tierId,
      amount: s.amount,
      dailyRate: s.dailyRate,
      durationDays: s.durationDays,
      creditedDays: s.creditedDays,
      status: s.status,
      createdAt: s.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const tier = getStakingTier(typeof body.tierId === "string" ? body.tierId : "");
  if (!tier) {
    return NextResponse.json({ error: "Select a valid staking plan." }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < tier.min) {
    return NextResponse.json(
      { error: `Minimum stake for ${tier.label} is $${tier.min}.` },
      { status: 400 }
    );
  }

  const db = await getDb();
  const availableFund = await getAvailableFund(db, session.memberId);
  if (amount > availableFund) {
    return NextResponse.json(
      { error: "Amount exceeds your available fund balance." },
      { status: 400 }
    );
  }

  const doc = {
    memberId: session.memberId,
    username: session.username,
    amount,
    tierId: tier.id,
    dailyRate: tier.dailyRate,
    durationDays: tier.durationDays,
    startDate: new Date(),
    creditedDays: 0,
    status: "Active" as const,
    createdAt: new Date(),
  };
  const result = await db.collection("stakes").insertOne(doc);

  return NextResponse.json(
    {
      id: result.insertedId.toString(),
      tierId: doc.tierId,
      amount: doc.amount,
      dailyRate: doc.dailyRate,
      durationDays: doc.durationDays,
      creditedDays: doc.creditedDays,
      status: doc.status,
      createdAt: doc.createdAt,
    },
    { status: 201 }
  );
}
