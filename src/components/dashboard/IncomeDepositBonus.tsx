"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type DepositIncomeEntry = {
  id: string;
  principal: number;
  income: number;
  intervalsCredited: number;
  date: string;
};

export function IncomeDepositBonus({ memberId }: { memberId: string }) {
  const [entries, setEntries] = useState<DepositIncomeEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/income/deposit")
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
        if (!cancelled) setError("Unable to load your deposit income history.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    entries?.map((e, i) => ({
      "#": i + 1,
      id: memberId,
      deposit: `$${e.principal.toFixed(2)}`,
      intervals: e.intervalsCredited,
      income: `$${e.income.toFixed(2)}`,
      date: new Date(e.date).toLocaleDateString(),
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Deposit Income" subtitle="Profit earned automatically on your approved deposits." />

      {entries === null && !error ? (
        <TableSkeleton columns={6} rows={2} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "id", label: "Member ID" },
            { key: "deposit", label: "Deposit" },
            { key: "intervals", label: "Intervals" },
            { key: "income", label: "Income" },
            { key: "date", label: "Date" },
          ]}
          rows={rows}
          emptyMessage="No deposit income earned yet."
        />
      )}
    </div>
  );
}
