"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type Entry = {
  id: string;
  actor: string;
  action: string;
  target: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
};

export default function AdminAuditLogPage() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/audit-log")
      .then((res) => res.json())
      .then((data) => (data.error ? setError(data.error) : setEntries(data.entries)))
      .catch(() => setError("Unable to load audit log."));
  }, []);

  const rows =
    entries?.map((e) => ({
      time: new Date(e.createdAt).toLocaleString(),
      actor: e.actor,
      action: e.action,
      target: e.target ?? "—",
      details: e.details ? (
        <span className="font-mono text-xs text-gray-500">{JSON.stringify(e.details)}</span>
      ) : (
        "—"
      ),
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" subtitle="Every admin action — approvals, rejections, edits — in one place." />

      {error && (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {entries === null && !error ? (
        <TableSkeleton columns={5} rows={6} />
      ) : (
        <DataTable
          columns={[
            { key: "time", label: "Time" },
            { key: "actor", label: "Admin" },
            { key: "action", label: "Action" },
            { key: "target", label: "Target" },
            { key: "details", label: "Details" },
          ]}
          rows={rows}
          emptyMessage="No admin actions recorded yet."
        />
      )}
    </div>
  );
}
