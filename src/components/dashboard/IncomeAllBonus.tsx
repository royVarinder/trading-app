import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";

export function IncomeAllBonus({ memberId }: { memberId: string }) {
  const rows = [
    { "#": 1, id: memberId, investment: "$50.00", level: 1, income: "$0.25", type: "Investment", date: "28-08-2026" },
    { "#": 2, id: memberId, investment: "$500.00", level: 1, income: "$3.00", type: "Staking", date: "28-08-2026" },
    { "#": 3, id: memberId, investment: "$50.00", level: 1, income: "$0.25", type: "Investment", date: "27-08-2026" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="All Investment & Staking Bonus" subtitle="Combined trading bonus from every source." />
      <DataTable
        columns={[
          { key: "#", label: "#" },
          { key: "id", label: "Member ID" },
          { key: "investment", label: "Investment" },
          { key: "level", label: "Level" },
          { key: "income", label: "Income" },
          { key: "type", label: "Type" },
          { key: "date", label: "Date" },
        ]}
        rows={rows}
      />
    </div>
  );
}
