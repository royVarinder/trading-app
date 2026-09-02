"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type Investment = {
  id: string;
  amount: number;
  createdAt: string;
};

export function InvestmentReport({ memberId }: { memberId: string }) {
  const [investments, setInvestments] = useState<Investment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/investments")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setInvestments(data.investments ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load your investment report.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    investments?.map((inv, i) => ({
      "#": i + 1,
      id: memberId,
      package: `$${inv.amount.toFixed(2)}`,
      date: new Date(inv.createdAt).toLocaleDateString(),
      type: "Investment",
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Investment Report" subtitle="Every investment package you have purchased." />

      {investments === null && !error ? (
        <TableSkeleton columns={5} rows={2} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "id", label: "Member Id" },
            { key: "package", label: "Package" },
            { key: "date", label: "Date" },
            { key: "type", label: "Type" },
          ]}
          rows={rows}
          emptyMessage="You haven't purchased an investment package yet."
        />
      )}
    </div>
  );
}
