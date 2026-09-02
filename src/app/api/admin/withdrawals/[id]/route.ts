import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";
import { logAdminAction } from "@/lib/audit";
import { sendMail } from "@/lib/mailer";

const TRANSITIONS: Record<string, { from: string; to: string }> = {
  approve: { from: "Pending", to: "Approved" },
  reject: { from: "Pending", to: "Rejected" },
  "mark-paid": { from: "Approved", to: "Paid" },
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  const { session } = guard;

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid withdrawal id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action as string | undefined;
  const transition = action ? TRANSITIONS[action] : undefined;
  if (!transition) {
    return NextResponse.json(
      { error: "action must be 'approve', 'reject', or 'mark-paid'." },
      { status: 400 }
    );
  }
  const rejectionReason = typeof body?.rejectionReason === "string" ? body.rejectionReason.trim() : "";

  const db = await getDb();
  const withdrawal = await db.collection("withdrawals").findOne({ _id: new ObjectId(id) });
  if (!withdrawal) {
    return NextResponse.json({ error: "Withdrawal not found." }, { status: 404 });
  }
  if (withdrawal.status !== transition.from) {
    return NextResponse.json(
      { error: `Withdrawal must be ${transition.from} to ${action}; it is ${withdrawal.status}.` },
      { status: 409 }
    );
  }

  await db.collection("withdrawals").updateOne(
    { _id: withdrawal._id },
    {
      $set: {
        status: transition.to,
        reviewedBy: session.username,
        reviewedAt: new Date(),
        rejectionReason: action === "reject" ? rejectionReason || "Not specified" : withdrawal.rejectionReason ?? null,
      },
    }
  );

  await logAdminAction(db, {
    actor: session.username,
    action: `withdrawal.${action}`,
    target: withdrawal.memberId,
    details: {
      withdrawalId: id,
      type: withdrawal.type,
      amount: withdrawal.amount,
      netAmount: withdrawal.netAmount,
      rejectionReason: rejectionReason || undefined,
    },
  });

  const user = await db.collection("users").findOne({ memberId: withdrawal.memberId });
  if (user?.email) {
    const label = withdrawal.type === "income" ? "Income" : "Investment";
    await sendMail(
      user.email,
      `${label} withdrawal ${transition.to.toLowerCase()} — PRIMEFX`,
      [
        `Your ${label.toLowerCase()} withdrawal request of $${Number(withdrawal.amount).toFixed(2)} is now ${transition.to.toLowerCase()}.`,
        transition.to === "Paid" ? `Net amount sent: $${Number(withdrawal.netAmount).toFixed(2)}.` : "",
        action === "reject" && rejectionReason ? `Reason: ${rejectionReason}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  return NextResponse.json({ id, status: transition.to });
}
