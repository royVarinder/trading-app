import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { getWalletSummary } from "@/lib/accrual";

type WithdrawalType = "income" | "investment";

function parseType(value: string | null): WithdrawalType | null {
  return value === "income" || value === "investment" ? value : null;
}

const MIN_WITHDRAWAL = 10;
const ADMIN_CHARGE_RATE = 0.05;

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const type = parseType(new URL(req.url).searchParams.get("type"));
  if (!type) {
    return NextResponse.json({ error: "Missing or invalid type query parameter." }, { status: 400 });
  }

  const db = await getDb();
  const withdrawals = await db
    .collection("withdrawals")
    .find({ memberId: session.memberId, type })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    withdrawals: withdrawals.map((w) => ({
      id: w._id.toString(),
      amount: w.amount,
      adminCharge: w.adminCharge,
      netAmount: w.netAmount,
      status: w.status,
      createdAt: w.createdAt,
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

  const type = parseType(typeof body.type === "string" ? body.type : null);
  if (!type) {
    return NextResponse.json({ error: "Invalid withdrawal type." }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid withdrawal amount." }, { status: 400 });
  }
  if (amount < MIN_WITHDRAWAL) {
    return NextResponse.json({ error: `Minimum withdrawal is $${MIN_WITHDRAWAL}.` }, { status: 400 });
  }

  const summary = await getWalletSummary(session.memberId);
  const balance = type === "income" ? summary.netIncome : summary.netCapital;
  if (amount > balance) {
    return NextResponse.json({ error: "Amount exceeds your available balance." }, { status: 400 });
  }

  const adminCharge = Math.round(amount * ADMIN_CHARGE_RATE * 100) / 100;
  const netAmount = Math.round((amount - adminCharge) * 100) / 100;

  const db = await getDb();
  const doc = {
    memberId: session.memberId,
    username: session.username,
    type,
    amount,
    adminCharge,
    netAmount,
    status: "Pending",
    createdAt: new Date(),
  };
  const result = await db.collection("withdrawals").insertOne(doc);

  return NextResponse.json(
    {
      id: result.insertedId.toString(),
      amount: doc.amount,
      adminCharge: doc.adminCharge,
      netAmount: doc.netAmount,
      status: doc.status,
      createdAt: doc.createdAt,
    },
    { status: 201 }
  );
}
