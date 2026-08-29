export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone = normalized.includes("pending")
    ? "bg-amber-50 text-amber-600"
    : normalized.includes("reject") || normalized.includes("fail")
      ? "bg-red-50 text-red-600"
      : "bg-emerald-50 text-emerald-600";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}>
      {status}
    </span>
  );
}
