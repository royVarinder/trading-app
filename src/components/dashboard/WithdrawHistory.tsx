"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type Withdrawal = {
  id: string;
  amount: number;
  adminCharge: number;
  netAmount: number;
  status: string;
  createdAt: string;
};

export function WithdrawHistory({ memberId, username }: { memberId: string; username: string }) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/withdrawals?type=income")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setWithdrawals(data.withdrawals ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load withdrawal history.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    withdrawals?.map((w, i) => ({
      "#": i + 1,
      id: memberId,
      name: username,
      amount: `$${w.amount.toFixed(2)}`,
      charge: `$${w.adminCharge.toFixed(2)}`,
      net: `$${w.netAmount.toFixed(2)}`,
      date: new Date(w.createdAt).toLocaleDateString(),
      status: <StatusBadge status={w.status} />,
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Withdrawal History" subtitle="Payout requests you have submitted." />

      {withdrawals === null && !error ? (
        <TableSkeleton columns={8} rows={2} />
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
            { key: "charge", label: "Admin Charge" },
            { key: "net", label: "Net Amount" },
            { key: "date", label: "Payout Date" },
            { key: "status", label: "Status" },
          ]}
          rows={rows}
          emptyMessage="No withdrawal requests yet."
        />
      )}
    </div>
  );
}
