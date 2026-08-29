import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";

export function AllTeam({ memberId }: { memberId: string }) {
  const rows = [
    { "#": 1, join: "2026-08-10", id: "WF10045", name: "Aditya Sharma", sponsor: memberId, status: <StatusBadge status="Active" /> },
    { "#": 2, join: "2026-08-14", id: "WF10046", name: "Priya Verma", sponsor: memberId, status: <StatusBadge status="Pending" /> },
    { "#": 3, join: "2026-08-20", id: "WF10078", name: "Rohit Kumar", sponsor: "WF10045", status: <StatusBadge status="Pending" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="All Team Report" subtitle="Every member across your entire downline." />
      <DataTable
        columns={[
          { key: "#", label: "S.No" },
          { key: "join", label: "Date of Join" },
          { key: "id", label: "Member Id" },
          { key: "name", label: "Name" },
          { key: "sponsor", label: "Sponsor ID" },
          { key: "status", label: "Status" },
        ]}
        rows={rows}
      />
    </div>
  );
}
