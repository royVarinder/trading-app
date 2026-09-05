"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type Deposit = {
  id: string;
  memberId: string;
  username: string;
  amount: number;
  transactionHash: string;
  status: string;
  reviewedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
};

const TABS = ["All", "Pending", "Approved", "Rejected"];

export default function AdminDepositsPage() {
  const [tab, setTab] = useState("Pending");
  const [deposits, setDeposits] = useState<Deposit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Approve/reject requests await a real SMTP send server-side and can
  // resolve well after the admin has already switched tabs. This ref lets a
  // late-arriving response recognize it's stale and avoid clobbering
  // whatever tab is actually selected by the time it lands.
  const tabRef = useRef(tab);
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  function load() {
    const requestedTab = tab;
    fetch(`/api/admin/deposits?status=${requestedTab}`)
      .then((res) => res.json())
      .then((data) => {
        if (tabRef.current !== requestedTab) return;
        if (data.error) setError(data.error);
        else setDeposits(data.deposits);
      })
      .catch(() => {
        if (tabRef.current === requestedTab) setError("Unable to load deposits.");
      });
  }

  useEffect(load, [tab]);

  async function act(id: string, action: "approve" | "reject", reason?: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/deposits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });
      if (res.ok) {
        setRejectingId(null);
        setRejectReason("");
        load();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Action failed.");
      }
    } finally {
      setBusyId(null);
    }
  }

  const rows =
    deposits?.map((d, i) => ({
      "#": i + 1,
      member: (
        <span>
          <span className="font-semibold">{d.memberId}</span>
          <span className="block text-xs text-gray-400">{d.username}</span>
        </span>
      ),
      amount: `$${d.amount.toFixed(2)}`,
      hash: <span className="font-mono text-xs">{d.transactionHash}</span>,
      date: new Date(d.createdAt).toLocaleString(),
      status: (
        <span>
          <StatusBadge status={d.status} />
          {d.status === "Rejected" && d.rejectionReason && (
            <span className="block text-xs text-gray-400">{d.rejectionReason}</span>
          )}
        </span>
      ),
      actions:
        d.status === "Pending" ? (
          rejectingId === d.id ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason"
                className="field-input h-8 w-40 text-xs"
              />
              <button
                type="button"
                className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                disabled={busyId === d.id}
                onClick={() => act(d.id, "reject", rejectReason)}
              >
                Confirm
              </button>
              <button
                type="button"
                className="text-xs font-semibold text-gray-400 hover:underline"
                onClick={() => setRejectingId(null)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-xs font-semibold text-emerald-600 hover:underline disabled:opacity-50"
                disabled={busyId === d.id}
                onClick={() => act(d.id, "approve")}
              >
                Approve
              </button>
              <button
                type="button"
                className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                disabled={busyId === d.id}
                onClick={() => {
                  setRejectingId(d.id);
                  setRejectReason("");
                }}
              >
                Reject
              </button>
            </div>
          )
        ) : (
          <span className="text-xs text-gray-400">{d.reviewedBy ? `by ${d.reviewedBy}` : "—"}</span>
        ),
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Deposits" subtitle="Approve or reject member deposit requests." />

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              tab === t ? "bg-brand-purple text-white" : "bg-white text-gray-500 hover:bg-gray-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {deposits === null && !error ? (
        <TableSkeleton columns={6} rows={4} />
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "member", label: "Member" },
            { key: "amount", label: "Amount" },
            { key: "hash", label: "Transaction Hash" },
            { key: "date", label: "Date" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions" },
          ]}
          rows={rows}
          emptyMessage="No deposits in this view."
        />
      )}
    </div>
  );
}
