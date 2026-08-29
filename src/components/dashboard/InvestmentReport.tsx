import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";

export function InvestmentReport({ memberId }: { memberId: string }) {
  const rows = [
    { "#": 1, id: memberId, package: "$50.00", date: "2026-08-25", type: "Investment" },
    { "#": 2, id: memberId, package: "$50.00", date: "2026-07-25", type: "Investment" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Investment Report" subtitle="Every investment package you have purchased." />
      <DataTable
        columns={[
          { key: "#", label: "#" },
          { key: "id", label: "Member Id" },
          { key: "package", label: "Package" },
          { key: "date", label: "Date" },
          { key: "type", label: "Type" },
        ]}
        rows={rows}
      />
    </div>
  );
}
