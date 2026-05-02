import { NavItem } from '@/types';

export const navigationItems: NavItem[] = [
  {
    label: '서비스 소개',
    href: '/',
    children: [
      { label: '서비스 소개', href: '/' },
      { label: '멤버 디렉토리', href: '/directory' },
      { label: '멤버십 혜택', href: '/benefit' },
    ],
  },
  { label: '큐레이션 피드', href: '/feed' },
  { label: '멤버 커피챗', href: '/coffeechat' },
  { label: 'CEO 커피챗', href: '/ceo-coffeechat' },
  { label: '커뮤니티 라운지', href: '/community' },
];
