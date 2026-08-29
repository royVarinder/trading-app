import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";

export function StakingReport({ memberId }: { memberId: string }) {
  const rows = [{ "#": 1, id: memberId, staking: "$500.00", days: 100, date: "2026-08-26", type: "Staking" }];

  return (
    <div className="space-y-6">
      <PageHeader title="Staking Report" subtitle="Every staking plan you have active or completed." />
      <DataTable
        columns={[
          { key: "#", label: "#" },
          { key: "id", label: "Member Id" },
          { key: "staking", label: "Staking" },
          { key: "days", label: "Days" },
          { key: "date", label: "Date" },
          { key: "type", label: "Type" },
        ]}
        rows={rows}
      />
    </div>
  );
}
