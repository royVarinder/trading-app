"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type LeadershipEntry = {
  id: string;
  beneficiaryRank: string;
  sourceMemberId: string;
  sourceUsername: string;
  level: number;
  refPrincipal: number;
  refIncome: number;
  positionType: "investment" | "staking";
  income: number;
  date: string;
};

export function IncomeLeadership({ memberId }: { memberId: string }) {
  const [entries, setEntries] = useState<LeadershipEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/income/leadership")
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
        if (!cancelled) setError("Unable to load your leadership bonus history.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    entries?.map((e, i) => ({
      "#": i + 1,
      id: memberId,
      rank: e.beneficiaryRank,
      refId: e.sourceMemberId,
      refName: e.sourceUsername,
      level: e.level,
      refInv: `$${e.refPrincipal.toFixed(2)}`,
      refRoi: `$${e.refIncome.toFixed(2)}`,
      type: e.positionType === "staking" ? "Staking" : "Investment",
      income: `$${e.income.toFixed(2)}`,
      date: new Date(e.date).toLocaleDateString(),
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Leadership Bonus" subtitle="Rank-based bonus earned from your team's investments." />

      {entries === null && !error ? (
        <TableSkeleton columns={11} rows={2} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "id", label: "Member Id" },
            { key: "rank", label: "My Rank" },
            { key: "refId", label: "Ref. ID" },
            { key: "refName", label: "Ref. Name" },
            { key: "level", label: "Level" },
            { key: "refInv", label: "Ref. Inv." },
            { key: "refRoi", label: "Ref. ROI" },
            { key: "type", label: "Type" },
            { key: "income", label: "Income" },
            { key: "date", label: "Date" },
          ]}
          rows={rows}
          emptyMessage="No leadership bonus earned yet — reach a ranked position to unlock this."
        />
      )}
    </div>
  );
}
