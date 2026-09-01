"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";
import type { LevelSummary } from "@/lib/team-types";

export function LevelTeam() {
  const [levels, setLevels] = useState<LevelSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setLevels(data.levels ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load your level team.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    levels?.map((l) => ({
      "#": l.level,
      level: `Level-${l.level}`,
      users: l.users,
      paid: l.paid,
      business: `$${l.business.toFixed(2)}`,
      action: (
        <button type="button" className="btn-solid !py-1.5 !px-3 !text-xs">
          View Team
        </button>
      ),
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Level Team" subtitle="Your downline broken out by level." />

      {levels === null && !error ? (
        <TableSkeleton columns={6} rows={3} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "level", label: "Level" },
            { key: "users", label: "Total Users" },
            { key: "paid", label: "Total Paid Users" },
            { key: "business", label: "Team Business" },
            { key: "action", label: "Action" },
          ]}
          rows={rows}
        />
      )}
    </div>
  );
}
