import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";

const LEVELS = [
  { level: 1, users: 2, paid: 1, business: "$100" },
  { level: 2, users: 1, paid: 0, business: "$0" },
  { level: 3, users: 0, paid: 0, business: "$0" },
  { level: 4, users: 0, paid: 0, business: "$0" },
  { level: 5, users: 0, paid: 0, business: "$0" },
];

export function LevelTeam() {
  const rows = LEVELS.map((l) => ({
    "#": l.level,
    level: `Level-${l.level}`,
    users: l.users,
    paid: l.paid,
    business: l.business,
    action: (
      <button type="button" className="btn-solid !py-1.5 !px-3 !text-xs" title="Demo only">
        View Team
      </button>
    ),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Level Team" subtitle="Your downline broken out by level." />
      <DataTable
        columns={[
          { key: "#", label: "#" },
          { key: "level", label: "Level" },
          { key: "users", label: "Total Users" },
          { key: "paid", label: "Total Paid Users" },
          { key: "business", label: "Team Business" },
          { key: "action", label: "Action" },
        ]}
        rows={rows}
      />
    </div>
  );
}
