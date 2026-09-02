"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";
import type { TeamMemberSummary } from "@/lib/team-types";

export function DirectTeam({ memberId }: { memberId: string }) {
  const [direct, setDirect] = useState<TeamMemberSummary[] | null>(null);
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
          setDirect(data.direct ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load your direct team.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    direct?.map((m, i) => ({
      "#": i + 1,
      id: m.memberId,
      name: m.username,
      sponsor: memberId,
      mobile: m.mobile,
      package: `$${m.ownInvested.toFixed(2)}`,
      business: `$${m.subtreeInvested.toFixed(2)}`,
      status: <StatusBadge status={m.status} />,
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Direct Team" subtitle="Members you have personally sponsored." />

      {direct === null && !error ? (
        <TableSkeleton columns={8} rows={3} />
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
            { key: "sponsor", label: "Sponsor Id" },
            { key: "mobile", label: "Mobile No" },
            { key: "package", label: "Package" },
            { key: "business", label: "All Business" },
            { key: "status", label: "Status" },
          ]}
          rows={rows}
          emptyMessage="You haven't referred anyone yet."
        />
      )}
    </div>
  );
}
