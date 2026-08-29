"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type Deposit = {
  id: string;
  amount: number;
  transactionHash: string;
  status: string;
  createdAt: string;
};

export function DepositHistory({ memberId }: { memberId: string }) {
  const [deposits, setDeposits] = useState<Deposit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/deposits")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setDeposits(data.deposits ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load deposit history.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    deposits?.map((d, i) => ({
      "#": i + 1,
      user: memberId,
      amount: `$${d.amount.toFixed(2)}`,
      hash: d.transactionHash,
      date: new Date(d.createdAt).toLocaleDateString(),
      status: <StatusBadge status={d.status} />,
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Deposit History" subtitle="Fund requests you have submitted." />

      {deposits === null && !error ? (
        <TableSkeleton columns={6} rows={3} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "user", label: "User Id" },
            { key: "amount", label: "Fund Amount" },
            { key: "hash", label: "Transaction HASH" },
            { key: "date", label: "Date" },
            { key: "status", label: "Status" },
          ]}
          rows={rows}
          emptyMessage="You haven't submitted any deposit requests yet."
        />
      )}
    </div>
  );
}
