import type { ReactNode } from "react";

export function InfoCard({
  title,
  rows,
  footer,
}: {
  title?: string;
  rows: { label: string; value: ReactNode; valueClassName?: string }[];
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      {title && <h2 className="mb-3 text-sm font-semibold text-[#1f2430]">{title}</h2>}
      <dl className="divide-y divide-gray-100">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
            <dt className="text-gray-500">{r.label}</dt>
            <dd className={`font-semibold text-[#1f2430] ${r.valueClassName ?? ""}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}
