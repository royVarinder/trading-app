import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { sendAdminEmail } from "@/lib/mailer";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = await getDb();
  const deposits = await db
    .collection("deposits")
    .find({ memberId: session.memberId })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    deposits: deposits.map((d) => ({
      id: d._id.toString(),
      amount: d.amount,
      transactionHash: d.transactionHash,
      status: d.status,
      createdAt: d.createdAt,
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
  const transactionHash = typeof body.transactionHash === "string" ? body.transactionHash.trim() : "";

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid fund amount." }, { status: 400 });
  }
  if (!transactionHash) {
    return NextResponse.json({ error: "Transaction hash is required." }, { status: 400 });
  }

  const db = await getDb();
  const doc = {
    memberId: session.memberId,
    username: session.username,
    amount,
    transactionHash,
    status: "Pending",
    createdAt: new Date(),
  };
  const result = await db.collection("deposits").insertOne(doc);

  await sendAdminEmail(
    "New deposit request — Win FX",
    [
      "A new deposit request was submitted.",
      "",
      `Member ID: ${session.memberId}`,
      `Username: ${session.username}`,
      `Amount: $${amount.toFixed(2)}`,
      `Transaction Hash: ${transactionHash}`,
      "Status: Pending",
    ].join("\n")
  );

  return NextResponse.json(
    {
      id: result.insertedId.toString(),
      amount: doc.amount,
      transactionHash: doc.transactionHash,
      status: doc.status,
      createdAt: doc.createdAt,
    },
    { status: 201 }
  );
}
