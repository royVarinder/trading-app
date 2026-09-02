import Image from "next/image";
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
    <div className="mesh-bg flex min-h-screen w-full items-center justify-center px-4 py-10">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.55)] sm:p-10">
        <div className="mb-6 flex justify-center">
          <Image
            src="/primeLogo.png"
            alt="PRIMEFX"
            width={72}
            height={72}
            className="rounded-2xl"
            priority
          />
        </div>
        <h1 className="text-center text-lg font-bold tracking-wide text-[#1f2430] sm:text-xl">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-[11px] font-medium uppercase leading-relaxed tracking-wide text-gray-400">
          {subtitle}
        </p>
        <div className="mt-7 space-y-4">{children}</div>
        <div className="mt-6 text-center text-sm text-gray-500">{footer}</div>
      </div>
    </div>
  );
}
