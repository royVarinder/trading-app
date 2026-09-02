import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { getAvailableFund } from "@/lib/fund";
import { STARTUP_PLAN } from "@/lib/plans";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = await getDb();
  const [investments, availableFund] = await Promise.all([
    db
      .collection("investments")
      .find({ memberId: session.memberId })
      .sort({ createdAt: -1 })
      .toArray(),
    getAvailableFund(db, session.memberId),
  ]);

  return NextResponse.json({
    availableFund,
    investments: investments.map((inv) => ({
      id: inv._id.toString(),
      amount: inv.amount,
      createdAt: inv.createdAt,
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

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < STARTUP_PLAN.min) {
    return NextResponse.json(
      { error: `Minimum investment package is $${STARTUP_PLAN.min}.` },
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
    dailyRate: STARTUP_PLAN.dailyRate,
    status: "Active" as const,
    createdAt: new Date(),
  };
  const result = await db.collection("investments").insertOne(doc);

  return NextResponse.json(
    {
      id: result.insertedId.toString(),
      amount: doc.amount,
      createdAt: doc.createdAt,
    },
    { status: 201 }
  );
}
