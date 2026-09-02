"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";

export function InvestmentId({ memberId }: { memberId: string }) {
  const [availableFund, setAvailableFund] = useState<number | null>(null);
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

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const amount = Number(new FormData(form).get("investmentPackage"));

    setSubmitting(true);
    try {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to submit investment.");
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
      <PageHeader title="Investment ID" subtitle="Move available balance into a new investment package." />

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
            <label className="field-label" htmlFor="investmentPackage">
              Investment Package
            </label>
            <input
              id="investmentPackage"
              name="investmentPackage"
              type="number"
              min={50}
              step="1"
              placeholder="Min Package $50"
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
            {saved && <span className="text-sm font-medium text-emerald-600">Investment package created.</span>}
          </div>
          {error && <p className="text-sm font-medium text-red-500 sm:col-span-2">{error}</p>}
        </form>
      </div>
    </div>
  );
}
