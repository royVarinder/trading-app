import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export type SessionPayload = {
  userId: string;
  memberId: string;
  username: string;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET environment variable");
  return secret;
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = jwt.sign(payload, getSecret(), { expiresIn: "7d" });
  const store = await cookies();

  // Browsers silently drop `Secure` cookies on a plain HTTP connection, so
  // basing this on NODE_ENV alone breaks logins on any production build
  // (`next start`) that isn't served behind TLS — e.g. a LAN IP or a bare
  // EC2 instance on port 80/3000 without an HTTPS reverse proxy/ALB in
  // front of it. Only mark the cookie Secure when the request that's
  // actually being served is HTTPS (via x-forwarded-proto behind a proxy
  // like Vercel/ALB/nginx, or FORCE_SECURE_COOKIE=true if TLS terminates
  // directly in Node without a proxy in front).
  const proto = (await headers()).get("x-forwarded-proto");
  const secure = proto === "https" || process.env.FORCE_SECURE_COOKIE === "true";

  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, getSecret()) as SessionPayload;
  } catch {
    return null;
  }
}
