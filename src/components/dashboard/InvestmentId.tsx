"use client";

import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";

export function InvestmentId({ memberId }: { memberId: string }) {
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(true);
    e.currentTarget.reset();
    setTimeout(() => setSaved(false), 2500);
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
            <input value="$128.40" disabled className="field-input" />
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
            <button type="submit" className="btn-solid">
              Submit
            </button>
            <button type="reset" className="btn-outline">
              Reset
            </button>
            {saved && <span className="text-sm font-medium text-emerald-600">Submitted (demo only)</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
