"use client";

import { useEffect, useState } from "react";
import { InfoCard } from "@/components/dashboard/shared/InfoCard";
import { TradingViewWidget } from "@/components/dashboard/shared/TradingViewWidget";
import type { TeamSummary } from "@/lib/team-types";
import {
  TreeIcon,
  LayersIcon,
  TrendingUpIcon,
  ReportIcon,
  ShieldIcon,
  DepositIcon,
  WithdrawIcon,
  IdIcon,
  TicketIcon,
  GridIcon,
} from "@/components/icons";

type WalletSummary = {
  rank: string;
  totalSelfInvestment: number;
  totalStakingBonus: number;
  totalInvestmentBonus: number;
  totalLeadership: number;
  totalRewards: number;
  totalIncome: number;
  totalIncomeWithdrawal: number;
  netIncome: number;
  availableFund: number;
};

const TICKER_SYMBOLS = [
  { proName: "FOREXCOM:SPXUSD", title: "S&P 500 Index" },
  { proName: "FX_IDC:EURUSD", title: "EUR to USD" },
  { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
  { proName: "BITSTAMP:ETHUSD", title: "Ethereum" },
];

// Hoisted to module scope (not inlined as JSX props) so the object identity
// stays stable across re-renders. TradingViewWidget re-injects its external
// <script> whenever its `config` prop changes identity; DashboardView now
// re-renders after its /api/team and /api/wallet fetches resolve, and an
// inline object literal would get a fresh identity on every one of those,
// tearing the widget down and rebuilding it while TradingView's own async
// script is still initializing — which throws `querySelector` on the
// already-cleared container.
const TICKER_TAPE_CONFIG = {
  symbols: TICKER_SYMBOLS,
  isTransparent: true,
  displayMode: "adaptive",
  colorTheme: "dark",
  locale: "en",
};

const FOREX_CROSS_RATES_CONFIG = {
  width: "100%",
  height: 400,
  currencies: ["EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD"],
  isTransparent: true,
  colorTheme: "light",
  locale: "en",
};

const EMPTY_SUMMARY: TeamSummary = {
  totalDirect: 0,
  activeDirect: 0,
  pendingDirect: 0,
  totalTeam: 0,
  activeTeam: 0,
  pendingTeam: 0,
  directBusiness: 0,
  teamBusiness: 0,
};

const EMPTY_WALLET: WalletSummary = {
  rank: "No-Rank",
  totalSelfInvestment: 0,
  totalStakingBonus: 0,
  totalInvestmentBonus: 0,
  totalLeadership: 0,
  totalRewards: 0,
  totalIncome: 0,
  totalIncomeWithdrawal: 0,
  netIncome: 0,
  availableFund: 0,
};

export function DashboardView({ memberId }: { memberId: string }) {
  const [summary, setSummary] = useState<TeamSummary>(EMPTY_SUMMARY);
  const [wallet, setWallet] = useState<WalletSummary>(EMPTY_WALLET);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || data.error) return;
        setSummary(data.summary ?? EMPTY_SUMMARY);
      })
      .catch(() => {});

    fetch("/api/wallet")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || data.error) return;
        setWallet(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    { label: "Direct Team Business", value: `$${summary.directBusiness.toFixed(2)}`, icon: TreeIcon },
    { label: "Total Team Business", value: `$${summary.teamBusiness.toFixed(2)}`, icon: LayersIcon },
    { label: "Staking Trading Bonus", value: `$${wallet.totalStakingBonus.toFixed(2)}`, icon: TrendingUpIcon },
    { label: "Investment Trading Bonus", value: `$${wallet.totalInvestmentBonus.toFixed(2)}`, icon: ReportIcon },
    { label: "Leadership Bonus", value: `$${wallet.totalLeadership.toFixed(2)}`, icon: ShieldIcon },
    { label: "Total Income", value: `$${wallet.totalIncome.toFixed(2)}`, icon: DepositIcon },
    { label: "Total Withdrawal", value: `$${wallet.totalIncomeWithdrawal.toFixed(2)}`, icon: WithdrawIcon },
    { label: "Net Income", value: `$${wallet.netIncome.toFixed(2)}`, icon: IdIcon },
    { label: "Reward Bonus", value: `$${wallet.totalRewards.toFixed(2)}`, icon: TicketIcon },
    { label: "Fund Wallet", value: `$${wallet.availableFund.toFixed(2)}`, icon: GridIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1f2430]">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back — here&apos;s a snapshot of your account today.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-brand-purple to-brand-purple-light px-6 py-4 text-center shadow-sm">
        <span className="mb-1 inline-block rounded-full bg-white/15 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
          Notification
        </span>
        <p className="text-sm font-bold text-white">
          Welcome to PRIMEFX — your dashboard is up to date.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-brand-ink p-2 shadow-sm">
        <TradingViewWidget
          scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
          config={TICKER_TAPE_CONFIG}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <InfoCard
          title="Account Information"
          rows={[
            { label: "User ID", value: memberId },
            { label: "Rank", value: wallet.rank },
            { label: "Total Self Investment", value: `$${wallet.totalSelfInvestment.toFixed(2)}` },
            { label: "Total Income", value: `$${wallet.totalIncome.toFixed(2)}` },
            { label: "Total Withdrawal", value: `$${wallet.totalIncomeWithdrawal.toFixed(2)}` },
            { label: "Net Income", value: `$${wallet.netIncome.toFixed(2)}`, valueClassName: "text-emerald-600" },
          ]}
        />
        <InfoCard
          title="Team Information"
          rows={[
            { label: "User ID", value: memberId },
            { label: "Total Direct", value: summary.totalDirect },
            { label: "Active Direct", value: summary.activeDirect },
            { label: "Pending Direct", value: summary.pendingDirect },
            { label: "Total Team", value: summary.totalTeam },
            { label: "Active Team", value: summary.activeTeam },
            { label: "Pending Team", value: summary.pendingTeam },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-xl font-bold text-[#1f2430]">{stat.value}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-purple-light text-white">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Thailand Tour Status
            </p>
            <span className="mt-2 inline-block rounded-full bg-brand-gold/15 px-3 py-1 text-xs font-semibold text-brand-gold">
              Pending
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
        <TradingViewWidget
          scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js"
          config={FOREX_CROSS_RATES_CONFIG}
        />
      </div>
    </div>
  );
}
