import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";
import { logAdminAction } from "@/lib/audit";
import { getWalletSummary } from "@/lib/accrual";
import { getAvailableFund } from "@/lib/fund";
import { getTeamSnapshot } from "@/lib/team";

export async function GET(_req: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { memberId } = await params;
  const db = await getDb();

  const user = await db.collection("users").findOne({ memberId });
  if (!user) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const [wallet, availableFund, team, deposits, withdrawals, investments, stakes] = await Promise.all([
    getWalletSummary(memberId),
    getAvailableFund(db, memberId),
    getTeamSnapshot(memberId),
    db.collection("deposits").find({ memberId }).sort({ createdAt: -1 }).limit(20).toArray(),
    db.collection("withdrawals").find({ memberId }).sort({ createdAt: -1 }).limit(20).toArray(),
    db.collection("investments").find({ memberId }).sort({ createdAt: -1 }).limit(20).toArray(),
    db.collection("stakes").find({ memberId }).sort({ createdAt: -1 }).limit(20).toArray(),
  ]);

  return NextResponse.json({
    profile: {
      memberId: user.memberId,
      username: user.username,
      email: user.email,
      mobile: `${user.countryCode ?? ""}${user.mobile ?? ""}`,
      sponsorId: user.sponsorId,
      walletAddress: user.walletAddress ?? "",
      status: user.status === "suspended" ? "suspended" : "active",
      createdAt: user.createdAt,
    },
    wallet: { ...wallet, availableFund },
    team: team.summary,
    deposits: deposits.map((d) => ({
      id: d._id.toString(),
      amount: d.amount,
      status: d.status,
      createdAt: d.createdAt,
    })),
    withdrawals: withdrawals.map((w) => ({
      id: w._id.toString(),
      type: w.type,
      amount: w.amount,
      netAmount: w.netAmount,
      status: w.status,
      createdAt: w.createdAt,
    })),
    investments: investments.map((i) => ({
      id: i._id.toString(),
      amount: i.amount,
      status: i.status,
      createdAt: i.createdAt,
    })),
    stakes: stakes.map((s) => ({
      id: s._id.toString(),
      tierId: s.tierId,
      amount: s.amount,
      status: s.status,
      creditedDays: s.creditedDays,
      durationDays: s.durationDays,
      createdAt: s.createdAt,
    })),
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  const { session } = guard;

  const { memberId } = await params;
  const body = await req.json().catch(() => null);
  const action = body?.action;

  const db = await getDb();
  const user = await db.collection("users").findOne({ memberId });
  if (!user) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  if (action === "suspend" || action === "reactivate") {
    const status = action === "suspend" ? "suspended" : "active";
    await db.collection("users").updateOne({ memberId }, { $set: { status } });
    await logAdminAction(db, {
      actor: session.username,
      action: `member.${action}`,
      target: memberId,
    });
    return NextResponse.json({ memberId, status });
  }

  if (action === "adjust") {
    const amount = Number(body?.amount);
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (!Number.isFinite(amount) || amount === 0) {
      return NextResponse.json({ error: "Enter a non-zero adjustment amount." }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ error: "A reason is required for balance adjustments." }, { status: 400 });
    }

    await db.collection("adjustments").insertOne({
      memberId,
      amount,
      reason,
      createdBy: session.username,
      createdAt: new Date(),
    });

    await logAdminAction(db, {
      actor: session.username,
      action: "member.adjust",
      target: memberId,
      details: { amount, reason },
    });

    const availableFund = await getAvailableFund(db, memberId);
    return NextResponse.json({ memberId, availableFund });
  }

  return NextResponse.json(
    { error: "action must be 'suspend', 'reactivate', or 'adjust'." },
    { status: 400 }
  );
}
