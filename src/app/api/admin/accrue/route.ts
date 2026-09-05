import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";
import { runDailyAccrual } from "@/lib/accrual";
import { logAdminAction } from "@/lib/audit";

// Manual fallback for the daily accrual job — it normally runs lazily on
// every member dashboard visit (see src/app/page.tsx), but an admin may want
// to force it (e.g. right after fixing a stuck position) without waiting for
// a member to load the dashboard.
export async function POST() {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  const { session } = guard;

  await runDailyAccrual();

  const db = await getDb();
  await logAdminAction(db, { actor: session.username, action: "accrual.manual-run" });

  return NextResponse.json({ ok: true });
}
