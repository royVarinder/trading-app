import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin, requireSuperAdmin } from "@/lib/adminGuard";
import { getSettings, updateSettings, type PlatformSettings } from "@/lib/settings";
import { logAdminAction } from "@/lib/audit";

export async function GET() {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const guard = await requireSuperAdmin();
  if ("response" in guard) return guard.response;
  const { session } = guard;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const patch: Partial<PlatformSettings> = {};

  if (body.startupPlan) {
    const min = Number(body.startupPlan.min);
    const dailyRate = Number(body.startupPlan.dailyRate);
    if (!Number.isFinite(min) || min <= 0 || !Number.isFinite(dailyRate) || dailyRate <= 0) {
      return NextResponse.json({ error: "Invalid startup plan values." }, { status: 400 });
    }
    patch.startupPlan = { min, dailyRate };
  }

  if (Array.isArray(body.stakingTiers)) {
    patch.stakingTiers = body.stakingTiers.map((t: Record<string, unknown>) => ({
      id: String(t.id),
      label: String(t.label),
      min: Number(t.min),
      dailyRate: Number(t.dailyRate),
      durationDays: Number(t.durationDays),
    }));
  }

  if (Array.isArray(body.leadershipRanks)) {
    patch.leadershipRanks = body.leadershipRanks.map((r: Record<string, unknown>) => ({
      level: Number(r.level),
      rank: String(r.rank),
      commissionPct: Number(r.commissionPct),
      selfInvestment: Number(r.selfInvestment),
      directBusiness: Number(r.directBusiness),
      teamBusiness: Number(r.teamBusiness),
      monthlyReward: Number(r.monthlyReward),
    }));
  }

  if (typeof body.depositWalletAddress === "string" && body.depositWalletAddress.trim()) {
    patch.depositWalletAddress = body.depositWalletAddress.trim();
  }

  if (body.withdrawalMin !== undefined) {
    const withdrawalMin = Number(body.withdrawalMin);
    if (!Number.isFinite(withdrawalMin) || withdrawalMin < 0) {
      return NextResponse.json({ error: "Invalid withdrawal minimum." }, { status: 400 });
    }
    patch.withdrawalMin = withdrawalMin;
  }

  if (body.withdrawalAdminChargeRate !== undefined) {
    const rate = Number(body.withdrawalAdminChargeRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
      return NextResponse.json({ error: "Withdrawal admin charge rate must be between 0 and 1." }, { status: 400 });
    }
    patch.withdrawalAdminChargeRate = rate;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid settings provided." }, { status: 400 });
  }

  const updated = await updateSettings(patch);

  const db = await getDb();
  await logAdminAction(db, {
    actor: session.username,
    action: "settings.update",
    details: { patchKeys: Object.keys(patch) },
  });

  return NextResponse.json(updated);
}
