"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Sidebar } from "@/components/Sidebar";
import { MenuIcon } from "@/components/icons";
import type { MenuId } from "@/components/dashboard/menu";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { DepositFund } from "@/components/dashboard/DepositFund";
import { DepositHistory } from "@/components/dashboard/DepositHistory";
import { DirectTeam } from "@/components/dashboard/DirectTeam";
import { LevelTeam } from "@/components/dashboard/LevelTeam";
import { AllTeam } from "@/components/dashboard/AllTeam";
import { InvestmentId } from "@/components/dashboard/InvestmentId";
import { InvestmentReport } from "@/components/dashboard/InvestmentReport";
import { StakingId } from "@/components/dashboard/StakingId";
import { StakingReport } from "@/components/dashboard/StakingReport";
import { IncomeStakingBonus } from "@/components/dashboard/IncomeStakingBonus";
import { IncomeDepositBonus } from "@/components/dashboard/IncomeDepositBonus";
import { IncomeInvBonus } from "@/components/dashboard/IncomeInvBonus";
import { IncomeAllBonus } from "@/components/dashboard/IncomeAllBonus";
import { IncomeLeadership } from "@/components/dashboard/IncomeLeadership";
import { IncomeMonthlyReward } from "@/components/dashboard/IncomeMonthlyReward";
import { Withdraw } from "@/components/dashboard/Withdraw";
import { WithdrawHistory } from "@/components/dashboard/WithdrawHistory";
import { InvestmentWithdraw } from "@/components/dashboard/InvestmentWithdraw";
import { InvestmentHistory } from "@/components/dashboard/InvestmentHistory";
import { Profile } from "@/components/dashboard/Profile";
import { WalletAddress } from "@/components/dashboard/WalletAddress";
import { ChangePassword } from "@/components/dashboard/ChangePassword";
import { ChangeTransactionPassword } from "@/components/dashboard/ChangeTransactionPassword";
import { TicketSubmit } from "@/components/dashboard/TicketSubmit";
import { ViewTicket } from "@/components/dashboard/ViewTicket";

export function HomeShell({ username, memberId }: { username: string; memberId: string }) {
  const router = useRouter();
  const [active, setActive] = useState<MenuId>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const content: Record<MenuId, React.ReactNode> = {
    dashboard: <DashboardView memberId={memberId} />,
    "deposit-fund": <DepositFund />,
    "deposit-history": <DepositHistory memberId={memberId} />,
    "direct-team": <DirectTeam memberId={memberId} />,
    "level-team": <LevelTeam />,
    "all-team": <AllTeam memberId={memberId} />,
    "investment-id": <InvestmentId memberId={memberId} />,
    "investment-report": <InvestmentReport memberId={memberId} />,
    "staking-id": <StakingId memberId={memberId} />,
    "staking-report": <StakingReport memberId={memberId} />,
    "income-staking-bonus": <IncomeStakingBonus memberId={memberId} />,
    "income-deposit-bonus": <IncomeDepositBonus memberId={memberId} />,
    "income-inv-bonus": <IncomeInvBonus memberId={memberId} />,
    "income-all-bonus": <IncomeAllBonus memberId={memberId} />,
    "income-leadership": <IncomeLeadership memberId={memberId} />,
    "income-monthly-reward": <IncomeMonthlyReward />,
    withdraw: <Withdraw />,
    "withdraw-history": <WithdrawHistory memberId={memberId} username={username} />,
    "investment-withdraw": <InvestmentWithdraw />,
    "investment-history": <InvestmentHistory memberId={memberId} username={username} />,
    profile: <Profile />,
    "wallet-address": <WalletAddress />,
    "change-password": <ChangePassword />,
    "change-tpassword": <ChangeTransactionPassword />,
    "ticket-submit": <TicketSubmit memberId={memberId} />,
    "ticket-view": <ViewTicket memberId={memberId} />,
  };

  return (
    <div className="fincept flex h-screen w-full overflow-hidden bg-[color:var(--fincept-bg)]">
      <Sidebar
        active={active}
        onSelect={setActive}
        username={username}
        memberId={memberId}
        onLogout={handleLogout}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-[color:var(--fincept-border)] bg-[color:var(--fincept-card)] px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-1.5 text-[color:var(--fincept-text-muted)] hover:bg-white/5"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <Image src="/primeLogo.png" alt="PRIMEFX" width={28} height={28} className="rounded-lg" />
          <span className="text-sm font-bold tracking-wide text-[color:var(--fincept-text)]">PRIMEFX</span>
        </div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{content[active]}</main>
      </div>
    </div>
  );
}
