import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const status = new URL(req.url).searchParams.get("status");
  const db = await getDb();
  const filter = status && status !== "All" ? { status } : {};
  const tickets = await db.collection("tickets").find(filter).sort({ createdAt: -1 }).limit(300).toArray();

  return NextResponse.json({
    tickets: tickets.map((t) => ({
      id: t._id.toString(),
      memberId: t.memberId,
      username: t.username,
      message: t.message,
      reply: t.reply ?? null,
      repliedBy: t.repliedBy ?? null,
      repliedAt: t.repliedAt ?? null,
      status: t.status,
      createdAt: t.createdAt,
    })),
  });
}
