// Member types
export type MemberType = 'core' | 'endorsed';

export interface Member {
  id: string;
  name: string;
  role: string;
  company: string;
  memberType: MemberType;
  specialties: string[];
  joinedAt: string;
}

export interface CorporateUser {
  id: string;
  name: string;
  title: string;
  company: string;
  type: 'ceo' | 'founder' | 'clevel' | 'hr';
}

// Coffee Chat
export interface CoffeeChatPost {
  id: string;
  author: Member;
  memberType: MemberType;
  title: string;
  body: string;
  tags: string[];
  secretCommentCount: number;
  createdAt: string;
  isNew: boolean;
}

export interface CeoSession {
  id: string;
  title: string;
  description: string;
  session_date: string;
  max_participants: number;
  status: 'open' | 'closed' | 'completed' | 'cancelled';
  tags: string[];
  application_count: number;
  host: {
    id: string;
    name: string;
    title: string | null;
    company: string;
    role: string;
    company_desc?: string | null;
  } | null;
  // Derived / enriched fields
  deadline_label?: string;
  slots_remaining?: number;
  looking_for?: string;
  signal?: string;
}

export interface PeerSession {
  id: string;
  authorBadge: 'Core' | 'Endorsed';
  role: string;
  want: string;
  topic: string;
  tags: string[];
  applicants: number;
  posted: string;
  status: 'open' | 'matched' | 'closed';
}

// Service Pillars (서비스 소개 페이지용)
export interface ServicePillar {
  number: string;
  englishName: string;
  koreanTitle: string;
  description: string;
  insight: string;
}

// Navigation
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
  isActive?: boolean;
  requiresAuth?: boolean;
  badge?: string;
}

// Position
export interface Position {
  id: string;
  title: string;
  company: string;
  companyTag?: string;
  department: string;
  level: string;
  description: string;
  postedAt: string;
  score?: number;
  domain?: string;
  tags?: string[];
  exclusive?: boolean;
  salaryBand?: string;
  teamSize?: string;
  location?: string;
  summary?: string;
  fullDesc?: string;
  texture?: string[];
  reqs?: string[];
}

// Community / Lounge
export type LoungeCategoryKey = 'all' | 'reading' | 'career' | 'company' | 'leadership' | 'productivity' | 'casual';

export interface LoungeCategory {
  key: LoungeCategoryKey;
  icon: string;
  label: string;
}

export type CommunityCategory =
  | '커리어 고민'
  | '조직 고민·리더쉽'
  | '연봉 협상'
  | '번아웃'
  | '생산성·News'
  | '이 회사 어때요?';

export interface CommunityPost {
  id: string;
  category: CommunityCategory;
  title: string;
  body: string;
  likes: number;
  comments: number;
  createdAt: string;
}

// Feed
export interface FeedItem {
  id: string;
  company: string;
  company_tag: string | null;
  role: string;
  level: string | null;
  team_size: string | null;
  salary_band: string | null;
  location: string | null;
  tags: string[];
  summary: string | null;
  exclusive: boolean;
  published_at: string;
  user_response: 'yes' | 'skip' | null;
}
