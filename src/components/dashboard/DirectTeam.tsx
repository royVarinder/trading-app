import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";

export function DirectTeam({ memberId }: { memberId: string }) {
  const rows = [
    { "#": 1, id: "WF10045", name: "Aditya Sharma", sponsor: memberId, mobile: "98xxxxxx01", package: "$100", business: "$250", status: <StatusBadge status="Active" /> },
    { "#": 2, id: "WF10046", name: "Priya Verma", sponsor: memberId, mobile: "98xxxxxx02", package: "$0", business: "$0", status: <StatusBadge status="Pending" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Direct Team" subtitle="Members you have personally sponsored." />
      <DataTable
        columns={[
          { key: "#", label: "#" },
          { key: "id", label: "User ID" },
          { key: "name", label: "Name" },
          { key: "sponsor", label: "Sponsor Id" },
          { key: "mobile", label: "Mobile No" },
          { key: "package", label: "Package" },
          { key: "business", label: "All Business" },
          { key: "status", label: "Status" },
        ]}
        rows={rows}
      />
    </div>
  );
}
