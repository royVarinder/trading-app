import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getWalletSummary } from "@/lib/accrual";
import { getDb } from "@/lib/mongodb";
import { getAvailableFund } from "@/lib/fund";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = await getDb();
  const [summary, availableFund] = await Promise.all([
    getWalletSummary(session.memberId),
    getAvailableFund(db, session.memberId),
  ]);

  return NextResponse.json({ ...summary, availableFund });
}
