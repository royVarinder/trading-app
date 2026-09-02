"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  GridIcon,
  DepositIcon,
  WithdrawIcon,
  TrendingUpIcon,
  UserIcon,
  TicketIcon,
  ReportIcon,
  LayersIcon,
  GearIcon,
  ShieldIcon,
  LogoutIcon,
} from "@/components/icons";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: GridIcon },
  { href: "/admin/deposits", label: "Deposits", icon: DepositIcon },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: WithdrawIcon },
  { href: "/admin/investments", label: "Investments & Staking", icon: TrendingUpIcon },
  { href: "/admin/members", label: "Members", icon: UserIcon },
  { href: "/admin/tickets", label: "Support Tickets", icon: TicketIcon },
  { href: "/admin/ledger", label: "Ledger", icon: ReportIcon },
  { href: "/admin/reports", label: "Reports", icon: LayersIcon },
  { href: "/admin/settings", label: "Settings", icon: GearIcon },
  { href: "/admin/audit-log", label: "Audit Log", icon: ShieldIcon },
] as const;

export function AdminShell({
  username,
  role,
  children,
}: {
  username: string;
  role: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <aside className="mesh-bg flex h-full w-64 shrink-0 flex-col justify-between">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-3 px-6 py-6">
            <Image src="/primeLogo.png" alt="PRIMEFX" width={32} height={32} className="rounded-xl" />
            <span className="text-sm font-bold tracking-wide text-white">PRIMEFX Admin</span>
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
            {NAV.map((item) => {
              const isActive = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-gradient-to-r from-brand-purple to-brand-purple-light text-white shadow-lg shadow-brand-purple/30"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-gold text-xs font-semibold text-white">
              {username.slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">{username}</span>
              <span className="block truncate text-xs capitalize text-gray-400">{role.replace("_", " ")}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-400 transition hover:bg-white/5"
          >
            <LogoutIcon className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 sm:p-8">{children}</main>
    </div>
  );
}
