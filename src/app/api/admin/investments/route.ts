import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const status = new URL(req.url).searchParams.get("status");
  const db = await getDb();
  const filter = status && status !== "All" ? { status } : {};
  const investments = await db
    .collection("investments")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();

  return NextResponse.json({
    investments: investments.map((inv) => ({
      id: inv._id.toString(),
      memberId: inv.memberId,
      username: inv.username,
      amount: inv.amount,
      dailyRate: inv.dailyRate,
      status: inv.status,
      createdAt: inv.createdAt,
    })),
  });
}
