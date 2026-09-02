import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession, setSessionCookie } from "@/lib/session";
import { sendMail } from "@/lib/mailer";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne(
    { memberId: session.memberId },
    { projection: { passwordHash: 0, transactionPasswordHash: 0 } }
  );

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      memberId: user.memberId,
      username: user.username,
      email: user.email,
      countryCode: user.countryCode,
      mobile: user.mobile,
      sponsorId: user.sponsorId ?? null,
      createdAt: user.createdAt,
    },
  });
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const countryCode = typeof body.countryCode === "string" ? body.countryCode.trim() : "";
  const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";

  if (!username || !email || !countryCode || !mobile) {
    return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const db = await getDb();
  const users = db.collection("users");

  const conflict = await users.findOne({
    memberId: { $ne: session.memberId },
    $or: [{ username }, { email }, { mobile }],
  });
  if (conflict) {
    return NextResponse.json(
      { error: "That username, email, or mobile number is already in use by another account." },
      { status: 409 }
    );
  }

  await users.updateOne(
    { memberId: session.memberId },
    { $set: { username, email, countryCode, mobile } }
  );

  // Re-issue the session so the sidebar/greeting reflect the new name right away,
  // without requiring the user to log in again.
  await setSessionCookie({ userId: session.userId, memberId: session.memberId, username });

  await sendMail(
    email,
    "Your PRIMEFX profile was updated",
    [
      `Hi ${username},`,
      "",
      "Your PRIMEFX profile was just updated. Here are your current details:",
      `Name: ${username}`,
      `Email: ${email}`,
      `Mobile: ${countryCode} ${mobile}`,
      "",
      "If you didn't make this change, please contact support immediately.",
    ].join("\n")
  );

  const updated = await users.findOne(
    { memberId: session.memberId },
    { projection: { passwordHash: 0, transactionPasswordHash: 0 } }
  );
  if (!updated) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      memberId: updated.memberId,
      username: updated.username,
      email: updated.email,
      countryCode: updated.countryCode,
      mobile: updated.mobile,
      sponsorId: updated.sponsorId ?? null,
      createdAt: updated.createdAt,
    },
  });
}
