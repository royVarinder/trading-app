import {
  DepositIcon,
  GridIcon,
  LayersIcon,
  ReportIcon,
  TicketIcon,
  TreeIcon,
  TrendingUpIcon,
  GearIcon,
  WithdrawIcon,
} from "@/components/icons";

export type MenuId =
  | "dashboard"
  | "deposit-fund"
  | "deposit-history"
  | "direct-team"
  | "level-team"
  | "all-team"
  | "investment-id"
  | "investment-report"
  | "staking-id"
  | "staking-report"
  | "income-staking-bonus"
  | "income-inv-bonus"
  | "income-all-bonus"
  | "income-leadership"
  | "income-monthly-reward"
  | "withdraw"
  | "withdraw-history"
  | "investment-withdraw"
  | "investment-history"
  | "profile"
  | "wallet-address"
  | "change-password"
  | "change-tpassword"
  | "ticket-submit"
  | "ticket-view";

export type MenuLeaf = { id: MenuId; label: string };

export type MenuEntry =
  | { kind: "leaf"; id: MenuId; label: string; icon: typeof GridIcon }
  | { kind: "section"; id: string; label: string; icon: typeof GridIcon; children: MenuLeaf[] };

export const MENU: MenuEntry[] = [
  { kind: "leaf", id: "dashboard", label: "Dashboard", icon: GridIcon },
  {
    kind: "section",
    id: "deposit",
    label: "Deposit",
    icon: DepositIcon,
    children: [
      { id: "deposit-fund", label: "Deposit Fund" },
      { id: "deposit-history", label: "Deposit History" },
    ],
  },
  {
    kind: "section",
    id: "genealogy",
    label: "Genealogy",
    icon: TreeIcon,
    children: [
      { id: "direct-team", label: "Direct Team" },
      { id: "level-team", label: "Level Team" },
      { id: "all-team", label: "All Team" },
    ],
  },
  {
    kind: "section",
    id: "investment",
    label: "Investment",
    icon: TrendingUpIcon,
    children: [
      { id: "investment-id", label: "Investment ID" },
      { id: "investment-report", label: "Investment ID Report" },
    ],
  },
  {
    kind: "section",
    id: "staking",
    label: "Staking",
    icon: LayersIcon,
    children: [
      { id: "staking-id", label: "Staking ID" },
      { id: "staking-report", label: "Staking Report" },
    ],
  },
  {
    kind: "section",
    id: "income-report",
    label: "Income Report",
    icon: ReportIcon,
    children: [
      { id: "income-staking-bonus", label: "Staking Trading Bonus" },
      { id: "income-inv-bonus", label: "Inv Trading Bonus" },
      { id: "income-all-bonus", label: "All Invs & Staking Bonus" },
      { id: "income-leadership", label: "Leadership Bonus" },
      { id: "income-monthly-reward", label: "Monthly Rewards Bonus" },
    ],
  },
  {
    kind: "section",
    id: "withdrawal",
    label: "Withdrawal",
    icon: WithdrawIcon,
    children: [
      { id: "withdraw", label: "Withdraw" },
      { id: "withdraw-history", label: "Withdrawal History" },
      { id: "investment-withdraw", label: "Investment Withdraw" },
      { id: "investment-history", label: "Investment History" },
    ],
  },
  {
    kind: "section",
    id: "settings",
    label: "Settings",
    icon: GearIcon,
    children: [
      { id: "profile", label: "Profile" },
      { id: "wallet-address", label: "Wallet Address" },
      { id: "change-password", label: "Change Password" },
      { id: "change-tpassword", label: "Change Transaction Password" },
    ],
  },
  {
    kind: "section",
    id: "ticket-support",
    label: "Ticket Support",
    icon: TicketIcon,
    children: [
      { id: "ticket-submit", label: "Ticket Submit" },
      { id: "ticket-view", label: "View Ticket" },
    ],
  },
];

export function findSectionIdForMenu(id: MenuId): string | null {
  for (const entry of MENU) {
    if (entry.kind === "section" && entry.children.some((c) => c.id === id)) {
      return entry.id;
    }
  }
  return null;
}
