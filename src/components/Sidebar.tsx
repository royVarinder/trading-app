"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronDownIcon, CloseIcon, GridIcon, LockIcon, LogoutIcon, UserIcon } from "@/components/icons";
import { findSectionIdForMenu, MENU, type MenuId } from "@/components/dashboard/menu";

export function Sidebar({
  active,
  onSelect,
  username,
  memberId,
  onLogout,
  mobileOpen,
  onCloseMobile,
}: {
  active: MenuId;
  onSelect: (id: MenuId) => void;
  username: string;
  memberId: string;
  onLogout: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const initialSection = findSectionIdForMenu(active);
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(initialSection ? [initialSection] : [])
  );
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleSection(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectItem(id: MenuId) {
    onSelect(id);
    onCloseMobile();
  }

  function selectAndClose(id: MenuId) {
    onSelect(id);
    setMenuOpen(false);
    onCloseMobile();
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`mesh-bg fixed inset-y-0 left-0 z-40 flex h-full w-72 shrink-0 flex-col justify-between transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3 px-6 py-6">
            <div className="flex items-center gap-3">
              <Image src="/primeLogo.png" alt="PRIMEFX" width={36} height={36} className="rounded-xl" />
              <span className="text-base font-bold tracking-wide text-white">PRIMEFX</span>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close menu"
              className="rounded-lg p-1.5 text-gray-300 hover:bg-white/5 hover:text-white lg:hidden"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
            {MENU.map((entry) => {
              if (entry.kind === "leaf") {
                const isActive = active === entry.id;
                const Icon = entry.icon;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => selectItem(entry.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-gradient-to-r from-brand-purple to-brand-purple-light text-white shadow-lg shadow-brand-purple/30"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {entry.label}
                  </button>
                );
              }

              const isOpen = expanded.has(entry.id);
              const Icon = entry.icon;
              const hasActiveChild = entry.children.some((c) => c.id === active);

              return (
                <div key={entry.id}>
                  <button
                    type="button"
                    onClick={() => toggleSection(entry.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                      hasActiveChild && !isOpen
                        ? "text-white"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{entry.label}</span>
                    <ChevronDownIcon
                      className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="mt-1 space-y-0.5 border-l border-white/10 pl-6">
                      {entry.children.map((child) => {
                        const isActive = active === child.id;
                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => selectItem(child.id)}
                            className={`block w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium transition ${
                              isActive
                                ? "bg-white/10 text-white"
                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="relative border-t border-white/10 px-4 py-4">
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute bottom-full left-4 right-4 z-20 mb-2 overflow-hidden rounded-xl border border-white/10 bg-[#181822] shadow-2xl">
                <button
                  type="button"
                  onClick={() => selectAndClose("dashboard")}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
                >
                  <GridIcon className="h-4 w-4" />
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => selectAndClose("profile")}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
                >
                  <UserIcon className="h-4 w-4" />
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => selectAndClose("change-password")}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
                >
                  <LockIcon className="h-4 w-4" />
                  Change Password
                </button>
                <div className="border-t border-white/10" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-red-400 transition hover:bg-white/5"
                >
                  <LogoutIcon className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-3 py-3 text-left transition hover:bg-white/10"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-gold text-xs font-semibold text-white">
              {username.slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">{username}</span>
              <span className="block truncate text-xs text-gray-400">ID: {memberId}</span>
            </span>
            <ChevronDownIcon
              className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${menuOpen ? "" : "rotate-180"}`}
            />
          </button>
        </div>
      </aside>
    </>
  );
}
