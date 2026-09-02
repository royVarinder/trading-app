import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { HomeShell } from "@/components/HomeShell";
import { runDailyAccrual } from "@/lib/accrual";

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  await runDailyAccrual();

  return <HomeShell username={session.username} memberId={session.memberId} />;
}
