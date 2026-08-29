import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/mongodb";
import { sendMail } from "@/lib/mailer";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
  if (!identifier) {
    return NextResponse.json({ error: "Enter your Member ID or email address." }, { status: 400 });
  }

  const genericResponse = NextResponse.json({
    ok: true,
    message: "If an account matches that Member ID or email, we've sent a password reset link to it.",
  });

  const db = await getDb();
  const user = await db.collection("users").findOne({
    $or: [{ memberId: identifier.toUpperCase() }, { email: identifier.toLowerCase() }],
  });

  // Always respond the same way whether or not the account exists, so this
  // endpoint can't be used to enumerate registered emails / member IDs.
  if (!user) {
    return genericResponse;
  }

  const token = crypto.randomBytes(32).toString("hex");
  await db.collection("passwordResets").insertOne({
    userId: user._id.toString(),
    memberId: user.memberId,
    token,
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    createdAt: new Date(),
  });

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;
  const resetLink = `${origin}/reset-password?token=${token}`;

  await sendMail(
    user.email,
    "Reset your Win FX password",
    [
      `Hi ${user.username},`,
      "",
      "We received a request to reset your Win FX password. Click the link below to choose a new one:",
      resetLink,
      "",
      "This link expires in 1 hour. If you didn't request this, you can safely ignore this email.",
    ].join("\n")
  );

  return genericResponse;
}
