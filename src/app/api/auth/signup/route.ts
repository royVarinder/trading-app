import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { getNextMemberId } from "@/lib/counters";
import { setSessionCookie } from "@/lib/session";
import { sendAdminEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const sponsorId = typeof body.sponsorId === "string" ? body.sponsorId.trim().toUpperCase() : "";
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const countryCode = typeof body.countryCode === "string" ? body.countryCode.trim() : "";
  const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const transactionPassword =
    typeof body.transactionPassword === "string" ? body.transactionPassword : "";
  const acceptedTerms = Boolean(body.acceptedTerms);

  if (!username || !email || !countryCode || !mobile || !password || !transactionPassword) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }
  if (!acceptedTerms) {
    return NextResponse.json(
      { error: "You must accept the terms & conditions." },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }
  if (transactionPassword.length < 4) {
    return NextResponse.json(
      { error: "Transaction password must be at least 4 characters." },
      { status: 400 }
    );
  }

  const db = await getDb();
  const users = db.collection("users");

  const existing = await users.findOne({
    $or: [{ username }, { email }, { mobile }],
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this username, email, or mobile number already exists." },
      { status: 409 }
    );
  }

  if (sponsorId) {
    const sponsor = await users.findOne({ memberId: sponsorId });
    if (!sponsor) {
      return NextResponse.json(
        { error: "That referral / sponsor ID doesn't match any existing member." },
        { status: 400 }
      );
    }
  }

  const memberId = await getNextMemberId();
  const [passwordHash, transactionPasswordHash] = await Promise.all([
    bcrypt.hash(password, 10),
    bcrypt.hash(transactionPassword, 10),
  ]);

  let insertedId;
  try {
    const result = await users.insertOne({
      memberId,
      sponsorId: sponsorId || null,
      username,
      email,
      countryCode,
      mobile,
      passwordHash,
      transactionPasswordHash,
      createdAt: new Date(),
    });
    insertedId = result.insertedId;
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === 11000) {
      return NextResponse.json(
        { error: "An account with this username, email, or mobile number already exists." },
        { status: 409 }
      );
    }
    throw err;
  }

  await setSessionCookie({
    userId: insertedId.toString(),
    memberId,
    username,
  });

  await sendAdminEmail(
    "New Win FX signup",
    [
      "A new user just signed up.",
      "",
      `Member ID: ${memberId}`,
      `Username: ${username}`,
      `Email: ${email}`,
      `Mobile: ${countryCode}${mobile}`,
      `Sponsor ID: ${sponsorId || "—"}`,
    ].join("\n")
  );

  return NextResponse.json({ memberId, username }, { status: 201 });
}
