import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const status = new URL(req.url).searchParams.get("status");
  const db = await getDb();
  const filter = status && status !== "All" ? { status } : {};
  const stakes = await db.collection("stakes").find(filter).sort({ createdAt: -1 }).limit(500).toArray();

  return NextResponse.json({
    stakes: stakes.map((s) => ({
      id: s._id.toString(),
      memberId: s.memberId,
      username: s.username,
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
