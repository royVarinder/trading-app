import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { HomeShell } from "@/components/HomeShell";

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return <HomeShell username={session.username} memberId={session.memberId} />;
}
