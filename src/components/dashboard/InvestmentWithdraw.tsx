"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { InfoCard } from "@/components/dashboard/shared/InfoCard";

type WalletSummary = {
  totalSelfInvestment: number;
  totalCapitalWithdrawal: number;
  netCapital: number;
};

const EMPTY_WALLET: WalletSummary = { totalSelfInvestment: 0, totalCapitalWithdrawal: 0, netCapital: 0 };

export function InvestmentWithdraw() {
  const [wallet, setWallet] = useState<WalletSummary>(EMPTY_WALLET);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function loadWallet() {
    fetch("/api/wallet")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setWallet(data);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadWallet();
  }, []);

  async function claimWallet() {
    setError(null);

    if (wallet.netCapital <= 0) {
      setError("You have no capital available to withdraw right now.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "investment", amount: wallet.netCapital }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to claim wallet.");
        return;
      }

      setClaimed(true);
      loadWallet();
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
            { label: "Total Wallet", value: `$${wallet.totalSelfInvestment.toFixed(2)}` },
            { label: "Total Withdrawal Income", value: `$${wallet.totalCapitalWithdrawal.toFixed(2)}` },
            { label: "Net Wallet Income", value: `$${wallet.netCapital.toFixed(2)}`, valueClassName: "text-emerald-600" },
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
