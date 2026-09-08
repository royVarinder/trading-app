import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";
import { logAdminAction } from "@/lib/audit";
import { sendMail } from "@/lib/mailer";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  const { session } = guard;

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid deposit id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'." }, { status: 400 });
  }
  const rejectionReason = typeof body?.rejectionReason === "string" ? body.rejectionReason.trim() : "";

  const db = await getDb();
  const deposit = await db.collection("deposits").findOne({ _id: new ObjectId(id) });
  if (!deposit) {
    return NextResponse.json({ error: "Deposit not found." }, { status: 404 });
  }
  if (deposit.status !== "Pending") {
    return NextResponse.json({ error: `Deposit is already ${deposit.status}.` }, { status: 409 });
  }

  const newStatus = action === "approve" ? "Approved" : "Rejected";
  const reviewedAt = new Date();
  const setFields: Record<string, unknown> = {
    status: newStatus,
    reviewedBy: session.username,
    reviewedAt,
    rejectionReason: action === "reject" ? rejectionReason || "Not specified" : null,
  };
  if (action === "approve") {
    // Anchors deposit-income accrual (src/lib/accrual.ts#runDepositIncomeAccrual) —
    // this deposit starts earning from the moment it's approved, not from
    // when it was originally submitted.
    setFields.depositIncomeStartAt = reviewedAt;
    setFields.creditedIntervals = 0;
  }
  await db.collection("deposits").updateOne({ _id: deposit._id }, { $set: setFields });

  await logAdminAction(db, {
    actor: session.username,
    action: `deposit.${action}`,
    target: deposit.memberId,
    details: { depositId: id, amount: deposit.amount, rejectionReason: rejectionReason || undefined },
  });

  const user = await db.collection("users").findOne({ memberId: deposit.memberId });
  if (user?.email) {
    await sendMail(
      user.email,
      `Deposit ${newStatus.toLowerCase()} — PRIMEFX`,
      [
        `Your deposit request of $${Number(deposit.amount).toFixed(2)} has been ${newStatus.toLowerCase()}.`,
        action === "reject" && rejectionReason ? `Reason: ${rejectionReason}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  return NextResponse.json({ id, status: newStatus });
}
