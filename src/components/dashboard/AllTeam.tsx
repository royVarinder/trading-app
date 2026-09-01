"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";
import type { TeamMemberSummary } from "@/lib/team-types";

export function AllTeam({ memberId }: { memberId: string }) {
  const [allTeam, setAllTeam] = useState<TeamMemberSummary[] | null>(null);
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
          setAllTeam(data.allTeam ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load your team report.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    allTeam?.map((m, i) => ({
      "#": i + 1,
      join: new Date(m.createdAt).toLocaleDateString(),
      id: m.memberId,
      name: m.username,
      sponsor: m.sponsorId ?? memberId,
      status: <StatusBadge status={m.status} />,
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="All Team Report" subtitle="Every member across your entire downline." />

      {allTeam === null && !error ? (
        <TableSkeleton columns={6} rows={3} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "S.No" },
            { key: "join", label: "Date of Join" },
            { key: "id", label: "Member Id" },
            { key: "name", label: "Name" },
            { key: "sponsor", label: "Sponsor ID" },
            { key: "status", label: "Status" },
          ]}
          rows={rows}
          emptyMessage="Your downline is empty."
        />
      )}
    </div>
  );
}
