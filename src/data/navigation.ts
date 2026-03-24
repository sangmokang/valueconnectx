import { NavItem } from '@/types';

export const navigationItems: NavItem[] = [
  {
    label: '서비스 소개',
    href: '/',
    children: [
      { label: '서비스 소개', href: '/' },
      { label: 'Member Directory', href: '/directory' },
      { label: 'Benefit', href: '/benefit' },
    ],
  },
  { label: 'Coffee Chat', href: '/coffeechat' },
  { label: 'CEO Coffee Chat', href: '/ceo-coffeechat' },
  { label: 'Community Board', href: '/community' },
  { label: 'Position Board', href: '/positions' },
];
