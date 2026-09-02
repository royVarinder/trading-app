import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = await getDb();
  const user = await db
    .collection("users")
    .findOne({ memberId: session.memberId }, { projection: { walletAddress: 1 } });

  return NextResponse.json({ walletAddress: user?.walletAddress ?? "" });
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

  const walletAddress = typeof body.walletAddress === "string" ? body.walletAddress.trim() : "";
  if (!walletAddress) {
    return NextResponse.json({ error: "Enter a wallet address." }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("users").updateOne({ memberId: session.memberId }, { $set: { walletAddress } });

  return NextResponse.json({ walletAddress });
}
