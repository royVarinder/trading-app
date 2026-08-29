"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
};

export function InvestmentHistory({ memberId, username }: { memberId: string; username: string }) {
  const [payouts, setPayouts] = useState<Withdrawal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/withdrawals?type=investment")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setPayouts(data.withdrawals ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load investment payout report.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    payouts?.map((p, i) => ({
      "#": i + 1,
      id: memberId,
      name: username,
      amount: `$${p.amount.toFixed(2)}`,
      date: new Date(p.createdAt).toLocaleDateString(),
      status: <StatusBadge status={p.status} />,
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Investment Payout Report" subtitle="Payouts made from your investment wallet." />

      {payouts === null && !error ? (
        <TableSkeleton columns={5} rows={2} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "id", label: "User ID" },
            { key: "name", label: "Name" },
            { key: "amount", label: "Amount" },
            { key: "date", label: "Payout Date" },
            { key: "status", label: "Status" },
          ]}
          rows={rows}
          emptyMessage="No investment payouts yet."
        />
      )}
    </div>
  );
}
