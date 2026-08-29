"use client";

import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";

export function WalletAddress() {
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Wallet Address" subtitle="Used for future withdrawals." />
      <div className="max-w-xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="field-label" htmlFor="walletAddress">
              USDT BEP 20 Wallet Address
            </label>
            <input id="walletAddress" name="walletAddress" type="text" placeholder="Wallet Address" className="field-input" />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-solid">
              Save Wallet Details
            </button>
            <button type="reset" className="btn-outline">
              Reset
            </button>
            {saved && <span className="text-sm font-medium text-emerald-600">Saved (demo only)</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
