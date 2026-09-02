"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";

const REPORTS = [
  { type: "deposits", label: "Deposits Report" },
  { type: "withdrawals", label: "Withdrawals Report" },
  { type: "signups", label: "New Signups Report" },
] as const;

export default function AdminReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function urlFor(type: string, format: "csv" | "json") {
    const params = new URLSearchParams({ type, format });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return `/api/admin/reports?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Export platform activity by date range." />

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <label className="field-label" htmlFor="from">
            From
          </label>
          <input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field-input" />
        </div>
        <div>
          <label className="field-label" htmlFor="to">
            To
          </label>
          <input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field-input" />
        </div>
        <p className="text-xs text-gray-400">Leave both blank to export everything on record.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {REPORTS.map((r) => (
          <div key={r.type} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1f2430]">{r.label}</h2>
            <div className="mt-4 flex gap-3">
              <a href={urlFor(r.type, "csv")} className="btn-solid" download>
                Download CSV
              </a>
              <a href={urlFor(r.type, "json")} target="_blank" rel="noreferrer" className="btn-outline">
                View JSON
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
