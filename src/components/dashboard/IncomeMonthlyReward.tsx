"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type RankRow = {
  level: number;
  rank: string;
  commissionPct: number;
  selfInvestment: number;
  directBusiness: number;
  teamBusiness: number;
  monthlyReward: number;
  status: "Achieved" | "Pending";
};

export function IncomeMonthlyReward() {
  const [ranks, setRanks] = useState<RankRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/income/rewards")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setRanks(data.ranks ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load leadership rank data.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    ranks?.map((r) => ({
      level: r.level,
      rank: r.rank,
      cmsn: `${r.commissionPct}%`,
      selfInv: `$${r.selfInvestment.toLocaleString()}`,
      direct: `$${r.directBusiness.toLocaleString()}`,
      team: `$${r.teamBusiness.toLocaleString()}`,
      reward: `$${r.monthlyReward.toLocaleString()}`,
      status: <StatusBadge status={r.status} />,
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Monthly / Reward Bonus" subtitle="Leadership ranks and the qualification targets for each." />

      {ranks === null && !error ? (
        <TableSkeleton columns={8} rows={6} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "level", label: "Level" },
            { key: "rank", label: "Leadership Rank" },
            { key: "cmsn", label: "C.MSN" },
            { key: "selfInv", label: "Self Investment" },
            { key: "direct", label: "Direct Business" },
            { key: "team", label: "Team Business" },
            { key: "reward", label: "Monthly Reward" },
            { key: "status", label: "Status" },
          ]}
          rows={rows}
        />
      )}
    </div>
  );
}
