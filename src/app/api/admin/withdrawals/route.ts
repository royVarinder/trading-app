import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");

  const filter: Record<string, unknown> = {};
  if (status && status !== "All") filter.status = status;
  if (type && type !== "All") filter.type = type;

  const db = await getDb();
  const withdrawals = await db
    .collection("withdrawals")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();

  return NextResponse.json({
    withdrawals: withdrawals.map((w) => ({
      id: w._id.toString(),
      memberId: w.memberId,
      username: w.username,
      type: w.type,
      amount: w.amount,
      adminCharge: w.adminCharge,
      netAmount: w.netAmount,
      status: w.status,
      reviewedBy: w.reviewedBy ?? null,
      reviewedAt: w.reviewedAt ?? null,
      rejectionReason: w.rejectionReason ?? null,
      createdAt: w.createdAt,
    })),
  });
}
