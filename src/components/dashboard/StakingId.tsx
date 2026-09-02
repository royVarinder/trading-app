"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { STAKING_TIERS as FALLBACK_STAKING_TIERS, type StakingTier } from "@/lib/plans";

export function StakingId({ memberId }: { memberId: string }) {
  const [availableFund, setAvailableFund] = useState<number | null>(null);
  const [tiers, setTiers] = useState<StakingTier[]>(FALLBACK_STAKING_TIERS);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/investments")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.error) setAvailableFund(data.availableFund ?? 0);
      })
      .catch(() => {});

    fetch("/api/settings/public")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.stakingTiers)) setTiers(data.stakingTiers);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const tierId = String(formData.get("tierId") ?? "");
    const amount = Number(formData.get("stakingAmount"));

    setSubmitting(true);
    try {
      const res = await fetch("/api/stakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId, amount }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to submit staking request.");
        return;
      }

      setSaved(true);
      form.reset();
      setAvailableFund((prev) => (prev ?? 0) - amount);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Staking ID" subtitle="Lock funds into a staking plan for a fixed term." />

      <div className="max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label className="field-label">User Id</label>
            <input value={memberId} disabled className="field-input" />
          </div>
          <div>
            <label className="field-label">Fund</label>
            <input
              value={availableFund === null ? "Loading…" : `$${availableFund.toFixed(2)}`}
              disabled
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Member ID</label>
            <input value={memberId} disabled className="field-input" />
          </div>
          <div>
            <label className="field-label" htmlFor="tierId">
              Staking Plan
            </label>
            <select id="tierId" name="tierId" className="field-input" required defaultValue="">
              <option value="" disabled>
                Select Plan
              </option>
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.label} — {(tier.dailyRate * 100).toFixed(1)}%/day, {tier.durationDays} days
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="stakingAmount">
              Staking Amount
            </label>
            <input
              id="stakingAmount"
              name="stakingAmount"
              type="number"
              min={200}
              step="1"
              placeholder="Enter Staking Amount (must meet the selected plan's minimum)"
              className="field-input"
              required
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button type="submit" className="btn-solid disabled:opacity-70" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <button type="reset" className="btn-outline" disabled={submitting}>
              Reset
            </button>
            {saved && <span className="text-sm font-medium text-emerald-600">Staking plan created.</span>}
          </div>
          {error && <p className="text-sm font-medium text-red-500 sm:col-span-2">{error}</p>}
        </form>
      </div>
    </div>
  );
}
