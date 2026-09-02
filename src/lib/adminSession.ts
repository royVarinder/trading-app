import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/constants";

export type AdminRole = "super_admin" | "admin";

export type AdminSessionPayload = {
  adminId: string;
  username: string;
  role: AdminRole;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET environment variable");
  // Deliberately reuses the same secret as member sessions (one env var to
  // configure) but a distinct cookie name/payload shape and a shorter
  // lifetime, so a member JWT can never be replayed as an admin session —
  // getAdminSession() below only accepts tokens carrying `role`.
  return secret;
}

export async function setAdminSessionCookie(payload: AdminSessionPayload) {
  const token = jwt.sign(payload, getSecret(), { expiresIn: "12h" });
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSessionCookie() {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE_NAME);
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getSecret()) as Partial<AdminSessionPayload>;
    if (!decoded.adminId || !decoded.username || !decoded.role) return null;
    return decoded as AdminSessionPayload;
  } catch {
    return null;
  }
}
