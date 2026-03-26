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
}

// Position
export interface Position {
  id: string;
  title: string;
  company: string;
  department: string;
  level: string;
  description: string;
  postedAt: string;
}

// Community
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
