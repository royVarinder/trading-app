export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-xl font-bold text-[color:var(--fincept-text)]">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-[color:var(--fincept-text-muted)]">{subtitle}</p>}
    </div>
  );
}
