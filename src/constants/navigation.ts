import type { NavItem } from '@/types'

export const mainNavItems: NavItem[] = [
  {
    label: '서비스 소개',
    href: '/',
    children: [
      { label: '서비스 소개', href: '/' },
      { label: '멤버 소개', href: '/directory' },
      { label: 'Benefit', href: '/benefit' },
    ],
    requiresAuth: false,
  },
  {
    label: '큐레이션 피드',
    href: '/feed',
    badge: 'NEW',
    requiresAuth: true,
  },
  {
    label: '커뮤니티 라운지',
    href: '/community',
    requiresAuth: true,
  },
  {
    label: '커피챗 신청',
    href: '/coffeechat',
    requiresAuth: true,
  },
  {
    label: 'CEO 커피챗',
    href: '/ceo-coffeechat',
    requiresAuth: true,
  },
  {
    label: '채용 포지션',
    href: '/positions',
    requiresAuth: false,
  },
]
