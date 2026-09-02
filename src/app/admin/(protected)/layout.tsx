import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <AdminShell username={session.username} role={session.role}>
      {children}
    </AdminShell>
  );
}
