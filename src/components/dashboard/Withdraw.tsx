"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { InfoCard } from "@/components/dashboard/shared/InfoCard";

const MIN_WITHDRAWAL = 10;

type WalletSummary = {
  availableFund: number;
};

const EMPTY_WALLET: WalletSummary = { availableFund: 0 };

export function Withdraw() {
  const [wallet, setWallet] = useState<WalletSummary>(EMPTY_WALLET);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const amount = Number(new FormData(form).get("amount"));

    if (amount < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is $${MIN_WITHDRAWAL}.`);
      return;
    }
    if (amount > wallet.availableFund) {
      setError("Amount exceeds your available wallet balance.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "income", amount }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to submit withdrawal request.");
        return;
      }

      setSubmitted(true);
      form.reset();
      loadWallet();
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Withdraw" subtitle="Request a real-money payout from your wallet balance." />

      <div className="max-w-md">
        <InfoCard
          rows={[
            {
              label: "Available Wallet Balance",
              value: `$${wallet.availableFund.toFixed(2)}`,
              valueClassName: "text-emerald-300",
            },
          ]}
          footer={
            <p className="text-xs text-[color:var(--fincept-text-muted)]">
              Minimum withdrawal ${MIN_WITHDRAWAL}, 5% admin charge applies. Claim profit from Investment
              Withdrawal first if it isn&apos;t in your wallet yet.
            </p>
          }
        />
      </div>

      <div className="max-w-md rounded-2xl border border-[color:var(--fincept-border)] bg-[color:var(--fincept-card)] p-6 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="field-label" htmlFor="withdrawAmount">
              Withdrawal Amount
            </label>
            <input
              id="withdrawAmount"
              name="amount"
              type="number"
              min={MIN_WITHDRAWAL}
              step="0.01"
              placeholder={`Minimum $${MIN_WITHDRAWAL}`}
              className="field-input"
              required
            />
          </div>
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          {submitted && <p className="text-sm font-medium text-emerald-300">Request submitted — pending admin review.</p>}
          <button type="submit" className="btn-solid disabled:opacity-70" disabled={submitting}>
            {submitting ? "Submitting..." : "Request Withdrawal"}
          </button>
        </form>
      </div>
    </div>
  );
}
