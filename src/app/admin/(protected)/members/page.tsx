"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/shared/Skeleton";

type Member = {
  memberId: string;
  username: string;
  email: string;
  mobile: string;
  sponsorId: string | null;
  status: string;
  createdAt: string;
};

export default function AdminMembersPage() {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMembers(null);
      fetch(`/api/admin/members?query=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => (data.error ? setError(data.error) : setMembers(data.members)))
        .catch(() => setError("Unable to load members."));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const rows =
    members?.map((m, i) => ({
      "#": i + 1,
      member: (
        <Link href={`/admin/members/${m.memberId}`} className="font-semibold text-brand-purple hover:underline">
          {m.memberId}
        </Link>
      ),
      username: m.username,
      email: m.email,
      mobile: m.mobile,
      sponsor: m.sponsorId ?? "—",
      status: <StatusBadge status={m.status} />,
      joined: new Date(m.createdAt).toLocaleDateString(),
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Members" subtitle="Search the full member directory." />

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by Member ID, username, email, mobile, or sponsor ID..."
        className="field-input max-w-md"
      />

      {error && (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {members === null && !error ? (
        <TableSkeleton columns={7} rows={5} />
      ) : (
        <DataTable
          columns={[
            { key: "#", label: "#" },
            { key: "member", label: "Member ID" },
            { key: "username", label: "Username" },
            { key: "email", label: "Email" },
            { key: "mobile", label: "Mobile" },
            { key: "sponsor", label: "Sponsor" },
            { key: "status", label: "Status" },
            { key: "joined", label: "Joined" },
          ]}
          rows={rows}
          emptyMessage="No members match that search."
        />
      )}
    </div>
  );
}
