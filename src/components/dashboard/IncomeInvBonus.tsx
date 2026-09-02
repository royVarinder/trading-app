"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type BonusEntry = {
  id: string;
  principal: number;
  income: number;
  date: string;
};

export function IncomeInvBonus({ memberId }: { memberId: string }) {
  const [entries, setEntries] = useState<BonusEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/income/investment")
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
        if (!cancelled) setError("Unable to load your investment bonus history.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    entries?.map((e, i) => ({
      "#": i + 1,
      id: memberId,
      package: `$${e.principal.toFixed(2)}`,
      income: `$${e.income.toFixed(2)}`,
      date: new Date(e.date).toLocaleDateString(),
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Investment Trading Bonus" subtitle="Daily trading bonus earned on your investment package." />

      {entries === null && !error ? (
        <TableSkeleton columns={5} rows={2} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "id", label: "Member ID" },
            { key: "package", label: "Package" },
            { key: "income", label: "Income" },
            { key: "date", label: "Date" },
          ]}
          rows={rows}
          emptyMessage="No investment bonus earned yet."
        />
      )}
    </div>
  );
}
