import type { NavItem } from '@/types'

export const mainNavItems: NavItem[] = [
  {
    label: '서비스 소개',
    href: '/',
    children: [
      { label: '서비스 개요', href: '/' },
      { label: '멤버 혜택', href: '/benefit' },
    ],
    requiresAuth: false,
  },
  {
    label: 'Coffee Chat',
    href: '/coffeechat',
    requiresAuth: true,
  },
  {
    label: 'CEO Coffee Chat',
    href: '/ceo-coffeechat',
    requiresAuth: true,
  },
  {
    label: 'Community Board',
    href: '/community',
    requiresAuth: true,
  },
  {
    label: 'Position Board',
    href: '/positions',
    requiresAuth: false,
  },
]
