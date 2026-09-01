import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getTeamSnapshot } from "@/lib/team";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const snapshot = await getTeamSnapshot(session.memberId);
  return NextResponse.json(snapshot);
}
