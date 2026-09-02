"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type Stake = {
  id: string;
  amount: number;
  durationDays: number;
  creditedDays: number;
  status: string;
  createdAt: string;
};

export function StakingReport({ memberId }: { memberId: string }) {
  const [stakes, setStakes] = useState<Stake[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/stakes")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setStakes(data.stakes ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load your staking report.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    stakes?.map((s, i) => ({
      "#": i + 1,
      id: memberId,
      staking: `$${s.amount.toFixed(2)}`,
      days: `${s.creditedDays}/${s.durationDays}`,
      date: new Date(s.createdAt).toLocaleDateString(),
      status: <StatusBadge status={s.status} />,
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Staking Report" subtitle="Every staking plan you have active or completed." />

      {stakes === null && !error ? (
        <TableSkeleton columns={6} rows={2} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "id", label: "Member Id" },
            { key: "staking", label: "Staking" },
            { key: "days", label: "Days" },
            { key: "date", label: "Date" },
            { key: "status", label: "Status" },
          ]}
          rows={rows}
          emptyMessage="You haven't staked into a plan yet."
        />
      )}
    </div>
  );
}
