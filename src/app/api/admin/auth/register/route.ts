import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { logAdminAction } from "@/lib/audit";

// Creates an admin account over HTTP. There is deliberately no public admin
// signup — this route only exists for operators who don't have shell/DB
// access (e.g. remote EC2 setup) and must be gated by ADMIN_SETUP_SECRET.
//
// Fails CLOSED: if ADMIN_SETUP_SECRET isn't set, the route refuses to run
// at all rather than falling back to "unguarded" (unlike the CRON_SECRET
// pattern elsewhere in this codebase) — creating a privileged account is a
// much higher-stakes action than triggering a cron job.
//
// Unlike scripts/create-admin.mjs, this route only CREATES — it 409s on an
// existing username/email instead of silently resetting the password, so a
// leaked secret can't be used to take over an existing admin's account.
export async function POST(req: Request) {
  const setupSecret = process.env.ADMIN_SETUP_SECRET;
  if (!setupSecret) {
    return NextResponse.json(
      { error: "Admin registration is not configured (ADMIN_SETUP_SECRET is not set)." },
      { status: 503 }
    );
  }

  const provided = req.headers.get("x-admin-setup-secret");
  if (provided !== setupSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role === "super_admin" ? "super_admin" : "admin";

  if (!username || !email || !password) {
    return NextResponse.json(
      { error: "username, email, and password are required." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const db = await getDb();
  const admins = db.collection("admins");

  const existing = await admins.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    return NextResponse.json(
      { error: "An admin with this username or email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await admins.insertOne({
    username,
    email,
    passwordHash,
    role,
    createdAt: new Date(),
  });

  await logAdminAction(db, {
    actor: username,
    action: "admin.register",
    target: username,
    details: { role, via: "api" },
  });

  return NextResponse.json({ username, email, role }, { status: 201 });
}
