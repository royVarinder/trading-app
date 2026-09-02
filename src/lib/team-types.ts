export type TeamMemberSummary = {
  memberId: string;
  sponsorId: string | null;
  username: string;
  mobile: string;
  createdAt: string; // ISO string — this is the wire format, not a Date
  level: number; // 1 = direct referral, 2 = their referrals, ...
  ownInvested: number; // sum of this member's own investment packages
  subtreeInvested: number; // ownInvested + all descendants' ownInvested
  status: "Active" | "Pending"; // Active iff ownInvested > 0
};

export type LevelSummary = {
  level: number;
  users: number;
  paid: number;
  business: number; // sum of ownInvested at this level only
};

export type TeamSummary = {
  totalDirect: number;
  activeDirect: number;
  pendingDirect: number;
  totalTeam: number;
  activeTeam: number;
  pendingTeam: number;
  directBusiness: number; // sum of ownInvested across direct[] (level 1 only)
  teamBusiness: number;   // sum of ownInvested across allTeam[] (every level)
};

export type TeamSnapshot = {
  direct: TeamMemberSummary[]; // level === 1
  levels: LevelSummary[];
  allTeam: TeamMemberSummary[]; // every level, sorted by createdAt ascending
  summary: TeamSummary;
};
