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
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {columns.map((c) => (
              <th key={c.key} className={`px-4 py-3 ${c.align === "right" ? "text-right" : "text-left"}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/60">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3 text-gray-700 ${c.align === "right" ? "text-right" : "text-left"}`}
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
