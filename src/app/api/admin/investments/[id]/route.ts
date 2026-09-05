import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";
import { logAdminAction } from "@/lib/audit";

const ALLOWED_STATUSES = new Set(["Active", "Paused", "Closed"]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  const { session } = guard;

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid investment id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (typeof status !== "string" || !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: "status must be Active, Paused, or Closed." }, { status: 400 });
  }

  const db = await getDb();
  const investment = await db.collection("investments").findOne({ _id: new ObjectId(id) });
  if (!investment) {
    return NextResponse.json({ error: "Investment not found." }, { status: 404 });
  }

  await db.collection("investments").updateOne({ _id: investment._id }, { $set: { status } });

  await logAdminAction(db, {
    actor: session.username,
    action: "investment.status",
    target: investment.memberId,
    details: { investmentId: id, from: investment.status, to: status },
  });

  return NextResponse.json({ id, status });
}
