import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";

const RANKS = [
  { level: 1, rank: "Promoter", cmsn: "20%", selfInv: "$200", direct: "$1,000", team: "$2,000", reward: "$10" },
  { level: 2, rank: "Performer", cmsn: "40%", selfInv: "$500", direct: "$2,500", team: "$10,000", reward: "$50" },
  { level: 3, rank: "Manager", cmsn: "60%", selfInv: "$1,500", direct: "$5,000", team: "$100,000", reward: "$500" },
  { level: 4, rank: "Director", cmsn: "80%", selfInv: "$5,000", direct: "$15,000", team: "$600,000", reward: "$2,000" },
  { level: 5, rank: "Ambassador", cmsn: "100%", selfInv: "$10,000", direct: "$30,000", team: "$2,400,000", reward: "$10,000" },
  { level: 6, rank: "Crown Ambassador", cmsn: "120%", selfInv: "$25,000", direct: "$50,000", team: "$10,000,000", reward: "$30,000" },
];

export function IncomeMonthlyReward() {
  const rows = RANKS.map((r) => ({
    level: r.level,
    rank: r.rank,
    cmsn: r.cmsn,
    selfInv: r.selfInv,
    direct: r.direct,
    team: r.team,
    reward: r.reward,
    status: <StatusBadge status="Pending" />,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Monthly / Reward Bonus" subtitle="Leadership ranks and the qualification targets for each." />
      <DataTable
        columns={[
          { key: "level", label: "Level" },
          { key: "rank", label: "Leadership Rank" },
          { key: "cmsn", label: "C.MSN" },
          { key: "selfInv", label: "Self Investment" },
          { key: "direct", label: "Direct Business" },
          { key: "team", label: "Team Business" },
          { key: "reward", label: "Monthly Reward" },
          { key: "status", label: "Status" },
        ]}
        rows={rows}
      />
    </div>
  );
}
