import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { setAdminSessionCookie } from "@/lib/adminSession";
import { logAdminAction } from "@/lib/audit";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const db = await getDb();
  const admin = await db.collection("admins").findOne({
    $or: [{ username }, { email: username.toLowerCase() }],
  });

  if (!admin) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  await setAdminSessionCookie({
    adminId: admin._id.toString(),
    username: admin.username,
    role: admin.role === "super_admin" ? "super_admin" : "admin",
  });

  await logAdminAction(db, {
    actor: admin.username,
    action: "admin.login",
  });

  return NextResponse.json({ username: admin.username, role: admin.role });
}
