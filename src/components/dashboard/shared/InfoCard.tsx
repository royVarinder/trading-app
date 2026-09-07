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
    <div className="rounded-2xl border border-[color:var(--fincept-border)] bg-[color:var(--fincept-card)] p-5 shadow-sm">
      {title && <h2 className="mb-3 text-sm font-semibold text-[color:var(--fincept-text)]">{title}</h2>}
      <dl className="divide-y divide-[color:var(--fincept-border)]">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
            <dt className="text-[color:var(--fincept-text-muted)]">{r.label}</dt>
            <dd className={`font-semibold text-[color:var(--fincept-text)] ${r.valueClassName ?? ""}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}
