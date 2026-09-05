"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { InfoCard } from "@/components/dashboard/shared/InfoCard";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { CardSkeleton } from "@/components/dashboard/shared/Skeleton";

type LedgerData = {
  totals: { totalBonus: number; totalLeadership: number; totalReward: number };
  rankDistribution: { rank: string; count: number }[];
  bonus: { memberId: string; positionType: string; principal: number; income: number; date: string }[];
  leadership: {
    beneficiaryMemberId: string;
    beneficiaryRank: string;
    sourceUsername: string;
    level: number;
    income: number;
    date: string;
  }[];
  reward: { memberId: string; rank: string; amount: number; month: string }[];
};

const TABS = ["bonus", "leadership", "reward"] as const;

export default function AdminLedgerPage() {
  const [data, setData] = useState<LedgerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("bonus");

  useEffect(() => {
    fetch("/api/admin/ledger")
      .then((res) => res.json())
      .then((d) => (d.error ? setError(d.error) : setData(d)))
      .catch(() => setError("Unable to load ledger."));
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ledger" subtitle="Platform-wide bonus, commission, and reward payouts." />
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ledger" subtitle="Platform-wide bonus, commission, and reward payouts." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ledger" subtitle="Platform-wide bonus, commission, and reward payouts." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Total Trading Bonus Paid</p>
          <p className="mt-2 text-xl font-bold text-[#1f2430]">${data.totals.totalBonus.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Total Leadership Commission</p>
          <p className="mt-2 text-xl font-bold text-[#1f2430]">${data.totals.totalLeadership.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Total Monthly Rewards</p>
          <p className="mt-2 text-xl font-bold text-[#1f2430]">${data.totals.totalReward.toFixed(2)}</p>
        </div>
      </div>

      <InfoCard
        title="Rank Distribution"
        rows={data.rankDistribution.map((r) => ({ label: r.rank, value: r.count }))}
      />

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
              tab === t ? "bg-brand-purple text-white" : "bg-white text-gray-500 hover:bg-gray-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "bonus" && (
        <DataTable
          columns={[
            { key: "member", label: "Member" },
            { key: "type", label: "Position" },
            { key: "principal", label: "Principal" },
            { key: "income", label: "Income" },
            { key: "date", label: "Date" },
          ]}
          rows={data.bonus.map((b) => ({
            member: b.memberId,
            type: <span className="capitalize">{b.positionType}</span>,
            principal: `$${b.principal.toFixed(2)}`,
            income: `$${b.income.toFixed(2)}`,
            date: b.date,
          }))}
          emptyMessage="No trading bonus entries yet."
        />
      )}

      {tab === "leadership" && (
        <DataTable
          columns={[
            { key: "beneficiary", label: "Beneficiary" },
            { key: "rank", label: "Rank" },
            { key: "source", label: "Source" },
            { key: "level", label: "Level" },
            { key: "income", label: "Income" },
            { key: "date", label: "Date" },
          ]}
          rows={data.leadership.map((l) => ({
            beneficiary: l.beneficiaryMemberId,
            rank: l.beneficiaryRank,
            source: l.sourceUsername,
            level: l.level,
            income: `$${l.income.toFixed(2)}`,
            date: l.date,
          }))}
          emptyMessage="No leadership commission entries yet."
        />
      )}

      {tab === "reward" && (
        <DataTable
          columns={[
            { key: "member", label: "Member" },
            { key: "rank", label: "Rank" },
            { key: "amount", label: "Amount" },
            { key: "month", label: "Month" },
          ]}
          rows={data.reward.map((r) => ({
            member: r.memberId,
            rank: r.rank,
            amount: `$${r.amount.toFixed(2)}`,
            month: r.month,
          }))}
          emptyMessage="No monthly reward entries yet."
        />
      )}
    </div>
  );
}
