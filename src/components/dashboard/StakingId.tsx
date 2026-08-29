"use client";

import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";

export function StakingId({ memberId }: { memberId: string }) {
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(true);
    e.currentTarget.reset();
    setTimeout(() => setSaved(false), 2500);
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
            <input value="$128.40" disabled className="field-input" />
          </div>
          <div>
            <label className="field-label">Member ID</label>
            <input value={memberId} disabled className="field-input" />
          </div>
          <div>
            <label className="field-label" htmlFor="stakingDays">
              Select Days
            </label>
            <select id="stakingDays" name="stakingDays" className="field-input" required defaultValue="">
              <option value="" disabled>
                Select Days
              </option>
              <option value="50">50 Days</option>
              <option value="100">100 Days</option>
              <option value="200">200 Days</option>
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
              min={50}
              step="1"
              placeholder="Enter Staking Amount"
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
