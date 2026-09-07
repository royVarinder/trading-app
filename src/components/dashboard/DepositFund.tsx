"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";

const FALLBACK_WALLET_ADDRESS = "0xDEM0A11cCB185545aC41CA8C2772DB579946F6";
const MIN_DEPOSIT_AMOUNT = 50;

export function DepositFund() {
  const [walletAddress, setWalletAddress] = useState(FALLBACK_WALLET_ADDRESS);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings/public")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.depositWalletAddress) setWalletAddress(data.depositWalletAddress);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore silently
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Capture the form element before the first await — React nulls out
    // e.currentTarget once the synchronous dispatch phase ends, so it can't
    // be read again after an `await`.
    const form = e.currentTarget;
    const formData = new FormData(form);
    const amount = Number(formData.get("fundAmount"));
    const transactionHash = String(formData.get("txHash") ?? "").trim();

    if (!Number.isFinite(amount) || amount < MIN_DEPOSIT_AMOUNT) {
      setError(`Minimum deposit amount is $${MIN_DEPOSIT_AMOUNT}.`);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, transactionHash }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to submit deposit request.");
        return;
      }

      setSaved(true);
      form.reset();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Deposit Fund" subtitle="Send USDT (BEP20) to the address below, then log your transaction." />

      <div className="max-w-md rounded-2xl border border-[color:var(--fincept-border)] bg-[color:var(--fincept-card)] p-6 shadow-sm">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-[color:var(--fincept-text-muted)]">
          Scan QR Code
        </p>
        <div className="mt-4 flex justify-center">
          <Image src="/dummy-qr.svg" alt="Deposit QR code" width={160} height={160} className="rounded-xl" />
        </div>
        <p className="mt-4 text-center text-xs font-semibold uppercase tracking-wide text-[color:var(--fincept-text-muted)]">
          USDT.BEP20
        </p>
        <button
          type="button"
          onClick={copyAddress}
          className="mt-2 w-full truncate rounded-xl bg-[color:var(--fincept-bg-soft)] px-3 py-2.5 text-center font-mono text-xs text-[color:var(--fincept-text-muted)] transition hover:bg-white/5"
          title="Click to copy"
        >
          {copied ? "Copied to clipboard!" : walletAddress}
        </button>
      </div>

      <div className="max-w-2xl rounded-2xl border border-[color:var(--fincept-border)] bg-[color:var(--fincept-card)] p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[color:var(--fincept-text)]">Create Fund Request</h2>
        <form className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label className="field-label" htmlFor="fundAmount">
              Fund Amount (min {`$${MIN_DEPOSIT_AMOUNT}`})
            </label>
            <input
              id="fundAmount"
              name="fundAmount"
              type="number"
              min={MIN_DEPOSIT_AMOUNT}
              step="0.01"
              placeholder={`Enter Fund Amount (min $${MIN_DEPOSIT_AMOUNT})`}
              className="field-input"
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="txHash">
              Transaction Hash
            </label>
            <input id="txHash" name="txHash" type="text" placeholder="Enter your transaction hash" className="field-input" required />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button type="submit" className="btn-solid disabled:opacity-70" disabled={submitting}>
              {submitting ? "Saving..." : "Save Details"}
            </button>
            <button type="reset" className="btn-outline" disabled={submitting}>
              Reset
            </button>
            {saved && <span className="text-sm font-medium text-emerald-300">Request submitted — pending admin review.</span>}
          </div>
          {error && <p className="text-sm font-medium text-red-500 sm:col-span-2">{error}</p>}
        </form>
      </div>
    </div>
  );
}
