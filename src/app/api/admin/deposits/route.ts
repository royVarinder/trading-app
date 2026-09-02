import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const status = new URL(req.url).searchParams.get("status");

  const db = await getDb();
  const filter = status && status !== "All" ? { status } : {};
  const deposits = await db.collection("deposits").find(filter).sort({ createdAt: -1 }).limit(500).toArray();

  return NextResponse.json({
    deposits: deposits.map((d) => ({
      id: d._id.toString(),
      memberId: d.memberId,
      username: d.username,
      amount: d.amount,
      transactionHash: d.transactionHash,
      status: d.status,
      reviewedBy: d.reviewedBy ?? null,
      reviewedAt: d.reviewedAt ?? null,
      rejectionReason: d.rejectionReason ?? null,
      createdAt: d.createdAt,
    })),
  });
}
