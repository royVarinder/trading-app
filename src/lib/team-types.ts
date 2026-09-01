export type TeamMemberSummary = {
  memberId: string;
  sponsorId: string | null;
  username: string;
  mobile: string;
  createdAt: string; // ISO string — this is the wire format, not a Date
  level: number; // 1 = direct referral, 2 = their referrals, ...
  ownApproved: number; // sum of this member's own approved deposits
  subtreeApproved: number; // ownApproved + all descendants' ownApproved
  status: "Active" | "Pending"; // Active iff ownApproved > 0
};

export type LevelSummary = {
  level: number;
  users: number;
  paid: number;
  business: number; // sum of ownApproved at this level only
};

export type TeamSummary = {
  totalDirect: number;
  activeDirect: number;
  pendingDirect: number;
  totalTeam: number;
  activeTeam: number;
  pendingTeam: number;
};

export type TeamSnapshot = {
  direct: TeamMemberSummary[]; // level === 1
  levels: LevelSummary[];
  allTeam: TeamMemberSummary[]; // every level, sorted by createdAt ascending
  summary: TeamSummary;
};
