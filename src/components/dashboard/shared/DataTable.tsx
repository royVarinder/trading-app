import type { ReactNode } from "react";

export type Column = { key: string; label: string; align?: "left" | "right" };

export function DataTable({
  columns,
  rows,
  emptyMessage = "No records found yet.",
}: {
  columns: Column[];
  rows: Record<string, ReactNode>[];
  emptyMessage?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[color:var(--fincept-border)] bg-[color:var(--fincept-card)] shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-[color:var(--fincept-border)] bg-white/[0.03] text-xs font-semibold uppercase tracking-wide text-[color:var(--fincept-text-muted)]">
            {columns.map((c) => (
              <th key={c.key} className={`px-4 py-3 ${c.align === "right" ? "text-right" : "text-left"}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--fincept-border)]">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-[color:var(--fincept-text-muted)]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="hover:bg-white/[0.03]">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3 text-[color:var(--fincept-text)] ${c.align === "right" ? "text-right" : "text-left"}`}
                  >
                    {row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
