import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="fincept fincept-bg-image relative flex min-h-screen w-full items-center justify-center px-4 py-10">
      <Link
        href="/"
        className="absolute left-6 top-6 flex items-center gap-2 sm:left-10 sm:top-8"
        aria-label="PRIMEFX home"
      >
        <Image src="/primeLogo.png" alt="" width={36} height={36} className="h-9 w-9 rounded-full" priority />
        <span className="font-hanken text-lg font-bold tracking-wide text-[color:var(--fincept-text)]">PRIMEFX</span>
      </Link>

      <div className="fincept-card relative w-full max-w-md p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] sm:p-10">
        <h1 className="text-center text-lg font-bold tracking-wide text-[color:var(--fincept-text)] sm:text-xl">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-[11px] font-medium uppercase leading-relaxed tracking-wide text-[color:var(--fincept-text-muted)]">
          {subtitle}
        </p>
        <div className="mt-7 space-y-4">{children}</div>
        <div className="mt-6 text-center text-sm text-[color:var(--fincept-text-muted)]">{footer}</div>
      </div>
    </div>
  );
}
