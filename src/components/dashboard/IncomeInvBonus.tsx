import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";

export function IncomeInvBonus({ memberId }: { memberId: string }) {
  const rows = [
    { "#": 1, id: memberId, package: "$50.00", income: "$0.25", date: "2026-08-28" },
    { "#": 2, id: memberId, package: "$50.00", income: "$0.25", date: "2026-08-27" },
    { "#": 3, id: memberId, package: "$50.00", income: "$0.25", date: "2026-08-26" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Investment Trading Bonus" subtitle="Daily trading bonus earned on your investment package." />
      <DataTable
        columns={[
          { key: "#", label: "#" },
          { key: "id", label: "Member ID" },
          { key: "package", label: "Package" },
          { key: "income", label: "Income" },
          { key: "date", label: "Date" },
        ]}
        rows={rows}
      />
    </div>
  );
}
