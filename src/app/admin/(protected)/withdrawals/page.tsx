"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type Withdrawal = {
  id: string;
  memberId: string;
  username: string;
  type: "income" | "investment";
  amount: number;
  adminCharge: number;
  netAmount: number;
  status: string;
  reviewedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
};

const STATUS_TABS = ["All", "Pending", "Approved", "Paid", "Rejected"];
const TYPE_TABS = ["All", "income", "investment"] as const;

export default function AdminWithdrawalsPage() {
  const [statusTab, setStatusTab] = useState("Pending");
  const [typeTab, setTypeTab] = useState<(typeof TYPE_TABS)[number]>("All");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // See the deposits page for why this guard exists: approve/reject/mark-paid
  // await a real SMTP send server-side and can resolve after the admin has
  // already switched tabs, so a stale response must not overwrite fresh data.
  const filtersRef = useRef({ statusTab, typeTab });
  useEffect(() => {
    filtersRef.current = { statusTab, typeTab };
  }, [statusTab, typeTab]);

  function load() {
    const requested = { statusTab, typeTab };
    fetch(`/api/admin/withdrawals?status=${requested.statusTab}&type=${requested.typeTab}`)
      .then((res) => res.json())
      .then((data) => {
        const current = filtersRef.current;
        if (current.statusTab !== requested.statusTab || current.typeTab !== requested.typeTab) return;
        if (data.error) setError(data.error);
        else setWithdrawals(data.withdrawals);
      })
      .catch(() => {
        const current = filtersRef.current;
        if (current.statusTab === requested.statusTab && current.typeTab === requested.typeTab) {
          setError("Unable to load withdrawals.");
        }
      });
  }

  useEffect(load, [statusTab, typeTab]);

  async function act(id: string, action: "approve" | "reject" | "mark-paid", reason?: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
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
    withdrawals?.map((w, i) => ({
      "#": i + 1,
      member: (
        <span>
          <span className="font-semibold">{w.memberId}</span>
          <span className="block text-xs text-gray-400">{w.username}</span>
        </span>
      ),
      type: <span className="capitalize">{w.type}</span>,
      amount: (
        <span>
          ${w.amount.toFixed(2)}
          <span className="block text-xs text-gray-400">net ${w.netAmount.toFixed(2)}</span>
        </span>
      ),
      date: new Date(w.createdAt).toLocaleString(),
      status: (
        <span>
          <StatusBadge status={w.status} />
          {w.status === "Rejected" && w.rejectionReason && (
            <span className="block text-xs text-gray-400">{w.rejectionReason}</span>
          )}
        </span>
      ),
      actions:
        w.status === "Pending" ? (
          rejectingId === w.id ? (
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
                disabled={busyId === w.id}
                onClick={() => act(w.id, "reject", rejectReason)}
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
                disabled={busyId === w.id}
                onClick={() => act(w.id, "approve")}
              >
                Approve
              </button>
              <button
                type="button"
                className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                disabled={busyId === w.id}
                onClick={() => {
                  setRejectingId(w.id);
                  setRejectReason("");
                }}
              >
                Reject
              </button>
            </div>
          )
        ) : w.status === "Approved" ? (
          <button
            type="button"
            className="text-xs font-semibold text-brand-purple hover:underline disabled:opacity-50"
            disabled={busyId === w.id}
            onClick={() => act(w.id, "mark-paid")}
          >
            Mark Paid
          </button>
        ) : (
          <span className="text-xs text-gray-400">{w.reviewedBy ? `by ${w.reviewedBy}` : "—"}</span>
        ),
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Withdrawals" subtitle="Approve, reject, or mark income/investment payouts as paid." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setStatusTab(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                statusTab === t ? "bg-brand-purple text-white" : "bg-white text-gray-500 hover:bg-gray-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {TYPE_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeTab(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
                typeTab === t ? "bg-brand-ink text-white" : "bg-white text-gray-500 hover:bg-gray-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {withdrawals === null && !error ? (
        <TableSkeleton columns={6} rows={4} />
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "member", label: "Member" },
            { key: "type", label: "Type" },
            { key: "amount", label: "Amount" },
            { key: "date", label: "Date" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions" },
          ]}
          rows={rows}
          emptyMessage="No withdrawals in this view."
        />
      )}
    </div>
  );
}
