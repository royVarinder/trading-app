import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const query = new URL(req.url).searchParams.get("query")?.trim() ?? "";

  const db = await getDb();
  const filter = query
    ? {
        $or: [
          { memberId: { $regex: query, $options: "i" } },
          { username: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
          { mobile: { $regex: query, $options: "i" } },
          { sponsorId: { $regex: query, $options: "i" } },
        ],
      }
    : {};

  const users = await db
    .collection("users")
    .find(filter, {
      projection: {
        memberId: 1,
        username: 1,
        email: 1,
        mobile: 1,
        countryCode: 1,
        sponsorId: 1,
        status: 1,
        createdAt: 1,
      },
    })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  return NextResponse.json({
    members: users.map((u) => ({
      memberId: u.memberId,
      username: u.username,
      email: u.email,
      mobile: `${u.countryCode ?? ""}${u.mobile ?? ""}`,
      sponsorId: u.sponsorId,
      status: u.status === "suspended" ? "suspended" : "active",
      createdAt: u.createdAt,
    })),
  });
}
