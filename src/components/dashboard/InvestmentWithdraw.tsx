"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { InfoCard } from "@/components/dashboard/shared/InfoCard";

type ClaimSummary = {
  totalInvested: number;
  totalStaked: number;
  investmentProfit: number;
  completedStakingProfit: number;
  leadershipProfit: number;
  totalClaimed: number;
  claimable: number;
};

const EMPTY_SUMMARY: ClaimSummary = {
  totalInvested: 0,
  totalStaked: 0,
  investmentProfit: 0,
  completedStakingProfit: 0,
  leadershipProfit: 0,
  totalClaimed: 0,
  claimable: 0,
};

export function InvestmentWithdraw() {
  const [summary, setSummary] = useState<ClaimSummary>(EMPTY_SUMMARY);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch("/api/claims")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setSummary(data);
      })
      .catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  async function claim() {
    setError(null);

    if (summary.claimable <= 0) {
      setError("You have no profit available to claim right now.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/claims", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to claim profit.");
        return;
      }

      setClaimed(true);
      load();
      setTimeout(() => setClaimed(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investment Withdrawal"
        subtitle="Claim your investment, staking, and leadership profit into your wallet — capital stays in place. Once in your wallet, use Withdraw to cash out."
      />

      <div className="max-w-md">
        <InfoCard
          rows={[
            { label: "Total Invested", value: `$${summary.totalInvested.toFixed(2)}` },
            { label: "Total Staking Invested", value: `$${summary.totalStaked.toFixed(2)}` },
            { label: "Investment Profit", value: `$${summary.investmentProfit.toFixed(2)}` },
            {
              label: "Staking Profit (completed only)",
              value: `$${summary.completedStakingProfit.toFixed(2)}`,
            },
            { label: "Leadership Profit", value: `$${summary.leadershipProfit.toFixed(2)}` },
            { label: "Already Claimed", value: `$${summary.totalClaimed.toFixed(2)}` },
            {
              label: "Claimable Now",
              value: `$${summary.claimable.toFixed(2)}`,
              valueClassName: "text-emerald-300",
            },
          ]}
          footer={
            <div className="flex items-center gap-3">
              <button type="button" onClick={claim} className="btn-solid disabled:opacity-70" disabled={submitting}>
                {submitting ? "Claiming..." : "Claim to Wallet"}
              </button>
              {claimed && <span className="text-sm font-medium text-emerald-300">Claimed — added to your wallet.</span>}
              {error && <span className="text-sm font-medium text-red-500">{error}</span>}
            </div>
          }
        />
      </div>
    </div>
  );
}
