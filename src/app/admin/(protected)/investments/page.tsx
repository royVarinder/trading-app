"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type Position = {
  id: string;
  memberId: string;
  username: string;
  amount: number;
  // Only present for stakes — investments earn the single platform-wide
  // rate/interval configured in Settings, not a per-position rate.
  dailyRate?: number;
  status: string;
  createdAt: string;
  tierId?: string;
  durationDays?: number;
  creditedDays?: number;
};

const KINDS = ["investments", "stakes"] as const;
const STATUS_OPTIONS: Record<(typeof KINDS)[number], string[]> = {
  investments: ["Active", "Paused", "Closed"],
  stakes: ["Active", "Paused", "Completed", "Closed"],
};

export default function AdminInvestmentsPage() {
  const [kind, setKind] = useState<(typeof KINDS)[number]>("investments");
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // See the deposits page for why this guard exists.
  const kindRef = useRef(kind);
  useEffect(() => {
    kindRef.current = kind;
  }, [kind]);

  function load() {
    const requestedKind = kind;
    fetch(`/api/admin/${requestedKind}`)
      .then((res) => res.json())
      .then((data) => {
        if (kindRef.current !== requestedKind) return;
        if (data.error) setError(data.error);
        else setPositions(data[requestedKind]);
      })
      .catch(() => {
        if (kindRef.current === requestedKind) setError("Unable to load positions.");
      });
  }

  useEffect(load, [kind]);

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/${kind}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) load();
      else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Action failed.");
      }
    } finally {
      setBusyId(null);
    }
  }

  const rows =
    positions?.map((p, i) => ({
      "#": i + 1,
      member: (
        <span>
          <span className="font-semibold">{p.memberId}</span>
          <span className="block text-xs text-[color:var(--fincept-text-muted)]">{p.username}</span>
        </span>
      ),
      amount: `$${p.amount.toFixed(2)}`,
      rate: kind === "stakes" ? `${((p.dailyRate ?? 0) * 100).toFixed(2)}%/day` : "Platform rate — see Settings",
      progress: kind === "stakes" ? `${p.creditedDays ?? 0}/${p.durationDays ?? 0} days` : "—",
      date: new Date(p.createdAt).toLocaleDateString(),
      status: <StatusBadge status={p.status} />,
      actions: (
        <select
          value={p.status}
          disabled={busyId === p.id}
          onChange={(e) => setStatus(p.id, e.target.value)}
          className="field-input h-8 w-28 text-xs"
        >
          {STATUS_OPTIONS[kind].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investments & Staking"
        subtitle="All active positions across every member. Pause or close a position to stop it accruing further daily bonus."
      />

      <div className="flex gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
              kind === k ? "bg-brand-purple text-white" : "bg-[color:var(--fincept-card)] text-[color:var(--fincept-text-muted)] hover:bg-white/5"
            }`}
          >
            {k === "investments" ? "Investment ID" : "Staking ID"}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-2xl border border-red-100 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
          {error}
        </p>
      )}

      {positions === null && !error ? (
        <TableSkeleton columns={7} rows={4} />
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "member", label: "Member" },
            { key: "amount", label: "Amount" },
            { key: "rate", label: "Rate" },
            { key: "progress", label: "Progress" },
            { key: "date", label: "Date" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Change Status" },
          ]}
          rows={rows}
          emptyMessage="No positions found."
        />
      )}
    </div>
  );
}
