import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json({ error: "Missing or invalid reset link." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const db = await getDb();
  const resetDoc = await db.collection("passwordResets").findOne({ token });

  if (!resetDoc || resetDoc.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Please request a new one." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.collection("users").updateOne({ memberId: resetDoc.memberId }, { $set: { passwordHash } });
  await db.collection("passwordResets").deleteMany({ memberId: resetDoc.memberId });

  return NextResponse.json({ ok: true });
}
