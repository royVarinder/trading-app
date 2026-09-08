"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { CardSkeleton } from "@/components/dashboard/shared/Skeleton";

type StakingTier = { id: string; label: string; min: number; dailyRate: number; durationDays: number };
type LeadershipRank = {
  level: number;
  rank: string;
  commissionPct: number;
  selfInvestment: number;
  directBusiness: number;
  teamBusiness: number;
  monthlyReward: number;
};
type Settings = {
  startupPlan: { min: number; ratePct: number; intervalHours: number };
  stakingTiers: StakingTier[];
  leadershipRanks: LeadershipRank[];
  depositWalletAddress: string;
  withdrawalMin: number;
  withdrawalAdminChargeRate: number;
};

// Displaying a stored decimal rate (e.g. 0.007) as a percentage via `* 100`
// hits binary floating-point error (0.007 * 100 === 7.000000000000001) —
// round the *display* value only; the stored decimal round-trips through
// the same `/ 100` conversion on change, so precision isn't lost.
function toPercentDisplay(rate: number): number {
  return Math.round(rate * 100 * 1e6) / 1e6;
}

// The investment income interval is always stored/sent as fractional hours
// (matches PlatformSettings.startupPlan.intervalHours and the accrual
// engine's math in src/lib/accrual.ts) — this is purely a display/input
// convenience so an admin can type "30" + "Minutes" instead of computing
// 0.5 hours by hand. Converting through hours both ways keeps the stored
// value exact regardless of which unit is currently selected.
type IntervalUnit = "minutes" | "hours" | "days";
const UNIT_TO_HOURS: Record<IntervalUnit, number> = { minutes: 1 / 60, hours: 1, days: 24 };
function toUnitDisplay(intervalHours: number, unit: IntervalUnit): number {
  return Math.round((intervalHours / UNIT_TO_HOURS[unit]) * 1e6) / 1e6;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>("hours");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => (data.error ? setError(data.error) : setSettings(data)))
      .catch(() => setError("Unable to load settings."));
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setSaveError(null);
    setForbidden(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) setForbidden(true);
        setSaveError(data.error ?? "Unable to save settings.");
        return;
      }
      setSettings(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" subtitle="Plan rates, ranks, and platform configuration." />
        <p className="rounded-2xl border border-red-100 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
          {error}
        </p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" subtitle="Plan rates, ranks, and platform configuration." />
        <CardSkeleton lines={5} />
      </div>
    );
  }

  function updateTier(index: number, patch: Partial<StakingTier>) {
    setSettings((prev) => {
      if (!prev) return prev;
      const stakingTiers = prev.stakingTiers.map((t, i) => (i === index ? { ...t, ...patch } : t));
      return { ...prev, stakingTiers };
    });
  }

  function updateRank(index: number, patch: Partial<LeadershipRank>) {
    setSettings((prev) => {
      if (!prev) return prev;
      const leadershipRanks = prev.leadershipRanks.map((r, i) => (i === index ? { ...r, ...patch } : r));
      return { ...prev, leadershipRanks };
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Plan rates, ranks, and platform configuration — takes effect immediately." />

      {forbidden && (
        <p className="rounded-2xl border border-amber-100 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700">
          Only super admins can edit settings. You can still view the current configuration below.
        </p>
      )}

      <div className="rounded-2xl border border-[color:var(--fincept-border)] bg-[color:var(--fincept-card)] p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[color:var(--fincept-text)]">General</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="field-label">Deposit Wallet Address</label>
            <input
              className="field-input"
              value={settings.depositWalletAddress}
              onChange={(e) => setSettings({ ...settings, depositWalletAddress: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Withdrawal Minimum ($)</label>
            <input
              type="number"
              className="field-input"
              value={settings.withdrawalMin}
              onChange={(e) => setSettings({ ...settings, withdrawalMin: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="field-label">Withdrawal Admin Charge (%)</label>
            <input
              type="number"
              step="0.1"
              className="field-input"
              value={toPercentDisplay(settings.withdrawalAdminChargeRate)}
              onChange={(e) =>
                setSettings({ ...settings, withdrawalAdminChargeRate: Number(e.target.value) / 100 })
              }
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--fincept-border)] bg-[color:var(--fincept-card)] p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[color:var(--fincept-text)]">Investment Plan</h2>
        <p className="mt-1 text-xs text-[color:var(--fincept-text-muted)]">
          No package tiers — this single rate/interval applies to whatever amount a member moves from wallet into
          an investment. Profit starts the moment the investment is created.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="field-label">Minimum ($)</label>
            <input
              type="number"
              className="field-input"
              value={settings.startupPlan.min}
              onChange={(e) =>
                setSettings({ ...settings, startupPlan: { ...settings.startupPlan, min: Number(e.target.value) } })
              }
            />
          </div>
          <div>
            <label className="field-label">Rate per interval (%)</label>
            <input
              type="number"
              step="0.01"
              className="field-input"
              value={settings.startupPlan.ratePct}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  startupPlan: { ...settings.startupPlan, ratePct: Number(e.target.value) },
                })
              }
            />
          </div>
          <div>
            <label className="field-label">Interval</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="field-input"
                value={toUnitDisplay(settings.startupPlan.intervalHours, intervalUnit)}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    startupPlan: {
                      ...settings.startupPlan,
                      intervalHours: Number(e.target.value) * UNIT_TO_HOURS[intervalUnit],
                    },
                  })
                }
              />
              <select
                className="field-input w-auto"
                value={intervalUnit}
                onChange={(e) => setIntervalUnit(e.target.value as IntervalUnit)}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
            <p className="mt-1 text-[11px] text-[color:var(--fincept-text-muted)]">
              e.g. 24 hours for daily, 1 hour for hourly, 1 minute for quick testing.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--fincept-border)] bg-[color:var(--fincept-card)] p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[color:var(--fincept-text)]">Staking Tiers</h2>
        <table className="mt-4 w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-wide text-[color:var(--fincept-text-muted)]">
              <th className="px-2 py-2">Label</th>
              <th className="px-2 py-2">Min ($)</th>
              <th className="px-2 py-2">Daily Rate (%)</th>
              <th className="px-2 py-2">Duration (days)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--fincept-border)]">
            {settings.stakingTiers.map((tier, i) => (
              <tr key={tier.id}>
                <td className="px-2 py-2">
                  <input
                    className="field-input"
                    value={tier.label}
                    onChange={(e) => updateTier(i, { label: e.target.value })}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    className="field-input"
                    value={tier.min}
                    onChange={(e) => updateTier(i, { min: Number(e.target.value) })}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    step="0.01"
                    className="field-input"
                    value={toPercentDisplay(tier.dailyRate)}
                    onChange={(e) => updateTier(i, { dailyRate: Number(e.target.value) / 100 })}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    className="field-input"
                    value={tier.durationDays}
                    onChange={(e) => updateTier(i, { durationDays: Number(e.target.value) })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--fincept-border)] bg-[color:var(--fincept-card)] p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[color:var(--fincept-text)]">Leadership Ranks</h2>
        <table className="mt-4 w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-wide text-[color:var(--fincept-text-muted)]">
              <th className="px-2 py-2">Rank</th>
              <th className="px-2 py-2">Commission (%)</th>
              <th className="px-2 py-2">Self Inv. ($)</th>
              <th className="px-2 py-2">Direct Biz. ($)</th>
              <th className="px-2 py-2">Team Biz. ($)</th>
              <th className="px-2 py-2">Monthly Reward ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--fincept-border)]">
            {settings.leadershipRanks.map((rank, i) => (
              <tr key={rank.level}>
                <td className="px-2 py-2">
                  <input
                    className="field-input"
                    value={rank.rank}
                    onChange={(e) => updateRank(i, { rank: e.target.value })}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    className="field-input"
                    value={rank.commissionPct}
                    onChange={(e) => updateRank(i, { commissionPct: Number(e.target.value) })}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    className="field-input"
                    value={rank.selfInvestment}
                    onChange={(e) => updateRank(i, { selfInvestment: Number(e.target.value) })}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    className="field-input"
                    value={rank.directBusiness}
                    onChange={(e) => updateRank(i, { directBusiness: Number(e.target.value) })}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    className="field-input"
                    value={rank.teamBusiness}
                    onChange={(e) => updateRank(i, { teamBusiness: Number(e.target.value) })}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    className="field-input"
                    value={rank.monthlyReward}
                    onChange={(e) => updateRank(i, { monthlyReward: Number(e.target.value) })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className="btn-solid disabled:opacity-70" disabled={saving} onClick={save}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {saved && <span className="text-sm font-medium text-emerald-300">Settings saved.</span>}
        {saveError && <span className="text-sm font-medium text-red-500">{saveError}</span>}
      </div>
    </div>
  );
}
