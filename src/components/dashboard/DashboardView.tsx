import { InfoCard } from "@/components/dashboard/shared/InfoCard";
import { TradingViewWidget } from "@/components/dashboard/shared/TradingViewWidget";
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

const STATS = [
  { label: "Direct Team Business", value: "$0", icon: TreeIcon },
  { label: "Total Team Business", value: "$0", icon: LayersIcon },
  { label: "Staking Trading Bonus", value: "$6.00", icon: TrendingUpIcon },
  { label: "Investment Trading Bonus", value: "$0.75", icon: ReportIcon },
  { label: "Leadership Bonus", value: "$0", icon: ShieldIcon },
  { label: "Total Income", value: "$6.75", icon: DepositIcon },
  { label: "Total Withdrawal", value: "$0", icon: WithdrawIcon },
  { label: "Net Income", value: "$6.75", icon: IdIcon },
  { label: "Reward Bonus", value: "$0", icon: TicketIcon },
  { label: "Fund Wallet", value: "$0.00", icon: GridIcon },
];

const TICKER_SYMBOLS = [
  { proName: "FOREXCOM:SPXUSD", title: "S&P 500 Index" },
  { proName: "FX_IDC:EURUSD", title: "EUR to USD" },
  { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
  { proName: "BITSTAMP:ETHUSD", title: "Ethereum" },
];

export function DashboardView({ memberId }: { memberId: string }) {
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
          Welcome to Win FX — your dashboard is up to date.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-brand-ink p-2 shadow-sm">
        <TradingViewWidget
          scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
          config={{
            symbols: TICKER_SYMBOLS,
            isTransparent: true,
            displayMode: "adaptive",
            colorTheme: "dark",
            locale: "en",
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <InfoCard
          title="Account Information"
          rows={[
            { label: "User ID", value: memberId },
            { label: "Rank", value: "No-Rank" },
            { label: "Total Self Investment", value: "$550" },
            { label: "Total Income", value: "$6.75" },
            { label: "Total Withdrawal", value: "$0" },
            { label: "Net Income", value: "$6.75", valueClassName: "text-emerald-600" },
          ]}
        />
        <InfoCard
          title="Team Information"
          rows={[
            { label: "User ID", value: memberId },
            { label: "Total Direct", value: "1" },
            { label: "Active Direct", value: "0" },
            { label: "Pending Direct", value: "1" },
            { label: "Total Team", value: "1" },
            { label: "Active Team", value: "0" },
            { label: "Pending Team", value: "1" },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => {
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
          config={{
            width: "100%",
            height: 400,
            currencies: ["EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD"],
            isTransparent: true,
            colorTheme: "light",
            locale: "en",
          }}
        />
      </div>
    </div>
  );
}
