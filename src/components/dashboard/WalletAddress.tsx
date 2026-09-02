"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";

export function WalletAddress() {
  const [walletAddress, setWalletAddress] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/wallet-address")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setLoadError(data.error);
        } else {
          setWalletAddress(data.walletAddress ?? "");
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("Unable to load your wallet address.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);

    const address = String(new FormData(e.currentTarget).get("walletAddress") ?? "").trim();

    try {
      const res = await fetch("/api/wallet-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.error ?? "Unable to save wallet address.");
        return;
      }

      setWalletAddress(data.walletAddress);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Wallet Address" subtitle="Used for future withdrawals." />
      <div className="max-w-xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {loadError ? (
          <p className="text-sm font-medium text-red-500">{loadError}</p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="field-label" htmlFor="walletAddress">
                USDT BEP 20 Wallet Address
              </label>
              <input
                id="walletAddress"
                name="walletAddress"
                type="text"
                defaultValue={walletAddress}
                key={walletAddress}
                placeholder="Wallet Address"
                className="field-input"
              />
            </div>
            {saveError && <p className="text-sm font-medium text-red-500">{saveError}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-solid disabled:opacity-70" disabled={saving}>
                {saving ? "Saving..." : "Save Wallet Details"}
              </button>
              {saved && <span className="text-sm font-medium text-emerald-600">Wallet address saved.</span>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
