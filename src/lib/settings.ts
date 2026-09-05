import { getDb } from "@/lib/mongodb";
import {
  STARTUP_PLAN as DEFAULT_STARTUP_PLAN,
  STAKING_TIERS as DEFAULT_STAKING_TIERS,
  LEADERSHIP_RANKS as DEFAULT_LEADERSHIP_RANKS,
  type StakingTier,
  type LeadershipRank,
} from "@/lib/plans";

export type PlatformSettings = {
  startupPlan: { min: number; dailyRate: number };
  stakingTiers: StakingTier[];
  leadershipRanks: LeadershipRank[];
  depositWalletAddress: string;
  withdrawalMin: number;
  withdrawalAdminChargeRate: number;
};

// The values src/lib/plans.ts previously hardcoded, now the fallback used
// until an admin overrides them from /admin/settings. Nothing changes for a
// fresh install — this is the same business plan the constants encoded.
export const DEFAULT_SETTINGS: PlatformSettings = {
  startupPlan: { ...DEFAULT_STARTUP_PLAN },
  stakingTiers: DEFAULT_STAKING_TIERS,
  leadershipRanks: DEFAULT_LEADERSHIP_RANKS,
  depositWalletAddress: "0xDEM0A11cCB185545aC41CA8C2772DB579946F6",
  withdrawalMin: 10,
  withdrawalAdminChargeRate: 0.05,
};

const SETTINGS_ID = "platform";
const CACHE_TTL_MS = 5000;

let cache: { value: PlatformSettings; expiresAt: number } | null = null;

type SettingsDoc = { _id: string } & Partial<PlatformSettings>;

export async function getSettings(): Promise<PlatformSettings> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;

  const db = await getDb();
  const doc = await db.collection<SettingsDoc>("settings").findOne({ _id: SETTINGS_ID });

  const value: PlatformSettings = {
    startupPlan: doc?.startupPlan ?? DEFAULT_SETTINGS.startupPlan,
    stakingTiers: doc?.stakingTiers ?? DEFAULT_SETTINGS.stakingTiers,
    leadershipRanks: doc?.leadershipRanks ?? DEFAULT_SETTINGS.leadershipRanks,
    depositWalletAddress: doc?.depositWalletAddress ?? DEFAULT_SETTINGS.depositWalletAddress,
    withdrawalMin: doc?.withdrawalMin ?? DEFAULT_SETTINGS.withdrawalMin,
    withdrawalAdminChargeRate: doc?.withdrawalAdminChargeRate ?? DEFAULT_SETTINGS.withdrawalAdminChargeRate,
  };

  cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}

export async function updateSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
  const db = await getDb();
  await db
    .collection<SettingsDoc>("settings")
    .updateOne({ _id: SETTINGS_ID }, { $set: patch }, { upsert: true });
  cache = null;
  return getSettings();
}

/** Public-safe subset served to unauthenticated/member clients (no secrets in here). */
export type PublicSettings = Pick<
  PlatformSettings,
  "startupPlan" | "stakingTiers" | "depositWalletAddress" | "withdrawalMin" | "withdrawalAdminChargeRate"
>;

export async function getPublicSettings(): Promise<PublicSettings> {
  const { startupPlan, stakingTiers, depositWalletAddress, withdrawalMin, withdrawalAdminChargeRate } =
    await getSettings();
  return { startupPlan, stakingTiers, depositWalletAddress, withdrawalMin, withdrawalAdminChargeRate };
}
