import { NextResponse } from "next/server";
import { getAdminSession, type AdminSessionPayload } from "@/lib/adminSession";

/**
 * Shared auth guard for every /api/admin/* route handler. Returns either the
 * verified admin session or a ready-to-return 401 response, so callers do:
 *
 *   const guard = await requireAdmin();
 *   if ("response" in guard) return guard.response;
 *   const { session } = guard;
 */
export async function requireAdmin(): Promise<
  { session: AdminSessionPayload } | { response: NextResponse }
> {
  const session = await getAdminSession();
  if (!session) {
    return { response: NextResponse.json({ error: "Not authenticated." }, { status: 401 }) };
  }
  return { session };
}

/** Super-admin-only guard (settings, admin account management). */
export async function requireSuperAdmin(): Promise<
  { session: AdminSessionPayload } | { response: NextResponse }
> {
  const guard = await requireAdmin();
  if ("response" in guard) return guard;
  if (guard.session.role !== "super_admin") {
    return { response: NextResponse.json({ error: "Super admin access required." }, { status: 403 }) };
  }
  return guard;
}
