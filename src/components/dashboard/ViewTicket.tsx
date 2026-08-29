"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type Ticket = {
  id: string;
  message: string;
  reply: string | null;
  status: string;
  createdAt: string;
};

export function ViewTicket({ memberId }: { memberId: string }) {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/tickets")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setTickets(data.tickets ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load tickets.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows =
    tickets?.map((t, i) => ({
      sno: i + 1,
      id: memberId,
      message: t.message,
      reply: t.reply ?? <StatusBadge status={t.status === "Open" ? "Pending" : t.status} />,
      date: new Date(t.createdAt).toLocaleDateString(),
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Ticket Report" subtitle="Tickets you have submitted and their replies." />

      {tickets === null && !error ? (
        <TableSkeleton columns={5} rows={2} />
      ) : error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <DataTable
          columns={[
            { key: "sno", label: "Sno" },
            { key: "id", label: "User Id" },
            { key: "message", label: "Message" },
            { key: "reply", label: "Reply" },
            { key: "date", label: "Date" },
          ]}
          rows={rows}
          emptyMessage="You haven't submitted any tickets yet."
        />
      )}
    </div>
  );
}
