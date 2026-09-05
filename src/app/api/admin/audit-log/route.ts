import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET() {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const db = await getDb();
  const entries = await db.collection("adminActions").find({}).sort({ createdAt: -1 }).limit(300).toArray();

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e._id.toString(),
      actor: e.actor,
      action: e.action,
      target: e.target,
      details: e.details,
      createdAt: e.createdAt,
    })),
  });
}
