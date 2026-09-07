export function TableSkeleton({ rows = 4, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[color:var(--fincept-border)] bg-[color:var(--fincept-card)] shadow-sm">
      <div className="border-b border-[color:var(--fincept-border)] bg-white/[0.03] px-4 py-3">
        <div className="flex gap-6">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-3 w-20 animate-pulse rounded bg-white/10" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-[color:var(--fincept-border)]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-6 px-4 py-4">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className="h-3 animate-pulse rounded bg-white/5"
                style={{ width: `${60 + ((r + c) % 3) * 20}px` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-[color:var(--fincept-border)] bg-[color:var(--fincept-card)] p-5 shadow-sm">
      <div className="space-y-4">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
            <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
