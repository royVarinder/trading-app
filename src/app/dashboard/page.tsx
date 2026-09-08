import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { HomeShell } from "@/components/HomeShell";
import { runAllAccruals } from "@/lib/accrual";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  await runAllAccruals();

  return <HomeShell username={session.username} memberId={session.memberId} />;
}
