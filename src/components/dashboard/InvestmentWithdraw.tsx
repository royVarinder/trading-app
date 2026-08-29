"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { InfoCard } from "@/components/dashboard/shared/InfoCard";

const WALLET_BALANCE = 50;

export function InvestmentWithdraw() {
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function claimWallet() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "investment", amount: WALLET_BALANCE }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to claim wallet.");
        return;
      }

      setClaimed(true);
      setTimeout(() => setClaimed(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Investment Withdrawal Request" subtitle="Claim funds sitting in your investment wallet." />

      <div className="max-w-md">
        <InfoCard
          rows={[
            { label: "Total Wallet", value: `$${WALLET_BALANCE}` },
            { label: "Total Withdrawal Income", value: "$0" },
            { label: "Net Wallet Income", value: `$${WALLET_BALANCE}`, valueClassName: "text-emerald-600" },
          ]}
          footer={
            <div className="flex items-center gap-3">
              <button type="button" onClick={claimWallet} className="btn-solid disabled:opacity-70" disabled={submitting}>
                {submitting ? "Claiming..." : "Claim Wallet"}
              </button>
              {claimed && <span className="text-sm font-medium text-emerald-600">Claim submitted — pending admin review.</span>}
              {error && <span className="text-sm font-medium text-red-500">{error}</span>}
            </div>
          }
        />
      </div>
    </div>
  );
}
