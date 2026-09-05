"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { CardSkeleton } from "@/components/dashboard/shared/Skeleton";

type Overview = {
  pendingDeposits: number;
  pendingWithdrawals: number;
  openTickets: number;
  totalMembers: number;
  totalDepositedApproved: number;
  totalInvested: number;
  totalStaked: number;
  totalBonusPaid: number;
  totalPaidOut: number;
  lastAccrualDate: string | null;
  lastRewardMonth: string | null;
};

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [ranMessage, setRanMessage] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/overview")
      .then((res) => res.json())
      .then((data) => (data.error ? setError(data.error) : setOverview(data)))
      .catch(() => setError("Unable to load dashboard stats."));
  }

  useEffect(load, []);

  async function runAccrual() {
    setRunning(true);
    setRanMessage(null);
    try {
      const res = await fetch("/api/admin/accrue", { method: "POST" });
      if (res.ok) {
        setRanMessage("Accrual run complete.");
        load();
      } else {
        setRanMessage("Accrual run failed.");
      }
    } finally {
      setRunning(false);
      setTimeout(() => setRanMessage(null), 3000);
    }
  }

  const pendingCards = overview
    ? [
        { label: "Pending Deposits", value: overview.pendingDeposits, href: "/admin/deposits" },
        { label: "Pending Withdrawals", value: overview.pendingWithdrawals, href: "/admin/withdrawals" },
        { label: "Open Tickets", value: overview.openTickets, href: "/admin/tickets" },
      ]
    : [];

  const totalsCards = overview
    ? [
        { label: "Total Members", value: overview.totalMembers.toLocaleString() },
        { label: "Total Deposited (Approved)", value: `$${overview.totalDepositedApproved.toFixed(2)}` },
        { label: "Total Invested", value: `$${overview.totalInvested.toFixed(2)}` },
        { label: "Total Staked", value: `$${overview.totalStaked.toFixed(2)}` },
        { label: "Total Bonus/Commission Paid", value: `$${overview.totalBonusPaid.toFixed(2)}` },
        { label: "Total Paid Out (Withdrawals)", value: `$${overview.totalPaidOut.toFixed(2)}` },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="Platform-wide overview and pending action queues." />

      {error && (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {!overview && !error ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : overview ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {pendingCards.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-brand-purple-light hover:shadow-md"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{c.label}</p>
                <p className="mt-2 text-2xl font-bold text-[#1f2430]">{c.value}</p>
                <p className="mt-1 text-xs font-medium text-brand-purple">Review &rarr;</p>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {totalsCards.map((c) => (
              <div key={c.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{c.label}</p>
                <p className="mt-2 text-xl font-bold text-[#1f2430]">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1f2430]">Daily Accrual Engine</h2>
            <p className="mt-2 text-sm text-gray-500">
              Last run:{" "}
              <span className="font-semibold text-[#1f2430]">{overview.lastAccrualDate ?? "never"}</span> ·
              Last monthly reward month:{" "}
              <span className="font-semibold text-[#1f2430]">{overview.lastRewardMonth ?? "never"}</span>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Runs automatically on every member dashboard visit. Use this only if you need to force it now.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button type="button" onClick={runAccrual} className="btn-solid disabled:opacity-70" disabled={running}>
                {running ? "Running..." : "Run Accrual Now"}
              </button>
              {ranMessage && <span className="text-sm font-medium text-emerald-600">{ranMessage}</span>}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
