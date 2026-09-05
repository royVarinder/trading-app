import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";
import { logAdminAction } from "@/lib/audit";

const ALLOWED_STATUSES = new Set(["Active", "Paused", "Completed", "Closed"]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  const { session } = guard;

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid stake id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (typeof status !== "string" || !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json(
      { error: "status must be Active, Paused, Completed, or Closed." },
      { status: 400 }
    );
  }

  const db = await getDb();
  const stake = await db.collection("stakes").findOne({ _id: new ObjectId(id) });
  if (!stake) {
    return NextResponse.json({ error: "Stake not found." }, { status: 404 });
  }

  await db.collection("stakes").updateOne({ _id: stake._id }, { $set: { status } });

  await logAdminAction(db, {
    actor: session.username,
    action: "stake.status",
    target: stake.memberId,
    details: { stakeId: id, from: stake.status, to: status },
  });

  return NextResponse.json({ id, status });
}
