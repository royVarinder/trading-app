export const SESSION_COOKIE_NAME = "primefx_session";
export const ADMIN_SESSION_COOKIE_NAME = "primefx_admin_session";

// Minimum amount a member may submit on a single deposit request.
export const MIN_DEPOSIT_AMOUNT = 50;

// A member must have this much in lifetime *approved* deposits before they're
// allowed to sponsor/refer new signups (see src/lib/fund.ts#getTotalApprovedDeposits).
export const REFERRAL_DEPOSIT_THRESHOLD = 50;
