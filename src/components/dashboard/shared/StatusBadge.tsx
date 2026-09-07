export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone = normalized.includes("pending")
    ? "bg-amber-500/10 text-amber-300"
    : normalized.includes("reject") || normalized.includes("fail")
      ? "bg-red-500/10 text-red-300"
      : "bg-emerald-500/10 text-emerald-300";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}>
      {status}
    </span>
  );
}
