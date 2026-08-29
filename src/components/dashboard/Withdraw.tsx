"use client";

import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { InfoCard } from "@/components/dashboard/shared/InfoCard";

const NET_INCOME = 6.75;
const MIN_WITHDRAWAL = 10;

export function Withdraw() {
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const amount = Number(new FormData(form).get("amount"));

    if (amount < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is $${MIN_WITHDRAWAL}.`);
      return;
    }
    if (amount > NET_INCOME) {
      setError("Amount exceeds your available net income.");
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
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Withdraw" subtitle="Request a payout of your available trading income." />

      <div className="max-w-md">
        <InfoCard
          rows={[
            { label: "Total Income", value: "$6.75" },
            { label: "Total Withdrawal", value: "$0" },
            { label: "Net Income", value: `$${NET_INCOME.toFixed(2)}`, valueClassName: "text-emerald-600" },
          ]}
          footer={<p className="text-xs text-gray-400">Minimum withdrawal ${MIN_WITHDRAWAL}</p>}
        />
      </div>

      <div className="max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
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
          {submitted && <p className="text-sm font-medium text-emerald-600">Request submitted — pending admin review.</p>}
          <button type="submit" className="btn-solid disabled:opacity-70" disabled={submitting}>
            {submitting ? "Submitting..." : "Request Withdrawal"}
          </button>
        </form>
      </div>
    </div>
  );
}
