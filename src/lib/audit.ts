import type { Db } from "mongodb";

export type AdminActionInput = {
  actor: string; // admin username
  action: string; // e.g. "deposit.approve", "member.suspend"
  target?: string; // e.g. a memberId or record id the action applies to
  details?: Record<string, unknown>;
};

/**
 * Every admin mutation (approvals, rejections, balance adjustments, settings
 * changes, ticket replies, ...) should call this so there is always a record
 * of who did what. This is the audit trail the project previously had zero
 * of — see docs/admin-panel-features.md §3.12.
 */
export async function logAdminAction(db: Db, input: AdminActionInput): Promise<void> {
  await db.collection("adminActions").insertOne({
    actor: input.actor,
    action: input.action,
    target: input.target ?? null,
    details: input.details ?? null,
    createdAt: new Date(),
  });
}
