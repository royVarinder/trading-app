import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";

type Row = Record<string, string | number>;

function toCsv(rows: Row[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))];
  return lines.join("\n");
}

function dateFilter(from: string | null, to: string | null) {
  const filter: Record<string, Date> = {};
  if (from) filter.$gte = new Date(from);
  if (to) filter.$lte = new Date(to);
  return Object.keys(filter).length ? { createdAt: filter } : {};
}

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "deposits";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const format = url.searchParams.get("format") ?? "json";

  const db = await getDb();
  const range = dateFilter(from, to);

  let rows: Row[] = [];

  if (type === "deposits") {
    const docs = await db.collection("deposits").find(range).sort({ createdAt: -1 }).limit(2000).toArray();
    rows = docs.map((d) => ({
      memberId: d.memberId,
      username: d.username,
      amount: d.amount,
      status: d.status,
      createdAt: new Date(d.createdAt).toISOString(),
    }));
  } else if (type === "withdrawals") {
    const docs = await db.collection("withdrawals").find(range).sort({ createdAt: -1 }).limit(2000).toArray();
    rows = docs.map((w) => ({
      memberId: w.memberId,
      username: w.username,
      type: w.type,
      amount: w.amount,
      netAmount: w.netAmount,
      status: w.status,
      createdAt: new Date(w.createdAt).toISOString(),
    }));
  } else if (type === "signups") {
    const docs = await db.collection("users").find(range).sort({ createdAt: -1 }).limit(2000).toArray();
    rows = docs.map((u) => ({
      memberId: u.memberId,
      username: u.username,
      email: u.email,
      sponsorId: u.sponsorId ?? "",
      createdAt: new Date(u.createdAt).toISOString(),
    }));
  } else {
    return NextResponse.json({ error: "type must be 'deposits', 'withdrawals', or 'signups'." }, { status: 400 });
  }

  if (format === "csv") {
    return new Response(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${type}-report.csv"`,
      },
    });
  }

  return NextResponse.json({ rows });
}
