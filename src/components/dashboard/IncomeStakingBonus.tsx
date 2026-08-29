import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";

export function IncomeStakingBonus({ memberId }: { memberId: string }) {
  const rows = [
    { "#": 1, id: memberId, staking: "$500.00", days: 100, level: 1, income: "$3.00", date: "28-08-2026" },
    { "#": 2, id: memberId, staking: "$500.00", days: 100, level: 1, income: "$3.00", date: "27-08-2026" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Staking Trading Bonus" subtitle="Daily trading bonus earned on your staked funds." />
      <DataTable
        columns={[
          { key: "#", label: "#" },
          { key: "id", label: "Member ID" },
          { key: "staking", label: "Staking" },
          { key: "days", label: "Days" },
          { key: "level", label: "Level" },
          { key: "income", label: "Income" },
          { key: "date", label: "Date" },
        ]}
        rows={rows}
      />
    </div>
  );
}
