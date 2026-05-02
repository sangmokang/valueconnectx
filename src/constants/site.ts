export const SITE_NAME = 'ValueConnect X';
export const SITE_DESCRIPTION =
  '검증된 핵심 인재 네트워크와 기업 리더를 연결하는 Private Talent Network';

export const DESIGN_TOKENS = {
  colors: {
    primary: '#0A0A0A',
    secondary: '#1A1A1A',
    accent: '#c9a84c',
    background: '#FFFFFF',
    backgroundDark: '#0A0A0A',
    deepNavy: '#0F172A',
    textPrimary: '#0A0A0A',
    textSecondary: '#6B6B6B',
    textMuted: '#9B9B9B',
    border: '#E5E5E5',
    borderDark: '#2A2A2A',
  },
  fonts: {
    sans: 'var(--font-geist-sans)',
    mono: 'var(--font-geist-mono)',
  },
  spacing: {
    section: '120px',
    container: '1280px',
    gutter: '40px',
  },
} as const;

export const HERO_COPY = {
  h1: 'Invite-only\nPrivate Talent Network',
  paragraphs: [
    '검증된 핵심 인재는 아무 네트워크에나 머물지 않습니다.',
    'ValueConnect X는 검증된 핵심 인재와 의사결정자가\n신뢰 기반으로 연결되는 Private Network입니다.',
  ],
  cta: {
    primary: '초대 수락하기',
    secondary: '서비스 소개 보기',
  },
} as const;

export const CLOSING_COPY = {
  quote:
    '초대, 검증, 큐레이션, 커피챗이 하나의 흐름으로 이어질 때,\n핵심 인재는 더 조용하고 신뢰할 수 있는 방식으로 다음 선택지를 발견합니다.',
  cta: {
    primary: '초대 수락하기',
    secondary: '더 알아보기',
  },
} as const;
