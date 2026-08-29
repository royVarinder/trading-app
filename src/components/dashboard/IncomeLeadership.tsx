import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";

export function IncomeLeadership() {
  return (
    <div className="space-y-6">
      <PageHeader title="Leadership Bonus" subtitle="Rank-based bonus earned from your team's investments." />
      <DataTable
        columns={[
          { key: "#", label: "#" },
          { key: "id", label: "Member Id" },
          { key: "rank", label: "My Rank" },
          { key: "refId", label: "Ref. ID" },
          { key: "refName", label: "Ref. Name" },
          { key: "level", label: "Level" },
          { key: "refInv", label: "Ref. Inv." },
          { key: "refRoi", label: "Ref. ROI" },
          { key: "type", label: "Type" },
          { key: "income", label: "Income" },
          { key: "date", label: "Date" },
        ]}
        rows={[]}
        emptyMessage="No leadership bonus earned yet — reach a ranked position to unlock this."
      />
    </div>
  );
}
