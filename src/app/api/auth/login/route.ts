import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { setSessionCookie } from "@/lib/session";
import { sendAdminEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const memberId = typeof body.memberId === "string" ? body.memberId.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!memberId || !password) {
    return NextResponse.json(
      { error: "Member ID and password are required." },
      { status: 400 }
    );
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({
    $or: [{ memberId }, { username: memberId }, { email: memberId.toLowerCase() }],
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid member ID or password." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid member ID or password." }, { status: 401 });
  }

  await setSessionCookie({
    userId: user._id.toString(),
    memberId: user.memberId,
    username: user.username,
  });

  await sendAdminEmail(
    "Win FX login",
    [
      "A user just logged in.",
      "",
      `Member ID: ${user.memberId}`,
      `Username: ${user.username}`,
      `Time: ${new Date().toLocaleString()}`,
    ].join("\n")
  );

  return NextResponse.json({ memberId: user.memberId, username: user.username });
}
