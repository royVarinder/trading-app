import { NextResponse } from "next/server";
import { getPublicSettings } from "@/lib/settings";

// No auth required — this is non-sensitive plan/rate/wallet-address config,
// the same values that used to be hardcoded client-side constants. Consumed
// by DepositFund, StakingId, and InvestmentId so admin-edited rates
// (see /admin/settings) take effect without a redeploy.
export async function GET() {
  const settings = await getPublicSettings();
  return NextResponse.json(settings);
}
