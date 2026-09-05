"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { InfoCard } from "@/components/dashboard/shared/InfoCard";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { CardSkeleton } from "@/components/dashboard/shared/Skeleton";

type Detail = {
  profile: {
    memberId: string;
    username: string;
    email: string;
    mobile: string;
    sponsorId: string | null;
    walletAddress: string;
    status: string;
    createdAt: string;
  };
  wallet: {
    rank: string;
    totalSelfInvestment: number;
    totalIncome: number;
    netIncome: number;
    netCapital: number;
    availableFund: number;
  };
  team: { totalDirect: number; totalTeam: number; directBusiness: number; teamBusiness: number };
  deposits: { id: string; amount: number; status: string; createdAt: string }[];
  withdrawals: { id: string; type: string; amount: number; netAmount: number; status: string; createdAt: string }[];
  investments: { id: string; amount: number; status: string; createdAt: string }[];
  stakes: { id: string; tierId: string; amount: number; status: string; createdAt: string }[];
};

export default function AdminMemberDetailPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = use(params);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSaved, setAdjustSaved] = useState(false);
  const [adjusting, setAdjusting] = useState(false);

  function load() {
    fetch(`/api/admin/members/${memberId}`)
      .then((res) => res.json())
      .then((data) => (data.error ? setError(data.error) : setDetail(data)))
      .catch(() => setError("Unable to load member."));
  }

  useEffect(load, [memberId]);

  async function toggleStatus() {
    if (!detail) return;
    setStatusBusy(true);
    try {
      const action = detail.profile.status === "suspended" ? "reactivate" : "suspend";
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) load();
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleAdjust(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAdjustError(null);
    setAdjusting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const amount = Number(formData.get("amount"));
    const reason = String(formData.get("reason") ?? "").trim();

    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "adjust", amount, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdjustError(data.error ?? "Unable to apply adjustment.");
        return;
      }
      form.reset();
      setAdjustSaved(true);
      setTimeout(() => setAdjustSaved(false), 2500);
      load();
    } catch {
      setAdjustError("Something went wrong. Please try again.");
    } finally {
      setAdjusting(false);
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Member" subtitle={memberId} />
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-6">
        <PageHeader title="Member" subtitle={memberId} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const { profile, wallet, team } = detail;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={profile.username} subtitle={`${profile.memberId} · ${profile.email}`} />
        <Link href="/admin/members" className="text-sm font-semibold text-brand-purple hover:underline">
          &larr; Back to members
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <InfoCard
          title="Profile"
          rows={[
            { label: "Member ID", value: profile.memberId },
            { label: "Mobile", value: profile.mobile },
            { label: "Sponsor ID", value: profile.sponsorId ?? "—" },
            { label: "Wallet Address", value: profile.walletAddress || "—" },
            { label: "Joined", value: new Date(profile.createdAt).toLocaleDateString() },
            { label: "Status", value: <StatusBadge status={profile.status} /> },
          ]}
          footer={
            <button
              type="button"
              onClick={toggleStatus}
              disabled={statusBusy}
              className={profile.status === "suspended" ? "btn-solid" : "btn-outline"}
            >
              {statusBusy ? "Updating..." : profile.status === "suspended" ? "Reactivate Account" : "Suspend Account"}
            </button>
          }
        />

        <InfoCard
          title="Wallet"
          rows={[
            { label: "Rank", value: wallet.rank },
            { label: "Total Self Investment", value: `$${wallet.totalSelfInvestment.toFixed(2)}` },
            { label: "Total Income", value: `$${wallet.totalIncome.toFixed(2)}` },
            { label: "Net Income (withdrawable)", value: `$${wallet.netIncome.toFixed(2)}`, valueClassName: "text-emerald-600" },
            { label: "Net Capital (withdrawable)", value: `$${wallet.netCapital.toFixed(2)}`, valueClassName: "text-emerald-600" },
            { label: "Available Fund", value: `$${wallet.availableFund.toFixed(2)}` },
          ]}
        />

        <InfoCard
          title="Team"
          rows={[
            { label: "Total Direct", value: team.totalDirect },
            { label: "Total Team", value: team.totalTeam },
            { label: "Direct Business", value: `$${team.directBusiness.toFixed(2)}` },
            { label: "Team Business", value: `$${team.teamBusiness.toFixed(2)}` },
          ]}
        />
      </div>

      <div className="max-w-xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1f2430]">Adjust Available Fund</h2>
        <p className="mt-1 text-xs text-gray-500">
          Manually credit or debit this member&apos;s available fund balance (dispute resolution). Logged to the audit
          trail.
        </p>
        <form className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleAdjust}>
          <div>
            <label className="field-label" htmlFor="amount">
              Amount (negative to debit)
            </label>
            <input id="amount" name="amount" type="number" step="0.01" placeholder="e.g. 50 or -50" className="field-input" required />
          </div>
          <div>
            <label className="field-label" htmlFor="reason">
              Reason
            </label>
            <input id="reason" name="reason" type="text" placeholder="Required" className="field-input" required />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button type="submit" className="btn-solid disabled:opacity-70" disabled={adjusting}>
              {adjusting ? "Applying..." : "Apply Adjustment"}
            </button>
            {adjustSaved && <span className="text-sm font-medium text-emerald-600">Adjustment applied.</span>}
          </div>
          {adjustError && <p className="text-sm font-medium text-red-500 sm:col-span-2">{adjustError}</p>}
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[#1f2430]">Recent Deposits</h2>
          <DataTable
            columns={[
              { key: "amount", label: "Amount" },
              { key: "status", label: "Status" },
              { key: "date", label: "Date" },
            ]}
            rows={detail.deposits.map((d) => ({
              amount: `$${d.amount.toFixed(2)}`,
              status: <StatusBadge status={d.status} />,
              date: new Date(d.createdAt).toLocaleDateString(),
            }))}
            emptyMessage="No deposits yet."
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[#1f2430]">Recent Withdrawals</h2>
          <DataTable
            columns={[
              { key: "type", label: "Type" },
              { key: "amount", label: "Net Amount" },
              { key: "status", label: "Status" },
              { key: "date", label: "Date" },
            ]}
            rows={detail.withdrawals.map((w) => ({
              type: <span className="capitalize">{w.type}</span>,
              amount: `$${w.netAmount.toFixed(2)}`,
              status: <StatusBadge status={w.status} />,
              date: new Date(w.createdAt).toLocaleDateString(),
            }))}
            emptyMessage="No withdrawals yet."
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[#1f2430]">Investment Positions</h2>
          <DataTable
            columns={[
              { key: "amount", label: "Amount" },
              { key: "status", label: "Status" },
              { key: "date", label: "Date" },
            ]}
            rows={detail.investments.map((i) => ({
              amount: `$${i.amount.toFixed(2)}`,
              status: <StatusBadge status={i.status} />,
              date: new Date(i.createdAt).toLocaleDateString(),
            }))}
            emptyMessage="No investment positions yet."
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[#1f2430]">Staking Positions</h2>
          <DataTable
            columns={[
              { key: "tier", label: "Tier" },
              { key: "amount", label: "Amount" },
              { key: "status", label: "Status" },
              { key: "date", label: "Date" },
            ]}
            rows={detail.stakes.map((s) => ({
              tier: s.tierId,
              amount: `$${s.amount.toFixed(2)}`,
              status: <StatusBadge status={s.status} />,
              date: new Date(s.createdAt).toLocaleDateString(),
            }))}
            emptyMessage="No staking positions yet."
          />
        </div>
      </div>
    </div>
  );
}
