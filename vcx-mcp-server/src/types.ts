export interface Member {
  id: string;
  name: string;
  tier: "CORE" | "INTRO";
  title: string;
  company: string;
  expertise: string[];
  joinedAt: string;
  bio?: string;
}

export interface Position {
  id: string;
  company: string;
  title: string;
  level: string;
  industry: string;
  stage: string;
  location: string;
  description: string;
  quotes: string[];
  tags: string[];
  aiMatchScore: number;
  isExclusive48h: boolean;
  postedAt: string;
  category: string;
}

export interface CoffeeChat {
  id: string;
  author: Member;
  title: string;
  body: string;
  tags: string[];
  secretApplyCount: number;
  postedAt: string;
  expiresAt: string;
}

export interface CeoSession {
  id: string;
  ceoName: string;
  ceoTitle: string;
  company: string;
  industry: string;
  companySize: string;
  format: "online" | "offline";
  duration: number;
  schedule: string;
  totalSlots: number;
  remainingSlots: number;
  description: string;
  postedAt: string;
}

export interface AnonymousPost {
  id: string;
  category: string;
  title: string;
  body: string;
  views: number;
  reactions: Record<string, number>;
  commentCount: number;
  postedAt: string;
}

export interface UserProfile {
  member: Member;
  matchedPositions: number;
  unreadNotifications: number;
  pendingCoffeeChats: number;
  activeApplications: number;
}
