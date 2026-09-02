"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type BonusEntry = {
  id: string;
  principal: number;
  durationDays: number | null;
  income: number;
  date: string;
};

export function IncomeStakingBonus({ memberId }: { memberId: string }) {
  const [entries, setEntries] = useState<BonusEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/income/staking")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setEntries(data.entries ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load your staking bonus history.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    entries?.map((e, i) => ({
      "#": i + 1,
      id: memberId,
      staking: `$${e.principal.toFixed(2)}`,
      days: e.durationDays ?? "—",
      level: 1,
      income: `$${e.income.toFixed(2)}`,
      date: new Date(e.date).toLocaleDateString(),
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Staking Trading Bonus" subtitle="Daily trading bonus earned on your staked funds." />

      {entries === null && !error ? (
        <TableSkeleton columns={7} rows={2} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "id", label: "Member ID" },
            { key: "staking", label: "Staking" },
            { key: "days", label: "Days" },
            { key: "level", label: "Level" },
            { key: "income", label: "Income" },
            { key: "date", label: "Date" },
          ]}
          rows={rows}
          emptyMessage="No staking bonus earned yet."
        />
      )}
    </div>
  );
}
